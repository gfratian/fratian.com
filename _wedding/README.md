# Elizabeth & George — Carpathian Wedding Micro-Site (`fratian.com/may2027`)

A private, mobile-first, password-protected, bilingual (English & Romanian) single-page wedding website celebrating the marriage of **Elizabeth & George** on **May 28, 2027** at **Castelul Cantacuzino** in Bușteni, Romania.

---

## 🏔️ Highlights & Features

1. **Security & Zero-Crawler Shield**:
   - `robots.txt` strictly disallows all search engines and AI scrapers (`GPTBot`, `ChatGPT-User`, `Google-Extended`, `CCBot`, `anthropic-ai`, `Claude-Web`, etc.).
   - Global HTTP Header: `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`.
2. **Discreet Password Gate**:
   - Initial lock screen with neutral backdrop: *"A Carpathian Celebration • May 2027"* / *"O Sărbătoare în Carpați • Mai 2027"* (zero names or dates until unlocked).
   - Configured Passcode: **`Cantacuzino27`**.
   - Input shake animation on error.
   - Dual session persistence (`localStorage` + 30-day cookie).
   - **Bypass Query Parameter**: Visitors clicking `?key=Cantacuzino27` are automatically unlocked, authenticated via cookie, and redirected to the clean URL `/may2027`.
3. **Subpath & Alias Routing**:
   - Root micro-site: `/may2027`.
   - Automatic 302 redirects from `/may28`, `/wedding`, and `/rsvp` to `/may2027`.
4. **Bilingual Localization (`EN | RO`)**:
   - Persistent `EN | RO` toggle in sticky header and lock screen.
   - Complete copy dictionaries in `src/locales/en.json` and `src/locales/ro.json`.
5. **Interactive UI**:
   - Live countdown ticker to Friday, May 28, 2027 (hydration-safe).
   - 3-day tabbed weekend itinerary (Thu Peleș tour & welcome feast, Fri nuptials & banquet under Caraiman Cross, Sat farewell brunch & Bușteni cable car / Bran Castle).
   - Travel guide (SAN/LAX flights via Lufthansa MUC, Memorial Day flight alert, Schengen entry, EES/ETIAS requirements).
   - Ground transit comparison table (Private Chauffeur vs. Scenic Train vs. Rental Car).
   - Lodging hubs (Bușteni pensiuni, Sinaia spa hotels, Brașov medieval center).
   - Slide-over deep-reading drawer (Cantacuzino history, Peleș history, 1-week Transylvania loop, Danube Delta route).
   - Practical cards (RON currency, contactless/Apple Pay, 10% tipping, bear safety, 0.0‰ driving & Waze).
6. **RSVP & Google Sheets Integration**:
   - Interactive form with dietary options, optional event checkboxes, and notes.
   - Next.js API route (`/api/rsvp`) forwarding directly to Google Apps Script.
   - Standalone `scripts/google-apps-script.js` with auto-header generation, alternating row colors, and locks.

---

## 📊 Google Sheets Setup for `gfratian@gmail.com`

To link the RSVP form to your Google Drive under `gfratian@gmail.com`:

1. Sign in to [Google Sheets](https://sheets.new) with `gfratian@gmail.com`.
2. Name the sheet **"Elizabeth & George Wedding RSVPs 2027"**.
3. In the top menu, go to **Extensions > Apps Script**.
4. Replace any default code in `Code.gs` with the complete code inside [`scripts/google-apps-script.js`](file:///Users/gfratian/.gemini/antigravity/scratch/fratian-wedding-may2027/scripts/google-apps-script.js).
5. Click **Save** (disk icon).
6. Click **Deploy > New deployment**:
   - **Type**: Web app
   - **Description**: Wedding RSVP Webhook
   - **Execute as**: Me (`gfratian@gmail.com`)
   - **Who has access**: **Anyone** *(enables the web form to post)*
7. Click **Deploy** and authorize the script when prompted.
8. Copy the generated **Web app URL** (starts with `https://script.google.com/macros/s/.../exec`).
9. Paste into `.env.local`:
   ```bash
   GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
   ```

*(Note: In development without a webhook URL, the site runs in mock mode, logging RSVPs cleanly and returning success.)*

---

## 🌐 Hosting Architecture: How `fratian.com/may2027` Works

Depending on how your domain `fratian.com` is hosted, here are the two standard deployment approaches:

### Option A: Standalone Deployment (Recommended if this project manages the domain or sub-routes)
- Deploy this repository to Vercel, Netlify, Cloudflare, or a VPS.
- Next.js serves the entire site. Requests to `/` or aliases (`/may28`, `/wedding`, `/rsvp`) immediately 302 redirect to `/may2027`.
- All CSS, JS, and images live cleanly under Next.js assets.

### Option B: Reverse-Proxy / Subpath (If `fratian.com` already has an existing website)
- If `fratian.com` already hosts a portfolio, blog, or company page:
  - Deploy this Next.js app on a host (e.g. Vercel or a dedicated server/port).
  - Add a reverse-proxy rule in your main web server (Nginx, Caddy, Cloudflare Rules/Workers):
    - Proxy traffic for `/may2027`, `/may28`, `/wedding`, `/rsvp` to this Next.js app.
  - The micro-site's assets and routes are cleanly isolated under `/may2027` so nothing collides with the existing `fratian.com` root.

---

## 🛠️ Development & Build Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```
