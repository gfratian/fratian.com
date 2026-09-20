#!/usr/bin/env bash
# Build-output assertions for the four-language site. Run after `jekyll build`.
set -euo pipefail
S=_site
fail(){ echo "FAIL: $1"; exit 1; }

for l in ro it fr; do
  [ -d "$S/$l" ] || fail "language tree /$l missing"
done
grep -q 'html lang="en"' "$S/index.html" || fail "root not lang=en"
grep -q 'html lang="ro"' "$S/ro/index.html" || fail "/ro not lang=ro"

echo "OK: i18n build"
