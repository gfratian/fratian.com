#!/usr/bin/env bash
# Build-output assertions for the dual-skin work. Run after `jekyll build`.
set -euo pipefail
S=_site
fail(){ echo "FAIL: $1"; exit 1; }

# --- Task 2: theme plumbing ---
grep -q "localStorage.getItem('skin')" "$S/index.html" || fail "no-flash script missing"
grep -q 'id="skin-toggle"' "$S/index.html" || fail "skin toggle button missing"
grep -q 'assets/js/skin.js' "$S/index.html" || fail "skin.js not linked"

echo "OK: all checks passed"
