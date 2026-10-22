#!/usr/bin/env python3
"""Place the demo at index.html while retaining the Angular entry point."""
import argparse
import json
import shutil
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("--web-output", type=Path, required=True)
parser.add_argument("--revision", required=True)
args = parser.parse_args()
source = Path(__file__).resolve().parents[1] / "docs/design/calendar-mock/dist"
output = args.web_output
index = output / "index.html"
if not index.is_file() or "<app-root" not in index.read_text():
    raise SystemExit("Expected a fresh Angular build with an app-root entry point")
files = ["index.html", "login.html", "mock.css", "mock.js", "demo-fixtures.js", "demo-session.js", "login.js", "leave-types.js", "favicon.svg"]
if not all((source / name).is_file() for name in files):
    raise SystemExit("Demo package is incomplete")
index.replace(output / "app.html")
for name in files:
    shutil.copyfile(source / name, output / name)
(output / "gallery-revision.json").write_text(json.dumps({"revision": args.revision}) + "\n")
print("Packaged demo login and calendar at the site root; Angular entry retained as app.html")
