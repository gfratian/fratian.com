# fratian.com — Dual Skins + Four-Language Site (Design Spec)

**Date:** 2026-09-20
**Author:** George Fratian (with Claude)
**Repo:** `gfratian/fratian.com` (Jekyll, GitHub Pages, custom domain fratian.com)
**Branch:** `feature/skins-and-i18n`

---

## 1. Overview & Goals

Add two independent, always-visible controls to every page of fratian.com:

1. **Skin switch — `OLD | NEW`** — flips the entire site between a brand-new modern
   design ("Command Deck," built on the LegalEagle palette) and a full-kitsch 1990s
   GeoCities-style retro design.
2. **Language switch — `EN | RO | IT | FR`** — serves the whole site, including the
   ~25,000 words of travel chapters, in English, Romanian, Italian, and French, with
   proper localized URLs and SEO.

These are two separate subsystems that ship together. The skin switch is a
client-side CSS/JS concern; the language switch is a build-pipeline + content concern.

### Success criteria
- Both toggles appear top-right on every page, in both skins, in all four languages.
- A visitor's skin and language choices persist across pages and visits.
- No flash of the wrong skin on navigation.
- Search engines and JS-disabled visitors get the clean, readable modern site.
- All four languages are fully translated at launch (RO shipped, polished later).
- Existing URLs (English) do not change.

---

## 2. Feature 1 — Dual-Skin System

### 2.1 Mechanism
- A single attribute on the root element drives everything: `<html data-theme="retro">`
  or `<html data-theme="modern">`.
- **Modern is the CSS baseline** (unscoped rules). Retro rules live in a separate
  stylesheet, every selector prefixed `html[data-theme="retro"] …`, loaded *after*
  the modern stylesheet so specificity wins naturally — no stylesheet swapping.
- **No-flash inline script** in `<head>`, before the stylesheet links:
  ```html
  <script>
  (function () {
    try {
      var s = localStorage.getItem('skin');
      if (!s) s = 'retro';               // chosen default for real visitors
      document.documentElement.setAttribute('data-theme', s);
    } catch (e) { /* JS off / storage blocked: baseline modern renders */ }
  })();
  </script>
  ```
- **No-JS / crawler behavior:** with no script, no `data-theme` is set, so the modern
  baseline renders. This is deliberate: bots and JS-off users get the clean,
  accessible, readable version; humans get retro-by-default via the script.

### 2.2 Persistence & interaction
- Skin stored in `localStorage['skin']` (`'retro'` | `'modern'`).
- **Default for first-time visitors: `retro`.** Remembered thereafter.
- Toggling sets the attribute and writes localStorage instantly — **no page reload**.
- Toggle UI lives once in `_layouts/default.html`'s header (covers every page — all
  layouts and `404.html` extend `default`).

### 2.3 Modern skin ("Command Deck")
Built on the LegalEagle palette, wired as configurable CSS custom properties so
accent/background can be changed in one place:
```css
:root{
  --bg:#0f1115; --panel:#161a22; --panel2:#1d2230; --border:#2a3142;
  --text:#e6e8ed; --muted:#8a93a6; --accent:#5ea3ff;
  --pass:#3ec56d; --warn:#f0b860; --fail:#ef5e5e;
}
```
- **Home / index / section pages:** dark dashboard. Bordered "panel" cards
  (`--panel` bg, `--border`, hover → accent border), mono uppercase tags in accent,
  tight responsive grid. Header brand `fratian.com` with accent `.com`.
- **Chapter / article pages ("Raised Panel"):** the long prose sits in a raised
  `--panel` card floating over the dark background, brighter body text (`--text`),
  comfortable measure (~68ch max-width) and line-height (~1.65). Dashboard chrome
  (header, toggles, tags, prev/next nav) stays dark. Chosen over pure dark-on-dark
  for readability across 3,000–6,000-word pieces.
- Typography: system UI stack for body/UI; mono (`ui-monospace`) for tags/labels.

### 2.4 Retro skin ("Old") — full kitsch, site-wide
Applies to **every page**, including chapters (chapter prose renders as
Times New Roman on a light silver/white beveled inner panel over the tiled
background — period-accurate and readable). **All ornaments kept:**
- Tiled starry navy background; `ridge`/`inset`/`outset` bevels.
- Rainbow-gradient WordArt title; italic tagline.
- Scrolling **marquee** welcome banner (CSS keyframes, not `<marquee>`).
- Hazard-stripe **"Under Construction"** bar.
- Green LCD **visitor hit counter** — decorative; a per-visitor count kept in
  localStorage (no backend), displayed in monospace LCD style.
- Blinking **NEW! / HOT!** tags (CSS animation).
- **88×31 web badges** ("Netscape Now", "Made with Notepad", "Best viewed 800×600",
  "Valid HTML 3.2", "Y2K Ready") — rendered in CSS, no external GIFs.
- **Guestbook / WebRing** footer links — decorative period flavor; guestbook links to
  the Contact page, webring is a static ornament.
- **"Play MIDI"** button — **click-to-play only, never autoplay.** Implemented with a
  short royalty-free chiptune asset or a tiny WebAudio-synthesized loop (to avoid
  licensing/asset weight). Off by default.
- Toggle rendered in-skin as a beveled **"Switch to MODERN site »"** button; language
  switch as a period `[ English ] · [ Română ] · [ Italiano ] · [ Français ]` bar.

CSS-only ornaments = zero new image dependencies (except the optional MIDI clip).

### 2.5 Accessibility
- `@media (prefers-reduced-motion: reduce)` disables marquee/blink/counter animation
  (static fallbacks) in the retro skin.
- Both toggles are real, keyboard-focusable controls with `aria-label`s and visible
  focus rings; the skin toggle is a `button`, the language switch a set of links.
- Skip-link and semantic landmarks retained in both skins.
- Retro colors kept within readable contrast on the content panel (dark text on light).

---

## 3. Feature 2 — Four-Language Site (EN | RO | IT | FR)

### 3.1 Build pipeline change (required)
The site is currently a **legacy** GitHub Pages build (built-in plugins only), which
cannot do real multilingual cleanly. We switch the Pages build to a **GitHub Actions
workflow** so we can use the **`jekyll-polyglot`** plugin.
- Add `.github/workflows/pages.yml`: build with Ruby/Bundler + Jekyll + polyglot, then
  deploy to Pages (`actions/deploy-pages`).
- Add plugin to `Gemfile` and to `_config.yml` `plugins:`.
- Change repo Pages source from "Deploy from a branch" to "GitHub Actions."
- **Reversible:** if the Actions build misbehaves, switch the Pages source back to
  `main`/branch and the legacy build resumes.

### 3.2 URL scheme & SEO
- Languages: `languages: [en, ro, it, fr]`, `default_lang: en`, `exclude_from_localization`
  for assets. **English stays at the root** (no `/en/` prefix); others get
  `/ro/…`, `/it/…`, `/fr/…`. Existing English URLs are unchanged.
- `<html lang>` reflects `site.active_lang` (currently hardcoded to `site.lang` in
  `default.html` — fix this).
- Polyglot emits `hreflang` alternates per page for correct multilingual SEO;
  canonical stays per-language.

### 3.3 Content model & translation
- UI strings (nav, footer, tags, buttons, MT notice, retro ornaments) live in
  `_data/i18n/{en,ro,it,fr}.yml`; layouts read `site.data.i18n[site.active_lang]`.
- Page/collection bodies are translated per language using polyglot's convention
  (parallel language files sharing a permalink/slug). Scope = **everything**: all
  standalone pages (about, projects, books, travel index, moon index, contact,
  thanks, 404) **and** all collection items (7 chapters + moon post).
- **Translation is machine-generated** (Claude) EN→RO/IT/FR for all ~25k words.
  Every future English content edit must be mirrored into three translations — a known
  ongoing maintenance cost, accepted.
- **Romanian ships at launch** alongside IT/FR; George proofreads/polishes RO later
  (native speaker). No RO hold-back.

### 3.4 Language switcher & fallback
- Switcher offers the **same page in the other language** (polyglot resolves the
  parallel file by slug). English stays root; others prefixed.
- If a translation is ever missing, fall back to the **English original** and show the
  MT notice. (At launch, nothing should be missing.)

### 3.5 Machine-translation notice
- On **non-English long-form pages** (chapters, moon post), a subtle, **dismissible**
  banner: "Machine-translated — read the original in English," linking to the English
  version. Dismissal remembered in localStorage. Not shown on English pages or on
  short chrome-only pages.

### 3.6 Skin × language independence
The skin (CSS/JS) and language (URL/build) are orthogonal. The language pill and skin
switch both render in **both** skins and in **all four** languages. Choosing a language
navigates to the localized URL; the skin choice (localStorage) carries across.

---

## 4. Son's-Site Tile

- Add a homepage card linking to **https://geofratian.com**, label
  **"My Favorite Son's Lair"** (localized in RO/IT/FR too), styled per skin
  (accent dashed-border card in modern; blinking "HOT!" table row in retro).
- Keep the existing "Also worth a look: geofratian.com" footer link.

---

## 5. Files Touched

| File | Change |
|---|---|
| `_config.yml` | polyglot config (`languages`, `default_lang`, `parallel_localization`), add plugin, i18n defaults |
| `Gemfile` | add `jekyll-polyglot` (+ jekyll pinned for Actions build) |
| `.github/workflows/pages.yml` | **new** — Actions build+deploy replacing legacy build |
| `_layouts/default.html` | no-flash script; both toggles in header; `<html lang>` = active_lang; hreflang; MT-notice include hook; load modern + retro CSS |
| `_layouts/chapter.html`, `post.html`, `page.html` | Raised-Panel wrapper for prose; MT notice on long-form |
| `assets/css/main.css` → `modern.css` | reworked modern skin with token variables (Command Deck + Raised Panel) |
| `assets/css/retro.css` | **new** — all retro rules scoped under `html[data-theme="retro"]` |
| `assets/js/skin.js` | toggle handler, localStorage, counter, MT-notice dismiss, optional MIDI |
| `_data/i18n/{en,ro,it,fr}.yml` | **new** — UI strings |
| Content: pages + `_chapters/*`, `_moon/*` | **new** RO/IT/FR parallel files (translations) |
| `index.html` | son's-lair card |
| `_includes/` | small includes for toggles, MT notice, language switcher, retro ornaments |

---

## 6. Testing & Verification

- **Local preview:** Jekyll is **not currently installed** (Ruby/Bundler are). Run
  `bundle install` (jekyll + jekyll-polyglot) to preview locally with
  `bundle exec jekyll serve`. This is the primary pre-merge check, since GitHub Pages
  only builds the live site.
- **Manual matrix:** verify representative pages across **4 languages × 2 skins**:
  home/index, a chapter (long prose + Raised Panel + MT notice), a short page, 404.
- **No-flash check:** navigate between pages in retro mode — no modern flash.
- **No-JS check:** disable JS → modern baseline renders coherently.
- **Reduced-motion check:** retro animations stop.
- **Actions build must go green** on the branch before merge; inspect the built site.
- **Links/hreflang:** language switcher lands on the correct parallel page; hreflang
  present.

---

## 7. Deployment & Rollback

- All work on **`feature/skins-and-i18n`**; **merge to `main` only after George's
  explicit approval** (main deploys live on push).
- The Pages-source switch (branch → Actions) happens at cutover, with the workflow
  already proven green on the branch.
- **Rollback:** revert the merge and switch Pages source back to branch build; the
  legacy site returns. Skin/i18n are additive and revertible.

---

## 8. Risks, Scope & YAGNI

- **Translation maintenance:** every English edit → three translation updates. Accepted;
  MT notice sets reader expectations.
- **Retro readability on long chapters:** mitigated by the light content panel.
- **Build-pipeline change** is the main risk; mitigated by proving the Actions build on
  the branch and keeping the legacy fallback.
- **Default = retro** may read as "broken" to the uninitiated; the Under-Construction
  motif and prominent "Switch to MODERN site" button signal intentionality. SEO/social
  previews are unaffected (skin is presentation-only; content/meta identical).
- **Out of scope:** real guestbook/counter backends, real webring membership, comment
  system changes, new content beyond the son's tile, redesign of geofratian.com.
