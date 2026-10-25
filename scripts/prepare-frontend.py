#!/usr/bin/env python3
"""Validate the built Angular entry and stamp a public deployment revision."""
import argparse
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("--frontend-output", type=Path, required=True)
parser.add_argument("--revision", required=True)
args = parser.parse_args()
index = args.frontend_output / "index.html"
if not index.is_file() or "<app-root" not in index.read_text():
    raise SystemExit("Expected the Angular build's app-root entry point")
if any(name in index.read_text() for name in ["mock.js", "demo-session.js", "login.js"]):
    raise SystemExit("Legacy static gallery scripts must not replace the Angular entry")
if not (args.frontend_output / "staticwebapp.config.json").is_file():
    raise SystemExit("Static Web Apps configuration is missing")
# Retain the revision URL used by existing deployment diagnostics/bookmarks.
(args.frontend_output / "gallery-revision.json").write_text(json.dumps({"revision": args.revision}) + "\n")
print("Prepared Angular frontend directly; index.html is unchanged")
