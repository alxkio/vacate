"""Offline regression checks for release ordering and mandatory database gates."""

from itertools import product
from pathlib import Path
import os
import re
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[1]


class DatabaseDeploymentWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.workflow = (ROOT / ".github/workflows/azure-infrastructure.yml").read_text()
        self.ci = (ROOT / ".github/workflows/ci.yml").read_text()

    def job(self, workflow, name):
        match = re.search(
            rf"^  {re.escape(name)}:\n.*?(?=^  [\w-]+:\n|\Z)",
            workflow,
            re.M | re.S,
        )
        self.assertIsNotNone(match, f"Missing workflow job: {name}")
        return match.group()

    def assert_deployment_blocks_failure(self, workflow):
        release = self.job(workflow, "deploy")
        self.assertNotRegex(release, r"(?m)^\s*continue-on-error:")
        database = release.index("- name: Deploy and verify database")
        self.assertNotRegex(release[database:], r"\balways\s*\(")

    def test_database_failure_blocks_both_application_publications(self):
        release = self.job(self.workflow, "deploy")
        positions = [
            release.index("- name: " + name)
            for name in (
                "Deploy infrastructure",
                "Deploy and verify database",
                "Publish API",
                "Publish Angular",
            )
        ]
        self.assertEqual(positions, sorted(positions))
        gate = release[positions[1]:positions[2]]
        self.assertIn("inputs.apply && inputs.deploy_backend", gate)
        self.assertIn("steps.infrastructure.outputs.sql_enabled == 'true'", gate)
        self.assertIn('test -n "$VACATE_SQL_CONNECTION"', gate)
        self.assertIn('test "$(cat artifacts/database/revision.txt)" = "$GITHUB_SHA"', gate)
        self.assertIn('Vacate.Database.dll deploy "$RUNTIME_NAME" "$RUNTIME_CLIENT_ID"', gate)
        self.assertIn("VACATE_REQUIRE_DEVELOPMENT_LOGINS: ${{ inputs.environment == 'dev' }}", gate)
        self.assert_deployment_blocks_failure(self.workflow)
        self.assertIn("sql_enabled=$(jq -er", self.workflow)
        self.assertIn('echo "sql_enabled=$sql_enabled"', self.workflow)

    def test_cleanup_failure_tolerance_is_outside_the_deployment_job(self):
        cleanup = self.job(self.workflow, "cleanup-artifacts")
        self.assertIn("continue-on-error: true", cleanup)
        self.assertIn("always()", cleanup)
        self.assert_deployment_blocks_failure(self.workflow)

    def test_artifact_cleanup_permission_is_scoped_to_cleanup_jobs(self):
        cleanup = self.job(self.ci, "cleanup-pr-artifacts")
        self.assertIn("      actions: write", cleanup)
        self.assertIn("      actions: write", self.job(self.workflow, "cleanup-artifacts"))
        self.assertNotIn("actions: write", self.workflow[:self.workflow.index("jobs:")])
        self.assertNotIn("actions: write", self.job(self.workflow, "build"))
        self.assertNotIn("actions: write", self.job(self.workflow, "deploy"))

    def test_apply_builds_master_without_repeating_pr_tests(self):
        build = self.job(self.workflow, "build")
        self.assertIn("inputs.apply", build.split("steps:")[0])
        guard = build.index("Require master for application deployment")
        checkout = build.index("actions/checkout")
        self.assertLess(guard, checkout)
        self.assertIn('"$GITHUB_REF" != \'refs/heads/master\'', build[guard:checkout])
        self.assertIn("exit 1", build[guard:checkout])
        self.assertNotIn("uses: ./.github/workflows/ci.yml", self.workflow)
        for command in ("dotnet test", "npm test", "verify.mjs", "verify-api.py"):
            self.assertNotIn(command, build)
        self.assertIn("dotnet publish api/src/Vacate.Api", build)
        self.assertIn("dotnet publish api/tools/Vacate.Database", build)
        self.assertIn("npm ci", build)
        self.assertIn("npm run build -- --configuration production", build)
        self.assertIn("scripts/prepare-frontend.py", build)
        self.assertIn("include-hidden-files: true", build)
        self.assertIn("if-no-files-found: error", build)
        # Application tests remain in PR CI; only the deployment caller changes.
        for command in ("dotnet test", "npm test", "node frontend/verify.mjs"):
            self.assertIn(command, self.ci)

    def test_build_guard_rejects_feature_branches_and_tags(self):
        build = self.job(self.workflow, "build")
        guard = re.search(
            r"      - name: Require master.*?        run: \|\n(.*?)(?=      -)",
            build,
            re.S,
        ).group(1)
        for ref in ("refs/heads/master", "refs/heads/feature", "refs/tags/v1", ""):
            result = subprocess.run(
                ["bash", "-c", guard],
                env={**os.environ, "GITHUB_REF": ref},
                capture_output=True,
                text=True,
                check=False,
            )
            with self.subTest(ref=ref):
                self.assertEqual(result.returncode == 0, ref == "refs/heads/master")
                if result.returncode:
                    self.assertIn("Merge a green PR first", result.stderr)

    def test_deploy_consumes_only_this_runs_artifacts_and_cleans_up_even_on_failure(self):
        release = self.job(self.workflow, "deploy")
        self.assertIn("needs: [compile, build]", release)
        self.assertEqual(release.count("uses: actions/download-artifact@v8"), 3)
        self.assertNotIn("run-id:", release)
        self.assertNotIn("github-token:", release)
        for name in ("database-package", "functions-package", "angular-production"):
            self.assertIn("name: " + name, self.job(self.workflow, "build"))
            self.assertIn("name: " + name, release)
        cleanup = self.job(self.workflow, "cleanup-artifacts")
        self.assertIn("always()", cleanup)
        self.assertIn("needs: [build, deploy]", cleanup)
        self.assertIn("actions/runs/$GITHUB_RUN_ID/artifacts", cleanup)
        self.assertIn(
            "actions/runs/$GITHUB_RUN_ID/artifacts",
            self.job(self.ci, "cleanup-pr-artifacts"),
        )

    def test_preview_and_apply_gate_matrix(self):
        release = self.job(self.workflow, "deploy")
        condition = re.search(r"^    if: \$\{\{ (.*) \}\}", release, re.M).group(1)
        states = ("success", "failure", "skipped", "cancelled")
        for apply, cancelled, compile_state, build_state, event in product(
            (False, True), (False, True), states, states, ("workflow_dispatch", "pull_request")
        ):
            expression = condition
            for name, value in {
                "cancelled()": cancelled,
                "github.event_name": event,
                "needs.compile.result": compile_state,
                "needs.build.result": build_state,
                "inputs.apply": apply,
            }.items():
                expression = expression.replace(name, repr(value))
            expression = expression.replace("&&", " and ")
            expression = expression.replace("||", " or ").replace("!", "not ")
            allowed = eval(expression, {"__builtins__": {}}, {})
            expected = (
                not cancelled
                and event == "workflow_dispatch"
                and compile_state == "success"
                and (not apply or build_state == "success")
            )
            with self.subTest(
                apply=apply, cancelled=cancelled, compile=compile_state,
                build=build_state, event=event,
            ):
                self.assertEqual(allowed, expected)

    def test_pr_infrastructure_validation_belongs_to_the_single_ci_workflow(self):
        deploy_triggers = self.workflow.split("permissions:", 1)[0]
        ci_triggers = self.ci.split("permissions:", 1)[0]
        self.assertIn("  workflow_dispatch:", deploy_triggers)
        self.assertNotIn("  pull_request:", deploy_triggers)
        self.assertNotIn("  push:", deploy_triggers)
        self.assertIn("  pull_request:", ci_triggers)
        self.assertIn("  workflow_call:", ci_triggers)
        self.assertNotIn("  push:", ci_triggers)
        infrastructure = self.job(self.ci, "infrastructure")
        self.assertIn("if: github.event_name == 'pull_request'", infrastructure)
        # Both entry points must retain every environment and mandatory template gate.
        for job in (infrastructure, self.job(self.workflow, "compile")):
            self.assertIn("az bicep build --file infra/main.bicep", job)
            self.assertIn("scripts/verify-functions-template.py", job)
            self.assertIn("infra/deployments/sql-access.bicep", job)
            self.assertIn("scripts/verify-sql-free-template.py", job)
            self.assertIn("for environment in dev staging prod", job)
            self.assertIn("az bicep build-params", job)
            self.assertNotIn("azure/login", job)
            self.assertNotIn("continue-on-error", job)

    def test_failure_tolerance_in_deployment_is_rejected(self):
        mutations = [("  deploy:\n", "  deploy:\n    continue-on-error: true\n")]
        for name in ("Deploy and verify database", "Publish API", "Publish Angular"):
            marker = "      - name: " + name + "\n"
            mutations.append((marker, marker + "        continue-on-error: true\n"))
        for old, new in mutations:
            with self.subTest(location=old.strip()):
                self.assertIn(old, self.workflow)
                unsafe = self.workflow.replace(old, new, 1)
                with self.assertRaises(AssertionError):
                    self.assert_deployment_blocks_failure(unsafe)

    def test_always_run_publication_is_rejected(self):
        for name in ("Publish API", "Publish Angular"):
            marker = "      - name: " + name + "\n"
            for condition in ("always()", "${{ always() }}"):
                with self.subTest(publication=name, condition=condition):
                    unsafe, replacements = re.subn(
                        re.escape(marker) + r"        if: [^\n]+",
                        lambda _: marker + f"        if: {condition}",
                        self.workflow,
                        count=1,
                    )
                    self.assertEqual(replacements, 1)
                    with self.assertRaises(AssertionError):
                        self.assert_deployment_blocks_failure(unsafe)

    def test_release_lock_covers_database_and_both_application_publications(self):
        release = self.job(self.workflow, "deploy")
        before_steps = release[:release.index("    steps:")]
        self.assertIn("group: azure-infrastructure-${{ inputs.environment }}", before_steps)
        self.assertIn("cancel-in-progress: false", before_steps)
        self.assertEqual(len(re.findall(r"^  deploy:", self.workflow, re.M)), 1)

    def test_database_artifact_is_built_and_review_sql_retained_with_same_revision(self):
        self.assertIn('artifacts/database -p:SourceRevisionId="$GITHUB_SHA"', self.ci)
        self.assertIn("Vacate.Database.dll script > artifacts/database/migrations.sql", self.ci)
        self.assertIn('"$GITHUB_SHA" > artifacts/database/revision.txt', self.ci)
        for workflow in (self.ci, self.workflow):
            self.assertIn("name: database-package", workflow)

    def test_application_deployment_never_imports_or_rewrites_business_test_data(self):
        self.assertNotIn("import_demo_history", self.workflow)
        self.assertNotIn("seed-fictional", self.workflow)
        self.assertIn("Deploy and verify database", self.workflow)


if __name__ == "__main__":
    unittest.main()
