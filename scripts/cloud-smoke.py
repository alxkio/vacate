#!/usr/bin/env python3
"""Verify deployment delivery, with an explicit fictional development SQL read check."""
import argparse
import json
import re
import time
import urllib.error
import urllib.request


def get(url, origin=None):
    headers = {"Origin": origin} if origin else {}
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=15) as response:
        return response.read(), response.headers


def json_request(api, method, path, token=None, body=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    request = urllib.request.Request(api + path, method=method, headers=headers,
                                     data=json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(request, timeout=15) as response:
        payload = response.read()
        return json.loads(payload) if payload else None


def check_development_database(api):
    # Fictional dev sign-in creates only an ephemeral session; no resource writes or seeding.
    session = json_request(api, "POST", "/auth/sessions", body={"username": "nora", "password": "nora"})
    token = session["accessToken"]
    try:
        own = json_request(api, "GET", "/auth/sessions/current", token)
        company = own["profile"]["membership"]["companyId"]
        requests = json_request(api, "GET", f"/organizations/{company}/leave/requests", token)
        assert isinstance(requests, list), "Database-backed leave request read failed"
    finally:
        json_request(api, "DELETE", "/auth/sessions/current", token)


def check_api(api, web, revision):
    body, headers = get(f"{api}/health", web)
    health = json.loads(body)
    assert health["status"] == "healthy", "API liveness failed"
    if revision:
        assert health["version"].endswith(f"+{revision}"), "API build revision mismatch"
    if not web:
        return
    assert headers.get("Access-Control-Allow-Origin") == web, "Frontend CORS origin missing"
    try:
        _, denied_headers = get(f"{api}/health", "https://untrusted.invalid")
    except urllib.error.HTTPError as error:
        assert error.code == 403, "Unexpected response for untrusted origin"
        denied_headers = error.headers
        error.close()
    assert not denied_headers.get("Access-Control-Allow-Origin"), "Untrusted CORS origin allowed"


def check_web(api, web, revision):
    body, headers = get(f"{web}/config.json")
    config = json.loads(body)
    assert config["apiBaseUrl"] == api, "Frontend points to a different API"
    assert config["revision"] == revision, "Frontend build revision mismatch"
    assert "no-store" in headers.get("Cache-Control", ""), "Runtime configuration may be cached"
    asset_paths = set()
    for path in ("/", "/index.html", "/login.html", "/design-preview/index.html", "/leave", "/approvals", "/availability", "/people"):
        body, headers = get(f"{web}{path}")
        assert "text/html" in headers.get("Content-Type", ""), "Angular route did not serve HTML"
        assert b"<app-root" in body, "Angular entry point missing"
        assert b"mock.js" not in body, "Legacy gallery replaced Angular"
        assert "no-store" in headers.get("Cache-Control", ""), "Angular entry may be cached"
        asset_paths.update(re.findall(rb'(?:src|href)="([^"?#]+\.(?:js|css))"', body))
    assert any(path.endswith(b".js") for path in asset_paths), "Angular JavaScript bundle missing"
    for path in asset_paths:
        name = path.decode()
        assert not name.startswith(("http:", "https:", "//")), "Unexpected external Angular asset"
        asset, headers = get(f"{web}/{name.lstrip('/')}")
        assert asset, "Angular asset is empty"
        assert ("javascript" if name.endswith(".js") else "text/css") in headers.get("Content-Type", ""), "Angular asset content type incorrect"
    body, headers = get(f"{web}/favicon.svg")
    assert "image/svg+xml" in headers.get("Content-Type", "") and b"#12675e" in body, "Favicon missing"
    body, headers = get(f"{web}/gallery-revision.json")
    assert json.loads(body)["revision"] == revision, "Gallery build revision mismatch"
    assert "no-store" in headers.get("Cache-Control", ""), "Gallery revision may be cached"


def check(api, web, revision, frontend_only=False):
    if not frontend_only:
        check_api(api, web, revision)
    if web:
        check_web(api, web, revision)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-base-url", required=True, help="API URL including /api")
    parser.add_argument("--web-base-url")
    parser.add_argument("--revision", default="")
    parser.add_argument("--frontend-only", action="store_true", help="Check web delivery/configuration without calling or matching the existing API revision")
    parser.add_argument("--development-database", action="store_true", help="Read fictional own membership and leave requests using dev-only sign-in")
    args = parser.parse_args()
    if args.frontend_only and not args.web_base_url:
        parser.error("--frontend-only requires --web-base-url")
    if args.frontend_only and args.development_database:
        parser.error("--development-database requires a full backend deployment")
    for attempt in range(24):
        try:
            check(args.api_base_url.rstrip("/"), args.web_base_url.rstrip("/") if args.web_base_url else None, args.revision, args.frontend_only)
            if args.development_database:
                check_development_database(args.api_base_url.rstrip("/"))
            print("Frontend-only smoke checks passed (API checks skipped)" if args.frontend_only else "Cloud smoke checks passed")
            return
        except (AssertionError, ValueError, KeyError, OSError) as error:
            print(f"Attempt {attempt + 1}/24: {type(error).__name__}: {error}", flush=True)
            if attempt == 23:
                raise SystemExit("Deployment smoke checks failed") from error
            time.sleep(10)


if __name__ == "__main__":
    main()
