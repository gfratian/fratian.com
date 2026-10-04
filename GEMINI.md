# Project Memory: Elizabeth & George Carpathian Wedding Portal

- **Micro-Site Subpath**: `https://fratian.com/may2027/`
- **Shortcuts & Aliases**: `/may28`, `/wedding`, `/rsvp` redirect to `/may2027/`
- **Source Code**: `_wedding/` (excluded from Jekyll in `_config.yml`)
- **Pre-built Static Bundle**: `may2027/`
- **CI/CD Workflow**: `.github/workflows/pages.yml` (builds Jekyll + `_wedding` static export into `_site`)
- **Passcode Gate**: `Cantacuzino27` (with guest bypass parameter `?key=Cantacuzino27`)
- **RSVP Form**: Submits directly from browser to Google Apps Script Webhook (`NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL`)
