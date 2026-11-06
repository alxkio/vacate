"""Regression checks for frontend-only and full deployment verification; no network."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch
import urllib.error


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("cloud_smoke", ROOT / "scripts/cloud-smoke.py")
SMOKE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SMOKE)
API = "https://api.example.invalid/api"
WEB = "https://web.example.invalid"
REVISION = "frontend-new"


class DeploymentSmokeTests(unittest.TestCase):
    def setUp(self):
        self.requests = []
        self.api_revision = "backend-old"
        self.config_revision = REVISION
        self.gallery_revision = REVISION
        self.config_api = API
        self.api_unavailable = False
        self.cors_allowed = True
        self.legacy_gallery = False
        self.bundle_missing = False

    def get(self, url, origin=None):
        self.requests.append((url, origin))
        if url == API + "/health":
            if self.api_unavailable:
                raise OSError("Existing API is unavailable")
            if origin == "https://untrusted.invalid":
                raise urllib.error.HTTPError(url, 403, "Denied", {}, io.BytesIO())
            return json.dumps({"status": "healthy", "version": "1.0+" + self.api_revision}).encode(), {"Access-Control-Allow-Origin": WEB} if self.cors_allowed else {}
        if not url.startswith(WEB + "/"):
            raise AssertionError("Unexpected request: " + url)
        path = url[len(WEB) + 1:]
        headers = {"Cache-Control": "no-store", "Content-Type": "text/html"}
        if path == "config.json":
            return json.dumps({"revision": self.config_revision, "apiBaseUrl": self.config_api}).encode(), headers
        if path == "gallery-revision.json":
            return json.dumps({"revision": self.gallery_revision}).encode(), headers
        if path in ("", "index.html", "login.html", "design-preview/index.html", "leave", "approvals", "availability", "people"):
            if self.legacy_gallery:
                return b'<app-root></app-root><script src="mock.js"></script>', headers
            return b'<app-root></app-root><script src="main-TEST.js" type="module"></script><link rel="stylesheet" href="styles-TEST.css">', headers
        if path == "favicon.svg":
            return (ROOT / "frontend/public/favicon.svg").read_bytes(), {"Content-Type": "image/svg+xml"}
        if path in ("main-TEST.js", "styles-TEST.css"):
            return (b"" if self.bundle_missing else b"angular-bundle"), {"Content-Type": "text/javascript" if path.endswith(".js") else "text/css"}
        raise AssertionError("Unexpected Angular asset: " + path)

    def check(self, frontend_only=False, web=WEB):
        with patch.object(SMOKE, "get", side_effect=self.get):
            SMOKE.check(API, web, REVISION, frontend_only=frontend_only)

    def test_frontend_only_checks_web_with_existing_api_offline(self):
        self.api_unavailable = True
        self.check(frontend_only=True)
        self.assertTrue(self.requests)
        self.assertTrue(all(url.startswith(WEB + "/") and origin is None for url, origin in self.requests))
        self.assertIn((WEB + "/gallery-revision.json", None), self.requests)
        self.assertIn((WEB + "/leave", None), self.requests)

    def test_frontend_only_rejects_stale_runtime_config(self):
        self.config_revision = "frontend-old"
        with self.assertRaisesRegex(AssertionError, "Frontend build revision mismatch"):
            self.check(frontend_only=True)

    def test_frontend_only_rejects_stale_gallery(self):
        self.gallery_revision = "frontend-old"
        with self.assertRaisesRegex(AssertionError, "Gallery build revision mismatch"):
            self.check(frontend_only=True)

    def test_frontend_only_rejects_wrong_api_configuration(self):
        self.config_api = "https://different-api.example.invalid/api"
        with self.assertRaisesRegex(AssertionError, "Frontend points to a different API"):
            self.check(frontend_only=True)

    def test_full_deploy_requires_matching_api_revision(self):
        with self.assertRaisesRegex(AssertionError, "API build revision mismatch"):
            self.check()

    def test_full_deploy_still_checks_api_cors_and_web(self):
        self.api_revision = REVISION
        self.check()
        self.assertIn((API + "/health", WEB), self.requests)
        self.assertIn((API + "/health", "https://untrusted.invalid"), self.requests)
        self.assertIn((WEB + "/config.json", None), self.requests)

    def test_full_deploy_rejects_missing_allowed_origin(self):
        self.api_revision = REVISION
        self.cors_allowed = False
        with self.assertRaisesRegex(AssertionError, "Frontend CORS origin missing"):
            self.check()

    def test_api_only_host_check_remains_available(self):
        self.api_revision = REVISION
        self.check(web=None)
        self.assertEqual(self.requests, [(API + "/health", None)])

    def test_frontend_only_rejects_legacy_gallery_entry(self):
        self.legacy_gallery = True
        with self.assertRaisesRegex(AssertionError, "Legacy gallery replaced Angular"):
            self.check(frontend_only=True)

    def test_frontend_only_rejects_empty_angular_bundle(self):
        self.bundle_missing = True
        with self.assertRaisesRegex(AssertionError, "Angular asset is empty"):
            self.check(frontend_only=True)

    def test_frontend_only_cli_requires_web_url(self):
        with patch("sys.argv", ["cloud-smoke.py", "--api-base-url", API, "--frontend-only"]), contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as error:
                SMOKE.main()
        self.assertEqual(error.exception.code, 2)

    def test_development_database_checks_membership_and_requests_without_resource_writes(self):
        with patch.object(SMOKE, "json_request", side_effect=[
            {"accessToken": "fictional-session"},
            {"profile": {"membership": {"companyId": "fictional-company"}}}, [], None
        ]) as request:
            SMOKE.check_development_database(API)
        self.assertEqual([(call.args[1], call.args[2]) for call in request.call_args_list], [
            ("POST", "/auth/sessions"), ("GET", "/auth/sessions/current"),
            ("GET", "/organizations/fictional-company/leave/requests"), ("DELETE", "/auth/sessions/current")
        ])

    def test_database_read_failure_is_not_hidden_and_session_is_revoked(self):
        with patch.object(SMOKE, "json_request", side_effect=[
            {"accessToken": "fictional-session"}, OSError("Database unavailable"), None
        ]) as request:
            with self.assertRaisesRegex(OSError, "Database unavailable"):
                SMOKE.check_development_database(API)
        self.assertEqual(request.call_args.args, (API, "DELETE", "/auth/sessions/current", "fictional-session"))

    def test_frontend_only_cannot_enable_development_database_probe(self):
        with patch("sys.argv", ["cloud-smoke.py", "--api-base-url", API, "--web-base-url", WEB,
                                "--frontend-only", "--development-database"]), contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as error:
                SMOKE.main()
        self.assertEqual(error.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
