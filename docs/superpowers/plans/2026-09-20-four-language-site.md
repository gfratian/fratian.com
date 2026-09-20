# Four-Language Site (EN | RO | IT | FR) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the whole of fratian.com — chrome and all content, including the ~25k words of travel chapters — in English, Romanian, Italian, and French, with real localized URLs, a working language switcher, and correct multilingual SEO.

**Architecture:** Switch the GitHub Pages build from the legacy built-in build to a **GitHub Actions** workflow so we can use the **`jekyll-polyglot`** plugin. English stays at the site root; other languages live under `/ro/`, `/it/`, `/fr/`. Each translatable file gets per-language siblings (`name.ro.ext` + `lang:` front-matter + the *same* `permalink`); polyglot emits one URL tree per language and rewrites links. UI strings live in `_data/i18n/*.yml`. This layers on top of the Plan A skin work (both toggles already sit in `default.html`).

**Tech Stack:** Jekyll 4 + `jekyll-polyglot` 1.14, GitHub Actions (`actions/jekyll-build-pages` or bundler + `actions/deploy-pages`), Ruby. Local preview via the same standalone-Jekyll setup as Plan A.

**Spec:** `docs/superpowers/specs/2026-09-20-skins-and-i18n-design.md`

## Global Constraints

- **English URLs never change.** `default_lang: en` with English at root (no `/en/`); RO/IT/FR get prefixes.
- **All work continues on `feature/skins-and-i18n`** (on top of Plan A). Never push to `main`; `main` deploys live.
- **The Pages-source cutover (legacy → Actions) is deferred to merge time** (Task 9). The workflow file is committed and proven on the branch first; flipping the repo's Pages `build_type` to `workflow` happens only at go-live, and is reversible (flip back to branch/legacy).
- **Translation fidelity:** translations must preserve the author's casual, funny first-person voice; keep all Markdown/HTML structure, links, image tags, front-matter keys, and `{% raw %}`/Liquid intact; translate only human-readable prose. Proper nouns and place names stay as-is unless a standard localized form exists.
- **Polyglot file convention (verified by spike):** a translation of `X.ext` is `X.<lang>.ext` with front-matter `lang: <lang>` and the **identical** `permalink:` to the English source. Applies to pages and to collection docs under `_chapters/` and `_moon/`.
- **RO ships with IT and FR** (George proofreads RO later). **MT notice** on non-English long-form pages.
- **Verification build command:** `bundle exec jekyll build`; assert against `_site/` (root = EN, `_site/ro/…`, `_site/it/…`, `_site/fr/…`). Extend `tests/skin-checks.sh` or add `tests/i18n-checks.sh`.
- **Local Ruby is 4.0 (brew); the Actions runner pins Ruby 3.3** in the workflow (polyglot 1.14 supports 3.x).

---

## File Structure

| File | Responsibility |
|---|---|
| `Gemfile` (modify) | add `jekyll-polyglot`; keep `jekyll ~> 4.4`, `webrick` |
| `_config.yml` (modify) | polyglot config: `languages`, `default_lang`, `exclude_from_localization`, `plugins` |
| `.github/workflows/pages.yml` (new) | build with bundler+polyglot, deploy via `actions/deploy-pages` |
| `_data/i18n/en.yml`, `ro.yml`, `it.yml`, `fr.yml` (new) | all UI-chrome strings per language |
| `_layouts/default.html` (modify) | `<html lang>`=active_lang; `{% I18n_Headers %}`; strings from `_data`; switcher |
| `_includes/site-controls.html` (modify) | real per-language links in the language pill |
| `_includes/lang-switch.html` (new, optional) | switcher logic if it grows beyond the pill |
| `_includes/mt-notice.html` (new) | machine-translation banner for non-EN long-form |
| `_layouts/chapter.html`, `post.html` (modify) | include MT notice when `active_lang != default_lang` |
| Translations (new): `about.ro.md`+it+fr, `projects/index.*`, `books/index.*`, `travel/index.*`, `moon/index.*`, `contact/index.*`, `thanks/index.*`, `ai/index.*`, `404.*`, `rocinante-*/index.*`, `_chapters/*.{ro,it,fr}.html`, `_moon/*.{ro,it,fr}.html` | localized content |
| `tests/i18n-checks.sh` (new) | build-output assertions for the language trees |
| `assets/js/skin.js` (modify) | MT-notice dismiss (localStorage) |

---

### Task 1: Multilingual build pipeline (local proof + workflow file)

**Files:** modify `Gemfile`, `_config.yml`; create `.github/workflows/pages.yml`, `tests/i18n-checks.sh`.

**Interfaces:**
- Produces: a build that emits `/`, `/ro/`, `/it/`, `/fr/` trees; `site.active_lang`, `site.languages`, `site.default_lang` available in Liquid.

- [ ] **Step 1: Write `tests/i18n-checks.sh` (the failing check)**
```bash
#!/usr/bin/env bash
set -euo pipefail
S=_site
fail(){ echo "FAIL: $1"; exit 1; }
for l in ro it fr; do
  [ -d "$S/$l" ] || fail "language tree /$l missing"
done
grep -q 'html lang="en"' "$S/index.html" || fail "root not lang=en"
grep -q 'html lang="ro"' "$S/ro/index.html" || fail "/ro not lang=ro"
echo "OK: i18n build"
```
`chmod +x tests/i18n-checks.sh`.

- [ ] **Step 2: Run it — expect FAIL** (`/ro` missing). `bundle exec jekyll build && ./tests/i18n-checks.sh`.

- [ ] **Step 3: Add polyglot to `Gemfile`**
```ruby
source "https://rubygems.org"
gem "jekyll", "~> 4.4"
gem "jekyll-polyglot", "~> 1.14"
gem "webrick"
```
Run `bundle install`.

- [ ] **Step 4: Add polyglot config to `_config.yml`** (append/merge)
```yaml
languages: ["en", "ro", "it", "fr"]
default_lang: "en"
exclude_from_localization: ["assets", "CNAME", ".nojekyll"]
parallel_localization: true
```
Add `jekyll-polyglot` to the `plugins:` list (currently `plugins: []`).

- [ ] **Step 5: Add `{% I18n_Headers %}` and localize `<html lang>` in `_layouts/default.html`**
Change `<html lang="{{ site.lang | default: 'en' }}">` → `<html lang="{{ site.active_lang }}">`.
Replace the manual `<link rel="canonical">` line with `{% I18n_Headers %}` (it emits canonical + `hreflang` alternates for every language). Keep the rest of `<head>`.

- [ ] **Step 6: Create a throwaway translation to prove trees build**
Create `about.ro.md` (copy of `about.md` front-matter with `lang: ro`, same `permalink`, body = "TEST RO"). Build.

- [ ] **Step 7: Build + checks — expect OK**
`bundle exec jekyll build && ./tests/i18n-checks.sh` → `OK: i18n build`. Confirm `_site/ro/about/index.html` exists and untranslated pages fall back to English under `/ro/`. Then delete the throwaway `about.ro.md`.

- [ ] **Step 8: Create `.github/workflows/pages.yml`**
```yaml
name: Build and deploy (Jekyll + polyglot)
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: "3.3"
          bundler-cache: true
      - uses: actions/configure-pages@v5
      - run: bundle exec jekyll build --baseurl "${{ steps.pages.outputs.base_path }}"
        env:
          JEKYLL_ENV: production
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./_site
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
(The workflow triggers on `main`; on the branch it can be run via `workflow_dispatch` once Pages source is Actions — but we defer the source flip to Task 9, so this file just sits ready.)

- [ ] **Step 9: Commit**
```bash
git add Gemfile _config.yml _layouts/default.html .github/workflows/pages.yml tests/i18n-checks.sh
git commit -m "feat(i18n): polyglot build pipeline + Actions workflow (source flip deferred)"
```

---

### Task 2: UI-chrome strings in four languages

**Files:** create `_data/i18n/{en,ro,it,fr}.yml`; modify `_layouts/default.html`, `_includes/site-controls.html`, `_includes/retro-ornaments.html`, `_includes/retro-foot.html`.

**Interfaces:**
- Consumes: `site.active_lang`.
- Produces: `{% assign t = site.data.i18n[site.active_lang] %}` string bundle used across layouts/includes.

- [ ] **Step 1: Create `_data/i18n/en.yml`** (canonical keys — copy exact current English)
```yaml
nav: { travel: "Travel", books: "Books", projects: "Projects", about: "About", contact: "Contact" }
tagline: "Travels, projects and other detours — a home for the things I write and build."
skin: { to_modern: "🖥️ Switch to MODERN site »", new: "NEW", old: "OLD" }
mt_notice: "Machine-translated — read the original in English"
mt_dismiss: "Dismiss"
footer_also: "Also worth a look:"
retro: { welcome: "Welcome to George Fratian's Personal Homepage on the World Wide Web!!!  Sign my guestbook!  Best viewed in Netscape Navigator at 800×600", under_construction: "THIS SITE IS UNDER CONSTRUCTION", visitor: "You are visitor number:", play_midi: "Play MIDI", guestbook: "Sign Guestbook", email: "Email me", webring: "Member of the Travel WebRing" }
son_tile: { tag: "Family · ↗", title: "My Favorite Son's Lair", body: "Venture off-site to geofratian.com — my son's corner of the web. Enter at your own risk." }
```
- [ ] **Step 2: Create `ro.yml`, `it.yml`, `fr.yml`** with the same keys, professionally translated (voice-preserving). Example (`ro.yml` nav + tagline):
```yaml
nav: { travel: "Călătorii", books: "Cărți", projects: "Proiecte", about: "Despre", contact: "Contact" }
tagline: "Călătorii, proiecte și alte ocolișuri — casa lucrurilor pe care le scriu și le construiesc."
```
(and so on for every key, in each of ro/it/fr — full sets written during execution).

- [ ] **Step 3: Wire strings into `_layouts/default.html`**
At top of `<body>` scope add `{% assign t = site.data.i18n[site.active_lang] | default: site.data.i18n[site.default_lang] %}`. Replace hard-coded nav labels with `{{ t.nav.travel }}` etc.; footer "Also worth a look:" with `{{ t.footer_also }}`.

- [ ] **Step 4: Wire strings into the retro includes** (`retro-ornaments.html`, `retro-foot.html`) using `t.retro.*`. (Pass `t` is global once assigned in default.html since includes share scope.)

- [ ] **Step 5: Build + spot-check** a `/ro/` page shows Romanian nav. Add an assertion to `tests/i18n-checks.sh`:
```bash
grep -q 'Călătorii' "$S/ro/index.html" || fail "ro nav not localized"
```
Build → OK.

- [ ] **Step 6: Commit** `feat(i18n): four-language UI-chrome strings via _data/i18n`.

---

### Task 3: Language switcher

**Files:** modify `_includes/site-controls.html`; add assertions.

**Interfaces:** Consumes `site.active_lang`, `site.languages`, `page.url` (un-prefixed permalink).

- [ ] **Step 1: Replace the static pill with real links.** In `_includes/site-controls.html`:
```liquid
<div class="lang-pill" role="group" aria-label="Language">
  {% for lang in site.languages %}
    {% if lang == site.default_lang %}{% assign href = page.url %}{% else %}{% assign href = page.url | prepend: '/' | prepend: lang | prepend: '/' %}{% endif %}
    <a class="lang{% if lang == site.active_lang %} is-on{% endif %}"
       href="{{ href | relative_url }}" hreflang="{{ lang }}" lang="{{ lang }}"
       {% if lang == site.active_lang %}aria-current="true"{% endif %}>{{ lang | upcase }}</a>
  {% endfor %}
</div>
```
(Verify the exact prefixing against the spike's output URLs; polyglot may also expose a helper — prefer the simplest form that produces `/ro{{ page.url }}` correctly.)

- [ ] **Step 2: Build + verify** on `/about/` and `/ro/about/`: each pill link lands on the same page in the target language; `is-on` marks the active one. Add assertion:
```bash
grep -q 'href="/ro/about/"' "$S/about/index.html" || fail "switcher EN→RO link wrong"
```
- [ ] **Step 3: Commit** `feat(i18n): working EN/RO/IT/FR language switcher`.

---

### Task 4: Machine-translation notice

**Files:** create `_includes/mt-notice.html`; modify `_layouts/chapter.html`, `_layouts/post.html`, `assets/js/skin.js`; add CSS to `modern.css` + `retro.css`.

- [ ] **Step 1: Create `_includes/mt-notice.html`**
```liquid
{% if site.active_lang != site.default_lang %}
<div class="mt-notice" id="mt-notice" data-key="mt-{{ page.url }}-{{ site.active_lang }}">
  <span>{{ t.mt_notice }}</span>
  <a href="{{ page.url | relative_url }}" hreflang="en" lang="en">EN ↗</a>
  <button type="button" class="mt-x" aria-label="{{ t.mt_dismiss }}">×</button>
</div>
{% endif %}
```
- [ ] **Step 2: Include it** at the top of the content in `chapter.html` and `post.html` (inside `.reading`, before the article header).
- [ ] **Step 3: Style** `.mt-notice` in `modern.css` (subtle accent-tinted bar) and under `html[data-theme="retro"]` in `retro.css` (period-appropriate). Include a `.mt-notice[hidden]` rule.
- [ ] **Step 4: Dismiss logic in `skin.js`** — on click, set `el.hidden = true` and remember `localStorage[key]`; on load, hide if remembered. (Add to the `DOMContentLoaded` block.)
- [ ] **Step 5: Build + verify** an `/it/` chapter shows the notice, an EN chapter does not; dismiss persists. Assertion:
```bash
grep -q 'mt-notice' "$S/it/roci-and-i-starting-the-trip/index.html" || fail "MT notice missing on IT chapter"
grep -q 'mt-notice' "$S/roci-and-i-starting-the-trip/index.html" && fail "MT notice must NOT show on EN chapter" || true
```
- [ ] **Step 6: Commit** `feat(i18n): machine-translation notice on non-English long-form`.

---

### Task 5: Pilot translation (end-to-end proof) — CHECKPOINT

Translate the smallest complete slice — the **About page** and any remaining home-visible strings — into RO/IT/FR, and verify the entire mechanism across all four languages before bulk work.

**Files:** create `about.ro.md`, `about.it.md`, `about.fr.md`.

- [ ] **Step 1: Read `about.md`** (front-matter + body).
- [ ] **Step 2: Create `about.<lang>.md`** for ro/it/fr: copy front-matter, add `lang: <lang>`, keep the **same `permalink`**, translate `title` and body (voice-preserving, structure intact).
- [ ] **Step 3: Build + verify** `/about/`, `/ro/about/`, `/it/about/`, `/fr/about/` each render natively; switcher moves between them; `<html lang>` and hreflang correct; home chrome localized in each tree.
- [ ] **Step 4: Serve + eyeball** all four About pages and the four home pages in both skins.
- [ ] **Step 5: Commit** `feat(i18n): pilot RO/IT/FR translation of About + verify pipeline`.
- [ ] **Step 6: STOP — report to George with screenshots.** Confirm quality/approach before bulk translation.

---

### Task 6: Translate the short pages

**Files:** create `<lang>` siblings for: `projects/index.html`, `books/index.html`, `travel/index.html`, `moon/index.html`, `contact/index.html`, `thanks/index.html`, `ai/index.md`, `404.html`, `rocinante-silver-2003-audi-s8/index.md`. Also the home `index.html` card blurbs (see note).

- [ ] **Step 1:** For each page, for each of ro/it/fr, create `name.<lang>.ext` with `lang:` + same `permalink`, translating visible prose only. Preserve Liquid (`{% ... %}`), HTML, front-matter keys, links, and the contact-form markup (translate labels/placeholders, keep the Web3Forms key and field `name`s unchanged).
- [ ] **Step 2: Home page** — the card blurbs on `index.html` contain prose. Either (a) create `index.<lang>.html` siblings translating the blurbs, or (b) move blurbs into `_data/i18n` and reference them. Prefer (a) for parity with other pages. Keep the son-tile card (translate its text via `t.son_tile` or inline).
- [ ] **Step 3: Build + assertions** per page (e.g., `grep -q '<ro word>' "$S/ro/projects/index.html"`). Add to `tests/i18n-checks.sh`.
- [ ] **Step 4: Serve + spot-check** several `/ro//it//fr/` short pages in both skins.
- [ ] **Step 5: Commit** `feat(i18n): translate short pages (RO/IT/FR)`.

---

### Task 7: Translate the long-form chapters + moon post

**Files:** create `_chapters/<name>.{ro,it,fr}.html` for all 7 chapters and `_moon/<name>.{ro,it,fr}.html`.

Chapters carry rich front-matter (`cover`, `prev/next`, `prev_title/next_title`, `comments`, `date`, `chapter`, `slug`, `permalink`). Translate only human-readable values (`title`, `prev_title`, `next_title`, and comment `html`/`author` display text where appropriate); keep `permalink`, `slug`, `cover`, `chapter`, dates, and structural keys identical; add `lang:`.

- [ ] **Step 1:** Do them one chapter × one language at a time (a natural task-per-file cadence). For each: read the English source, produce `<name>.<lang>.html` preserving all HTML/figures/links and front-matter, translating the prose in the author's voice.
- [ ] **Step 2:** After each language-complete chapter, `bundle exec jekyll build` and assert the `/‹lang›/‹permalink›/` page exists with translated body and the MT notice present.
- [ ] **Step 3:** Translate the moon post similarly.
- [ ] **Step 4: Commit** per chapter or per language batch (e.g., `feat(i18n): translate chapter 2 (RO/IT/FR)`), keeping commits reviewable.

---

### Task 8: Final multilingual verification

- [ ] **Step 1: Full build** `bundle exec jekyll build` → clean; `./tests/skin-checks.sh` and `./tests/i18n-checks.sh` → OK.
- [ ] **Step 2: Matrix** — for each of en/ro/it/fr: home, one chapter (MT notice on non-EN), one short page, 404 — in **both skins**. Verify switcher lands on the correct parallel page, `<html lang>` correct, hreflang alternates present, no untranslated leakage on translated pages.
- [ ] **Step 3: Link audit** — no broken internal links across trees; `exclude_from_localization` keeps `/assets/`, `CNAME` unprefixed.
- [ ] **Step 4: Commit + push** the branch. **STOP for review** — do not flip Pages source or merge without George's approval.

---

### Task 9: Cutover (executed at merge, with approval)

- [ ] **Step 1:** After George approves the merged branch, merge `feature/skins-and-i18n` → `main`.
- [ ] **Step 2:** Flip the repo's Pages source to GitHub Actions:
```bash
gh api -X PUT repos/gfratian/fratian.com/pages -f build_type=workflow
```
(or set "Build and deployment → Source: GitHub Actions" in repo Settings → Pages.)
- [ ] **Step 3:** Watch the Actions run go green; verify the live site at fratian.com serves `/`, `/ro/`, `/it/`, `/fr/` and the skins work.
- [ ] **Rollback:** `gh api -X PUT repos/gfratian/fratian.com/pages -f build_type=legacy -f 'source[branch]=main' -f 'source[path]=/'` and revert the merge; the legacy site returns.

---

## Self-Review

**Spec coverage:** §3.1 build change → T1 + T9. §3.2 URL scheme/`<html lang>`/hreflang → T1 (config, I18n_Headers, lang attr). §3.3 content model + full translation → T5/T6/T7; UI strings → T2. §3.4 switcher + fallback → T3 (fallback proven in T1 Step 7). §3.5 MT notice → T4. §3.6 skin×lang independence → both toggles already coexist (Plan A); verified in T8. §4 son tile localized → T2 (`t.son_tile`) + T6. §7 branch discipline / deferred cutover / rollback → T1 constraint, T8 Step 4, T9. ✓

**Placeholder scan:** Translation *content* is produced during execution (T2/T5/T6/T7), not pre-written here — that is content generation, not vague implementation; each such task specifies exact files, the `name.<lang>.ext` + `lang:` + same-`permalink` convention, fidelity rules, and per-file build assertions. No `TODO`/`TBD` in logic steps.

**Type/name consistency:** `site.active_lang` / `site.default_lang` / `site.languages` used consistently; `t = site.data.i18n[site.active_lang]` bundle keys match between en.yml and the layout references; polyglot file convention identical across pages and collections; `mt-notice` id/class/data-key consistent between include, CSS, and skin.js.

**Risk note:** the switcher URL-prefixing (T3 Step 1) and polyglot fallback are the two spots to verify empirically during execution against real `_site` output, since polyglot version behavior can vary — both have explicit build assertions.
