#!/usr/bin/env python3
"""Verify the public deployment contract without credentials or employee data."""
import argparse
import json
import time
import urllib.error
import urllib.request


def get(url, origin=None):
    headers = {"Origin": origin} if origin else {}
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=15) as response:
        return response.read(), response.headers


def check(api, web, revision):
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
    assert not denied_headers.get("Access-Control-Allow-Origin"), "Untrusted CORS origin allowed"
    body, headers = get(f"{web}/config.json")
    config = json.loads(body)
    assert config["apiBaseUrl"] == api, "Frontend points to a different API"
    assert config["revision"] == revision, "Frontend build revision mismatch"
    assert "no-store" in headers.get("Cache-Control", ""), "Runtime configuration may be cached"
    for path in ("/", "/index.html", "/design-preview/index.html"):
        body, headers = get(f"{web}{path}")
        assert "text/html" in headers.get("Content-Type", ""), "Gallery did not serve HTML"
        assert b"VACATE / DESIGN STUDY 01" in body, "Design gallery missing"
        assert "no-store" in headers.get("Cache-Control", ""), "Gallery entry may be cached"
    for filename, content_type, marker in (
        ("mock.js", "javascript", b"const DEMO_TODAY"),
        ("mock.css", "text/css", b".calendar-card"),
        ("demo-session.js", "javascript", b"vacate.demo.account.v2"),
        ("demo-fixtures.js", "javascript", b"window.VacateFixtures"),
        ("login.js", "javascript", b"login-form"),
        ("leave-types.js", "javascript", b"window.VacateLeave"),
        ("favicon.svg", "image/svg+xml", b"#12675e"),
    ):
        body, headers = get(f"{web}/{filename}")
        assert content_type in headers.get("Content-Type", ""), "Gallery asset content type incorrect"
        assert marker in body, "Gallery asset missing"
    body, headers = get(f"{web}/login.html")
    assert b'id="login-form"' in body, "Mock login page missing"
    assert "no-store" in headers.get("Cache-Control", ""), "Login entry may be cached"
    body, headers = get(f"{web}/gallery-revision.json")
    assert json.loads(body)["revision"] == revision, "Gallery build revision mismatch"
    assert "no-store" in headers.get("Cache-Control", ""), "Gallery revision may be cached"
    for path in ("/leave", "/approvals", "/availability", "/people"):
        body, headers = get(f"{web}{path}")
        assert "text/html" in headers.get("Content-Type", ""), "SPA route did not serve HTML"
        assert b"<app-root" in body, "Angular entry point missing"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-base-url", required=True, help="API URL including /api")
    parser.add_argument("--web-base-url")
    parser.add_argument("--revision", default="")
    args = parser.parse_args()
    for attempt in range(24):
        try:
            check(args.api_base_url.rstrip("/"), args.web_base_url, args.revision)
            print("Cloud smoke checks passed")
            return
        except (AssertionError, ValueError, KeyError, OSError) as error:
            print(f"Attempt {attempt + 1}/24: {type(error).__name__}: {error}", flush=True)
            if attempt == 23:
                raise SystemExit("Deployment smoke checks failed") from error
            time.sleep(10)


if __name__ == "__main__":
    main()
