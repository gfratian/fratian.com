# Dual-Skin System + Son's Tile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a site-wide `OLD | NEW` skin switch that flips fratian.com between a modern "Command Deck" design (LegalEagle palette) and a full-kitsch 1990s retro design, plus a "My Favorite Son's Lair" homepage tile.

**Architecture:** A single `data-theme` attribute on `<html>` drives everything. Modern CSS is the unscoped baseline; retro CSS is layered on top, every selector prefixed `html[data-theme="retro"]`. A tiny inline `<head>` script sets the attribute from `localStorage` before first paint (default `retro`) so there's no flash; with no JS, the modern baseline renders (good for crawlers). Both skins re-theme the existing HTML classes, so markup barely changes.

**Tech Stack:** Jekyll (current legacy GitHub Pages build — **no pipeline change in this plan**), plain CSS, vanilla JS. Local preview via Ruby/Bundler (`github-pages` gem, already in `Gemfile`).

**Spec:** `docs/superpowers/specs/2026-09-20-skins-and-i18n-design.md`

## Global Constraints

- **No build-pipeline change here.** This plan must build and deploy on the *current* legacy GitHub Pages build. (The Actions + polyglot switch is Plan B.)
- **Default skin for first-time visitors: `retro`** (stored in `localStorage['skin']`, values `'retro'` | `'modern'`).
- **Modern is the CSS baseline** (unscoped); **retro rules are all scoped** under `html[data-theme="retro"]`.
- **No flash of the wrong skin** on navigation — the `<head>` script runs before stylesheet-driven paint.
- **No external image/GIF dependencies** for retro ornaments — CSS only. The only optional asset is a short MIDI/chiptune clip for the click-to-play button.
- **All work on branch `feature/skins-and-i18n`.** Never push to `main`; `main` deploys live.
- **LegalEagle palette (modern tokens), exact values:** `--bg:#0f1115` `--panel:#161a22` `--panel2:#1d2230` `--border:#2a3142` `--text:#e6e8ed` `--muted:#8a93a6` `--accent:#5ea3ff` `--pass:#3ec56d` `--warn:#f0b860` `--fail:#ef5e5e`.
- **Accessibility:** `@media (prefers-reduced-motion: reduce)` must disable retro marquee/blink/counter animation; toggle is a real `<button>` with `aria-label`; focus rings visible.
- **"Test" convention for this static site:** each task's automated check is (a) `bundle exec jekyll build` exits 0, and (b) `grep` assertions against the generated `_site/` output. The "failing test" is running the grep *before* implementing and seeing it fail, then again after and seeing it pass. Manual visual verification via `bundle exec jekyll serve` is called out where it matters.

---

## File Structure

| File | Responsibility |
|---|---|
| `Gemfile` (exists) | local preview deps — unchanged in Plan A |
| `_layouts/default.html` (modify) | no-flash `<head>` script; `<head>` loads `modern.css` then `retro.css`; header hosts `_includes/site-controls.html`; loads `skin.js` |
| `_includes/site-controls.html` (new) | the `OLD|NEW` skin button + `EN·RO·IT·FR` language pill markup |
| `_includes/retro-ornaments.html` (new) | retro-only chrome: marquee, under-construction bar, counter, badges, guestbook/webring, MIDI button (rendered always, shown only under retro selector) |
| `assets/css/modern.css` (new; replaces role of `main.css`) | modern "Command Deck" skin — the unscoped baseline |
| `assets/css/retro.css` (new) | all retro rules, scoped `html[data-theme="retro"]` |
| `assets/js/skin.js` (new) | toggle handler, persistence, retro counter, MIDI play, reduced-motion guard |
| `index.html` (modify) | add son's-lair card |
| `assets/audio/chiptune.*` (optional, new) | short click-to-play clip (or WebAudio synth in `skin.js`) |

**Note on `main.css`:** the current file is a warm serif "paper" design. Plan replaces it with `modern.css`. Keep `main.css` in the repo untouched until Task 6 deletes it, so intermediate builds still have a stylesheet if needed. `default.html` will reference `modern.css` from Task 3 onward.

---

### Task 1: Local preview works

**Files:**
- Use: `Gemfile` (existing, `github-pages` + `webrick`)

**Interfaces:**
- Produces: a working `bundle exec jekyll serve` / `build` so every later task can verify against `_site/`.

- [ ] **Step 1: Confirm the toolchain and install gems**

Run:
```bash
cd <repo>
ruby -v && bundle -v
bundle install
```
Expected: bundler resolves and installs `github-pages` + `jekyll`. If `bundle install` fails on native gems, that's the environment to fix before proceeding (report it — do not work around by skipping local builds).

- [ ] **Step 2: Baseline build must succeed (this is the "before" test)**

Run:
```bash
bundle exec jekyll build
```
Expected: exits 0, `_site/index.html` exists. This proves the current site builds before we touch anything.

- [ ] **Step 3: Commit the lockfile**

```bash
git add Gemfile.lock
git commit -m "chore: add Gemfile.lock for reproducible local preview"
```

---

### Task 2: Theme plumbing — no-flash script, toggle control, persistence

Ships the `data-theme` machinery and a working `OLD|NEW` button. Retro isn't styled yet, so toggling has no *visual* effect beyond the attribute — that's expected; Task 4 gives retro its look.

**Files:**
- Modify: `_layouts/default.html`
- Create: `_includes/site-controls.html`, `assets/js/skin.js`

**Interfaces:**
- Produces: `<html data-theme>` set before paint; `localStorage['skin']`; global toggle button `#skin-toggle`; `skin.js` exposing no public API (self-init on `DOMContentLoaded`).
- Consumes: nothing.

- [ ] **Step 1: Write the failing checks**

Create `tests/skin-checks.sh` (a plain shell assertion script used throughout this plan):
```bash
#!/usr/bin/env bash
set -euo pipefail
S=_site
fail(){ echo "FAIL: $1"; exit 1; }
# Task 2 assertions
grep -q "localStorage.getItem('skin')" "$S/index.html" || fail "no-flash script missing"
grep -q 'id="skin-toggle"' "$S/index.html" || fail "skin toggle button missing"
grep -q 'assets/js/skin.js' "$S/index.html" || fail "skin.js not linked"
echo "OK: task 2"
```
Make it executable: `chmod +x tests/skin-checks.sh`.

- [ ] **Step 2: Run it against the current build — expect FAIL**

Run: `bundle exec jekyll build && ./tests/skin-checks.sh`
Expected: `FAIL: no-flash script missing`.

- [ ] **Step 3: Add the no-flash script to `<head>`**

In `_layouts/default.html`, immediately after `<meta name="viewport" …>` and **before** the `<link rel="stylesheet">`, insert:
```html
<script>
(function () {
  try {
    var s = localStorage.getItem('skin');
    if (s !== 'modern' && s !== 'retro') s = 'retro';   // default for real visitors
    document.documentElement.setAttribute('data-theme', s);
  } catch (e) { /* JS off / storage blocked → modern baseline renders */ }
})();
</script>
```

- [ ] **Step 4: Point the stylesheet link at modern.css and add retro.css + skin.js**

In `_layouts/default.html` `<head>`, replace the single stylesheet line with:
```html
<link rel="stylesheet" href="{{ '/assets/css/modern.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/retro.css' | relative_url }}">
```
And before `</body>` add:
```html
<script src="{{ '/assets/js/skin.js' | relative_url }}" defer></script>
```
(Modern.css / retro.css are created in Tasks 3–4; until then the links 404 harmlessly. Keep `main.css` present so the page isn't unstyled — optionally also link `main.css` temporarily; remove in Task 6.)

- [ ] **Step 5: Add the controls include to the header**

In `_layouts/default.html`, inside `<header class="site-head"> … <div class="wrap">`, after the `<nav>`, add:
```html
{% include site-controls.html %}
```

- [ ] **Step 6: Create `_includes/site-controls.html`**

```html
<div class="site-controls">
  <div class="lang-pill" role="group" aria-label="Language">
    <a class="lang is-on" href="#" hreflang="en" lang="en">EN</a>
    <a class="lang" href="#" hreflang="ro" lang="ro">RO</a>
    <a class="lang" href="#" hreflang="it" lang="it">IT</a>
    <a class="lang" href="#" hreflang="fr" lang="fr">FR</a>
  </div>
  <button id="skin-toggle" type="button" class="skin-toggle"
          aria-label="Switch site design between modern and 1990s">
    <span class="skin-seg" data-skin="modern">NEW</span>
    <span class="skin-seg" data-skin="retro">OLD</span>
  </button>
</div>
```
(The language pill is visual-only in Plan A — EN active, others `#`. Plan B wires real localized hrefs. This is intentional, not a placeholder: EN is the live site.)

- [ ] **Step 7: Create `assets/js/skin.js`**

```js
(function () {
  'use strict';
  var root = document.documentElement;
  function current() {
    var s = root.getAttribute('data-theme');
    return (s === 'modern' || s === 'retro') ? s : 'retro';
  }
  function apply(skin) {
    root.setAttribute('data-theme', skin);
    try { localStorage.setItem('skin', skin); } catch (e) {}
  }
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('skin-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        apply(current() === 'retro' ? 'modern' : 'retro');
      });
    }
  });
})();
```

- [ ] **Step 8: Build and run checks — expect OK**

Run: `bundle exec jekyll build && ./tests/skin-checks.sh`
Expected: `OK: task 2`.

- [ ] **Step 9: Manual check**

`bundle exec jekyll serve` → open the site. The `OLD|NEW` button appears top-right; clicking it flips `data-theme` on `<html>` (inspect element) and persists across a reload. No visual skin change yet — expected.

- [ ] **Step 10: Commit**

```bash
git add _layouts/default.html _includes/site-controls.html assets/js/skin.js tests/skin-checks.sh
git commit -m "feat: theme plumbing — no-flash data-theme switch, OLD|NEW toggle, persistence"
```

---

### Task 3: Modern "Command Deck" skin (baseline CSS)

Replaces the paper/ink look with the LegalEagle dark dashboard: Command Deck for home/index/section pages, Raised-Panel for article/chapter pages. Re-themes the existing classes (`.site-head`, `.brand`, `.site-nav`, `.wrap`, `.cards`, `.card`, `.tag`, `.page-title`, `.lede`, `.prose`).

**Files:**
- Create: `assets/css/modern.css`
- Modify: `_layouts/default.html` (already links modern.css from Task 2)
- Modify: `tests/skin-checks.sh` (add Task 3 assertions)

**Interfaces:**
- Consumes: existing class names in layouts/pages.
- Produces: the `:root` modern token set (Global Constraints values); a `.reading` wrapper class for prose pages (added to `chapter`/`post`/`page` layouts in Task 4's include step — see note).

- [ ] **Step 1: Add Task 3 assertions to `tests/skin-checks.sh`** (before the final echo)

```bash
grep -q -- '--accent:#5ea3ff' "$S/assets/css/modern.css" || fail "modern accent token missing"
grep -q '#0f1115' "$S/assets/css/modern.css" || fail "modern bg missing"
echo "OK: task 3"
```

- [ ] **Step 2: Run checks — expect FAIL** (`modern.css` doesn't exist yet)

Run: `bundle exec jekyll build && ./tests/skin-checks.sh` → Expected: `FAIL: modern accent token missing`.

- [ ] **Step 3: Write `assets/css/modern.css`**

```css
/* fratian.com — MODERN "Command Deck" skin (baseline). LegalEagle palette. */
:root{
  --bg:#0f1115; --panel:#161a22; --panel2:#1d2230; --border:#2a3142;
  --text:#e6e8ed; --muted:#8a93a6; --accent:#5ea3ff;
  --pass:#3ec56d; --warn:#f0b860; --fail:#ef5e5e;
  --measure:68ch;
  --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --mono: ui-monospace, "SF Mono", "Fira Code", Menlo, monospace;
}
*,*::before,*::after{ box-sizing:border-box; }
html{ -webkit-text-size-adjust:100%; }
body{ margin:0; background:var(--bg); color:var(--text); font-family:var(--sans);
      font-size:1.0625rem; line-height:1.6; }
.wrap{ width:100%; max-width:72rem; margin:0 auto; padding:0 1.25rem; }
a{ color:var(--accent); text-underline-offset:2px; }
a:hover{ color:#8ec2ff; }

/* skip link */
.skip{ position:absolute; left:-9999px; }
.skip:focus{ left:1rem; top:1rem; background:var(--panel); color:var(--text);
  padding:.5rem .75rem; border:1px solid var(--border); border-radius:8px; z-index:50; }

/* header */
.site-head{ position:sticky; top:0; z-index:20; background:#0b0d11;
  border-bottom:1px solid var(--border); }
.site-head .wrap{ display:flex; align-items:center; gap:1rem; min-height:3.5rem; flex-wrap:wrap; }
.brand{ font-weight:800; letter-spacing:-.02em; color:var(--text); text-decoration:none; }
.brand span{ color:var(--accent); }
.site-nav{ display:flex; gap:1.1rem; font-size:.85rem; margin-right:auto; }
.site-nav a{ color:var(--muted); text-decoration:none; }
.site-nav a:hover,.site-nav a[aria-current]{ color:var(--accent); }

/* controls (skin toggle + lang pill) */
.site-controls{ display:flex; align-items:center; gap:.6rem; }
.lang-pill{ display:inline-flex; border:1px solid var(--border); border-radius:999px; overflow:hidden; }
.lang-pill .lang{ font:600 .72rem/1 var(--mono); padding:.32rem .5rem; color:var(--muted); text-decoration:none; }
.lang-pill .lang.is-on{ background:var(--accent); color:#08111f; }
.skin-toggle{ display:inline-flex; border:1px solid var(--border); border-radius:8px;
  overflow:hidden; background:transparent; cursor:pointer; padding:0; }
.skin-toggle .skin-seg{ font:600 .72rem/1 var(--mono); padding:.34rem .6rem; color:var(--muted); }
html[data-theme="modern"] .skin-toggle .skin-seg[data-skin="modern"]{ background:var(--panel2); color:var(--text); }
.skin-toggle:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }

/* headings + hero */
h1,h2,h3{ font-family:var(--sans); letter-spacing:-.02em; line-height:1.18; }
.page-title{ font-size:clamp(1.9rem,5vw,2.8rem); font-weight:800; margin:1.4rem 0 .4rem; }
.lede{ color:var(--muted); font-size:1.15rem; margin:0 0 .5rem; max-width:52ch; }
.section{ padding:1rem 0 3rem; }

/* cards grid (home/index) */
.cards{ list-style:none; padding:0; margin:2rem 0 0; display:grid; gap:1rem; align-items:start;
  grid-template-columns:repeat(auto-fit, minmax(min(100%,18rem),1fr)); }
.card{ display:flex; flex-direction:column; background:var(--panel); border:1px solid var(--border);
  border-radius:12px; overflow:hidden; transition:border-color .15s, transform .15s; }
.card:hover{ border-color:var(--accent); transform:translateY(-2px); }
.card--soon{ opacity:.7; }
.card__img{ aspect-ratio:16/9; width:100%; object-fit:cover; background:var(--panel2); display:block; }
.card__body{ padding:1rem 1.1rem 1.2rem; display:flex; flex-direction:column; gap:.45rem; flex:1; }
.card__body h2{ font-size:1.15rem; margin:0; }
.card__body h2 a{ color:var(--text); text-decoration:none; }
.card__body h2 a:hover{ color:var(--accent); }
.card__body p{ margin:0; color:var(--muted); font-size:.95rem; line-height:1.55; }
.tag{ align-self:flex-start; font:600 .68rem/1 var(--mono); letter-spacing:.08em;
  text-transform:uppercase; color:var(--accent); }
.tag--soon{ color:var(--warn); }
/* son's-lair accent card (Task 5 adds .card--son) */
.card--son{ border-style:dashed; border-color:var(--accent); }

/* Raised-Panel reading surface for long-form pages */
.reading{ background:var(--panel); border:1px solid var(--border); border-radius:12px;
  padding:1.5rem clamp(1rem,4vw,2.25rem); margin:1.5rem auto 2.5rem; max-width:76ch; }
.reading .prose{ max-width:var(--measure); }
.prose{ color:var(--text); font-size:1.08rem; line-height:1.7; }
.prose p{ margin:0 0 1rem; }
.prose img,.prose figure{ max-width:100%; border-radius:8px; }
.prose a{ color:var(--accent); }

/* chapter prev/next */
.pn{ display:flex; justify-content:space-between; gap:1rem; font:600 .8rem/1 var(--mono);
  color:var(--muted); border-top:1px solid var(--border); padding-top:1rem; margin-top:1.5rem; }
.pn a{ color:var(--accent); text-decoration:none; }

/* footer */
.site-foot{ border-top:1px solid var(--border); color:var(--muted); font-size:.85rem; }
.site-foot .wrap{ display:flex; flex-direction:column; gap:.35rem; padding:1.5rem 1.25rem; }
.site-foot a{ color:var(--muted); }
.site-foot a:hover{ color:var(--accent); }

@media (max-width:560px){ .site-nav{ order:3; width:100%; } }
```

- [ ] **Step 4: Wrap prose layouts in `.reading`**

In `_layouts/chapter.html`, `_layouts/post.html`, and `_layouts/page.html`, wrap the main content (`{{ content }}` and its surrounding `.wrap`/`.prose`) so the prose sits inside `<div class="reading">…</div>`. Minimal edit — if a layout already has `<div class="wrap section"><article class="prose">{{ content }}</article></div>`, change to `<div class="wrap section"><div class="reading"><article class="prose">{{ content }}</article></div></div>`. (Inspect each layout's current structure and adapt; keep existing classes.)

- [ ] **Step 5: Build + checks + manual**

Run: `bundle exec jekyll build && ./tests/skin-checks.sh` → Expected: `OK: task 3`.
Manual (`serve`): home shows dark Command Deck cards; a chapter shows the Raised-Panel reading card on dark. Toggle still flips attribute (retro still unstyled).

- [ ] **Step 6: Commit**

```bash
git add assets/css/modern.css _layouts/chapter.html _layouts/post.html _layouts/page.html tests/skin-checks.sh
git commit -m "feat: modern Command Deck skin (LegalEagle palette) + Raised-Panel reading"
```

---

### Task 4: Retro "Old" skin — full kitsch, site-wide

All retro rules scoped under `html[data-theme="retro"]`, plus retro-only ornaments and the counter/MIDI behavior. Ornaments render in the DOM always but are `display:none` unless the retro selector matches.

**Files:**
- Create: `assets/css/retro.css`, `_includes/retro-ornaments.html`
- Modify: `_layouts/default.html` (include ornaments), `assets/js/skin.js` (counter + MIDI + reduced-motion), `tests/skin-checks.sh`
- Optional: `assets/audio/chiptune.mp3` (or WebAudio synth in skin.js)

**Interfaces:**
- Consumes: `data-theme="retro"`, existing classes.
- Produces: ornament DOM (`.retro-only`), `#hit-counter`, `#midi-btn`.

- [ ] **Step 1: Add Task 4 assertions to `tests/skin-checks.sh`**

```bash
grep -q 'html\[data-theme="retro"\]' "$S/assets/css/retro.css" || fail "retro rules not scoped"
grep -q 'id="hit-counter"' "$S/index.html" || fail "counter ornament missing"
grep -q 'UNDER CONSTRUCTION' "$S/index.html" || fail "under-construction bar missing"
echo "OK: task 4"
```

- [ ] **Step 2: Run checks — expect FAIL.** (`FAIL: retro rules not scoped`)

- [ ] **Step 3: Create `_includes/retro-ornaments.html`**

```html
<div class="retro-only retro-marquee"><span class="retro-marquee__t">★彡 Welcome to George Fratian's Personal Homepage on the World Wide Web!!! 彡★ &nbsp; Sign my guestbook! &nbsp; Best viewed in Netscape Navigator ★</span></div>
<div class="retro-only retro-uc">🚧 &nbsp; THIS SITE IS UNDER CONSTRUCTION &nbsp; 🚧</div>
<div class="retro-only retro-counter">You are visitor number: <span id="hit-counter" class="lcd">00000000</span></div>
```
And a footer ornament block (add near end, before `</footer>` include point):
```html
<div class="retro-only retro-foot">
  <div class="retro-links">🔊 <button id="midi-btn" type="button" class="retro-a">Play MIDI</button>
    · <a class="retro-a" href="{{ '/contact/' | relative_url }}">Sign Guestbook</a>
    · <a class="retro-a" href="{{ '/contact/' | relative_url }}">Email me</a>
    · 💍 <span class="retro-a">Member of the Travel WebRing</span></div>
  <div class="retro-badges">
    <span class="b88" style="background:#000;color:#fff">NETSCAPE<br>NOW!</span>
    <span class="b88" style="background:#fff;color:#00f">Made with<br>NOTEPAD</span>
    <span class="b88" style="background:#008080;color:#fff">Best viewed<br>800×600</span>
    <span class="b88" style="background:#c0c0c0;color:#000">VALID<br>HTML 3.2</span>
    <span class="b88" style="background:#fc0;color:#000">Y2K<br>READY</span>
  </div>
</div>
```

- [ ] **Step 4: Include ornaments in `_layouts/default.html`**

Right after `<main id="main">` opening, add the top ornaments; and inside the footer add the foot block. Simplest: `{% include retro-ornaments.html %}` once near the top of `<main>` (contains both marquee/uc/counter and the foot block — acceptable to keep them together at top for Plan A; refine placement during manual check).

- [ ] **Step 5: Write `assets/css/retro.css`** (all rules scoped)

```css
/* fratian.com — RETRO "Old" skin. Everything scoped under the retro selector. */
.retro-only{ display:none; }
html[data-theme="retro"] .retro-only{ display:block; }

html[data-theme="retro"] body{
  font-family:"Times New Roman",Times,serif; color:#000; background:#000080;
  background-image:radial-gradient(#ffffff22 1px,transparent 1px),radial-gradient(#ffff0033 1px,transparent 1px);
  background-size:22px 22px,16px 16px; background-position:0 0,8px 8px;
}
/* content sits on a light beveled panel over the tiled bg */
html[data-theme="retro"] main#main{ width:94%; max-width:900px; margin:14px auto; background:#c0c0c0;
  border:2px inset #fff; padding:14px; }
html[data-theme="retro"] .reading{ background:#fff; border:2px inset #808080; border-radius:0;
  padding:14px; max-width:none; }
html[data-theme="retro"] .prose{ color:#000; font-size:1.05rem; line-height:1.5; }

/* header/nav */
html[data-theme="retro"] .site-head{ position:static; background:#000080; border:0; }
html[data-theme="retro"] .site-head .wrap{ min-height:0; padding:6px 10px; }
html[data-theme="retro"] .brand{ color:#fff; font-weight:bold; }
html[data-theme="retro"] .brand span{ color:#ff0; }
html[data-theme="retro"] .site-nav a{ color:#fff; text-decoration:underline; }

/* controls in retro */
html[data-theme="retro"] .site-controls{ gap:.4rem; }
html[data-theme="retro"] .lang-pill{ border:0; border-radius:0; background:transparent; }
html[data-theme="retro"] .lang-pill .lang{ color:#fff; text-decoration:underline; font-family:"Times New Roman",serif; }
html[data-theme="retro"] .lang-pill .lang.is-on{ background:transparent; color:#ff0; }
html[data-theme="retro"] .skin-toggle{ border:2px outset #fff; border-radius:0; background:#c0c0c0;
  font-family:"MS Sans Serif",Tahoma,sans-serif; }
html[data-theme="retro"] .skin-toggle .skin-seg{ color:#000; }
html[data-theme="retro"] .skin-toggle .skin-seg[data-skin="modern"]::before{ content:"🖥️ Switch to MODERN site »"; }
html[data-theme="retro"] .skin-toggle .skin-seg{ font-size:12px; }
html[data-theme="retro"] .skin-toggle .skin-seg[data-skin="retro"]{ display:none; }

/* headings */
html[data-theme="retro"] .page-title{ text-align:center; font-family:"Times New Roman",serif; font-weight:bold;
  background:linear-gradient(90deg,#f00,#f80,#ff0,#0f0,#0ff,#00f,#f0f);
  -webkit-background-clip:text; background-clip:text; color:transparent; text-shadow:2px 2px 0 #0003; }
html[data-theme="retro"] .lede{ text-align:center; font-style:italic; color:#000080; }

/* links */
html[data-theme="retro"] a{ color:#00e; } html[data-theme="retro"] a:visited{ color:#551a8b; }

/* ornaments */
html[data-theme="retro"] .retro-marquee{ background:#000; color:#ff0; font-weight:bold; padding:4px;
  overflow:hidden; white-space:nowrap; }
html[data-theme="retro"] .retro-marquee__t{ display:inline-block; animation:retro-marq 12s linear infinite; }
@keyframes retro-marq{ from{transform:translateX(100%)} to{transform:translateX(-100%)} }
html[data-theme="retro"] .retro-uc{ background:repeating-linear-gradient(45deg,#000,#000 10px,#fc0 10px,#fc0 20px);
  color:#fff; text-align:center; font-weight:bold; padding:5px; border:2px solid #000; text-shadow:1px 1px 0 #000; margin:8px 0; }
html[data-theme="retro"] .retro-counter{ text-align:center; margin:6px 0; }
html[data-theme="retro"] .lcd{ display:inline-block; background:#000; color:#0f0; font-family:"Courier New",monospace;
  font-weight:bold; letter-spacing:3px; padding:3px 6px; border:2px inset #444; }
html[data-theme="retro"] .retro-foot{ text-align:center; margin-top:10px; }
html[data-theme="retro"] .retro-badges{ display:flex; gap:6px; flex-wrap:wrap; justify-content:center; margin-top:8px; }
html[data-theme="retro"] .b88{ width:88px; height:31px; font-size:9px; font-weight:bold; line-height:1.05;
  display:flex; align-items:center; justify-content:center; text-align:center; border:1px solid #000; }
html[data-theme="retro"] .retro-a{ color:#00e; background:none; border:0; font:inherit; cursor:pointer; text-decoration:underline; padding:0; }
html[data-theme="retro"] .blink{ animation:retro-blink 1s steps(1) infinite; color:#f00; font-weight:bold; }
@keyframes retro-blink{ 50%{opacity:0} }

/* modern-only chrome hidden in retro */
html[data-theme="retro"] .pn{ font-family:"Times New Roman",serif; border-top:1px solid #808080; color:#000; }

/* respect reduced motion */
@media (prefers-reduced-motion: reduce){
  html[data-theme="retro"] .retro-marquee__t{ animation:none; }
  html[data-theme="retro"] .blink{ animation:none; }
}
```

- [ ] **Step 6: Extend `assets/js/skin.js`** — counter + MIDI + reduced-motion counter guard

Append inside the `DOMContentLoaded` handler:
```js
    // Fake hit counter (decorative; persists a per-visitor number)
    var lcd = document.getElementById('hit-counter');
    if (lcd) {
      var n = 1337;
      try {
        n = parseInt(localStorage.getItem('hits') || '1337', 10) + 1;
        localStorage.setItem('hits', String(n));
      } catch (e) {}
      lcd.textContent = ('00000000' + n).slice(-8);
    }
    // Click-to-play chiptune via WebAudio (no asset, never autoplay)
    var midi = document.getElementById('midi-btn');
    if (midi) {
      midi.addEventListener('click', function () {
        try {
          var ctx = new (window.AudioContext || window.webkitAudioContext)();
          var notes = [523,587,659,784,659,587,523]; var t = ctx.currentTime;
          notes.forEach(function (f, i) {
            var o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'square'; o.frequency.value = f;
            g.gain.setValueAtTime(0.06, t + i*0.18); g.gain.exponentialRampToValueAtTime(0.001, t + i*0.18 + 0.16);
            o.connect(g); g.connect(ctx.destination); o.start(t + i*0.18); o.stop(t + i*0.18 + 0.17);
          });
        } catch (e) {}
      });
    }
```

- [ ] **Step 7: Build + checks — expect OK**

Run: `bundle exec jekyll build && ./tests/skin-checks.sh` → Expected: `OK: task 4`.

- [ ] **Step 8: Manual check (the important one)**

`serve` → default load is **retro** (tiled navy, marquee, under-construction, counter, badges, Times New Roman). Click "Switch to MODERN site »" → Command Deck dark. Reload → stays where you left it. Visit a chapter in retro → prose readable on the light panel. Toggle `prefers-reduced-motion` in devtools → marquee/blink freeze.

- [ ] **Step 9: Commit**

```bash
git add assets/css/retro.css _includes/retro-ornaments.html _layouts/default.html assets/js/skin.js tests/skin-checks.sh
git commit -m "feat: full-kitsch retro skin (site-wide) with ornaments, counter, MIDI, reduced-motion"
```

---

### Task 5: "My Favorite Son's Lair" tile

**Files:**
- Modify: `index.html`, `tests/skin-checks.sh`

**Interfaces:**
- Consumes: `.cards`/`.card` (modern) and retro card styling (both already themed).

- [ ] **Step 1: Add assertion to `tests/skin-checks.sh`**

```bash
grep -q "Favorite Son's Lair" "$S/index.html" || fail "son tile missing"
grep -q 'geofratian.com' "$S/index.html" || fail "son tile link missing"
echo "OK: task 5"
```

- [ ] **Step 2: Run — expect FAIL** (`FAIL: son tile missing`).

- [ ] **Step 3: Add the card to `index.html`**

Inside the `<ul class="cards">`, after the existing cards (and before the `card--soon` "AI Projects" card, or after it — your call), add:
```html
    <li class="card card--son">
      <div class="card__body">
        <span class="tag">Family · ↗</span>
        <h2><a href="https://www.geofratian.com" target="_blank" rel="noopener">My Favorite Son's Lair</a></h2>
        <p>Venture off-site to <em>geofratian.com</em> — my son's corner of the web. Enter at your own risk.</p>
      </div>
    </li>
```

- [ ] **Step 4: Build + checks — expect OK.** Manual: card shows in both skins (dashed-accent in modern; normal card in retro).

- [ ] **Step 5: Commit**

```bash
git add index.html tests/skin-checks.sh
git commit -m "feat: add 'My Favorite Son's Lair' tile linking to geofratian.com"
```

---

### Task 6: Cleanup + full-matrix verification

**Files:**
- Delete: `assets/css/main.css` (superseded by modern.css)
- Modify: `_layouts/default.html` (remove any temporary `main.css` link)

- [ ] **Step 1: Remove the old stylesheet**

Confirm nothing references `main.css`: `grep -rn "main.css" _layouts _includes *.html assets` → should be empty after removing the temporary link from Task 2 Step 4. Then `git rm assets/css/main.css`.

- [ ] **Step 2: Full build + all checks**

Run: `bundle exec jekyll build && ./tests/skin-checks.sh` → Expected: `OK: task 5` (final echo) with all prior asserts passing.

- [ ] **Step 3: Manual matrix — 2 skins × representative pages**

Serve and verify: home, `/travel/`, a long chapter (`/roci-and-i-starting-the-trip/`), `/books/`, 404. In **both** skins each should be coherent and readable. Check: no-flash (navigate several pages in retro — no modern flash), no-JS (disable JS → modern baseline), keyboard (Tab to toggle, Enter flips), reduced-motion.

- [ ] **Step 4: Commit + push branch**

```bash
git rm assets/css/main.css
git add -A
git commit -m "chore: drop legacy main.css; modern.css is the baseline"
git push origin feature/skins-and-i18n
```

- [ ] **Step 5: STOP for review** — do not merge to `main`. Report results to George; merge only on his explicit approval (main deploys live).

---

## Self-Review

**Spec coverage:**
- §2.1 mechanism (data-theme, modern baseline, no-flash script) → Task 2. ✓
- §2.2 persistence, default retro, header toggle → Task 2. ✓
- §2.3 modern Command Deck + Raised Panel → Task 3. ✓
- §2.4 retro full kitsch site-wide, all ornaments, CSS-only, MIDI click-to-play → Task 4. ✓
- §2.5 accessibility (reduced-motion, aria, focus) → Task 2 (aria/focus) + Task 4 (reduced-motion). ✓
- §4 son's tile → Task 5. ✓
- §6 testing (local preview, matrix, no-flash, no-JS, reduced-motion) → Task 1 + Task 6. ✓
- §7 branch discipline, no merge without approval → Task 6 Step 5. ✓
- **Deferred to Plan B (correctly):** §3 languages, §3.5 MT notice, §3.1 build change. The language pill is present but visual-only here — noted as intentional. ✓

**Placeholder scan:** No TBD/TODO; all steps carry real code. The one "adapt to current structure" step (Task 3 Step 4 / Task 4 Step 4) instructs inspecting the layout because exact surrounding markup varies — includes the concrete before/after shape. Acceptable.

**Type/name consistency:** `data-theme` values `'modern'|'retro'` consistent across script, skin.js, CSS selectors. IDs `#skin-toggle`, `#hit-counter`, `#midi-btn`, classes `.retro-only`, `.reading`, `.card--son` consistent between includes, CSS, and JS. `localStorage['skin']` / `['hits']` consistent.
