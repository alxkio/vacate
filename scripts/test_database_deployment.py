"""Offline regression checks for release ordering and mandatory database gates."""

from pathlib import Path
import re
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
