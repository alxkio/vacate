"""Offline regression checks for release ordering and mandatory database gates."""
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]


class DatabaseDeploymentWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.workflow = (ROOT / ".github/workflows/azure-infrastructure.yml").read_text()
        self.ci = (ROOT / ".github/workflows/ci.yml").read_text()

    def test_database_failure_blocks_both_application_publications(self):
        positions = [self.workflow.index("- name: " + name) for name in (
            "Deploy infrastructure", "Deploy and verify database", "Publish API", "Publish Angular")]
        self.assertEqual(positions, sorted(positions))
        gate = self.workflow[positions[1]:positions[2]]
        self.assertIn("inputs.apply && inputs.deploy_backend", gate)
        self.assertIn("steps.infrastructure.outputs.sql_enabled == 'true'", gate)
        self.assertIn('test -n "$VACATE_SQL_CONNECTION"', gate)
        self.assertIn('test "$(cat artifacts/database/revision.txt)" = "$GITHUB_SHA"', gate)
        self.assertIn('Vacate.Database.dll deploy "$RUNTIME_NAME" "$RUNTIME_CLIENT_ID"', gate)
        self.assertNotIn("continue-on-error", self.workflow)
        self.assertNotIn("if: always()", self.workflow[positions[1]:])
        self.assertIn("sql_enabled=$(jq -er", self.workflow)
        self.assertIn('echo "sql_enabled=$sql_enabled"', self.workflow)

    def test_release_lock_covers_database_and_both_application_publications(self):
        release = self.workflow[self.workflow.index("  deploy:\n"):]
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


    def test_demo_import_is_explicit_dev_only_and_follows_verified_publication(self):
        option = self.workflow[self.workflow.index("      import_demo_history:"):self.workflow.index("permissions:")]
        self.assertIn("default: false", option)
        guard = self.workflow.index("- name: Reject unsupported demo import selection")
        self.assertLess(guard, self.workflow.index("- name: Check deployment target"))
        self.assertIn("inputs.import_demo_history && (!inputs.apply || !inputs.deploy_backend || inputs.environment != 'dev')", self.workflow)
        position = self.workflow.index("- name: Import explicitly requested demo history")
        self.assertGreater(position, self.workflow.index("- name: Verify deployed endpoints"))
        self.assertGreater(position, self.workflow.index("- name: Publish Angular"))
        section = self.workflow[position:self.workflow.index("- name: Deployment summary")]
        self.assertIn("inputs.apply && inputs.deploy_backend && inputs.environment == 'dev' && inputs.import_demo_history", section)
        self.assertIn('test "$SQL_ENABLED" = \'true\'', section)
        self.assertIn("Vacate.Database.dll seed-fictional-history", section)


if __name__ == "__main__":
    unittest.main()
