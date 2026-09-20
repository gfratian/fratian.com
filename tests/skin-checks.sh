#!/usr/bin/env bash
# Build-output assertions for the dual-skin work. Run after `jekyll build`.
set -euo pipefail
S=_site
fail(){ echo "FAIL: $1"; exit 1; }

# --- Task 2: theme plumbing ---
grep -q "localStorage.getItem('skin')" "$S/index.html" || fail "no-flash script missing"
grep -q 'id="skin-toggle"' "$S/index.html" || fail "skin toggle button missing"
grep -q 'assets/js/skin.js' "$S/index.html" || fail "skin.js not linked"

# --- Task 3: modern skin ---
grep -q -- '--accent:#5ea3ff' "$S/assets/css/modern.css" || fail "modern accent token missing"
grep -q '#0f1115' "$S/assets/css/modern.css" || fail "modern bg missing"
grep -q 'assets/css/modern.css' "$S/index.html" || fail "modern.css not linked"

# --- Task 4: retro skin ---
grep -q 'html\[data-theme="retro"\]' "$S/assets/css/retro.css" || fail "retro rules not scoped"
grep -q 'assets/css/retro.css' "$S/index.html" || fail "retro.css not linked"
grep -q 'id="hit-counter"' "$S/index.html" || fail "counter ornament missing"
grep -q 'UNDER CONSTRUCTION' "$S/index.html" || fail "under-construction bar missing"
grep -q 'id="midi-btn"' "$S/index.html" || fail "midi button missing"

# --- Task 5: son's tile ---
grep -q "Favorite Son's Lair" "$S/index.html" || fail "son tile missing"
grep -q 'geofratian.com' "$S/index.html" || fail "son tile link missing"

echo "OK: all checks passed"
