# Project Memory: Elizabeth & George Carpathian Wedding Portal

- **Target Domain & Subpath**: `https://fratian.com/may2027/`
- **Shortcuts & Aliases**: `/may28`, `/wedding`, `/rsvp`, `/admin` redirect to `/may2027/` and `/may2027/admin/`
- **Canonical Repository**: `https://github.com/gfratian/fratian.com` (local path: `/Users/gfratian/fratian.com`)
- **Source Location in Repository**: `_wedding/` (excluded from Jekyll in `_config.yml`)
- **Pre-built Static Bundle**: `may2027/`
- **CI/CD Workflow**: `.github/workflows/pages.yml` (builds Jekyll + `_wedding` static export into `_site`)
- **Passcode Gate**: `Cantacuzino27` (with guest bypass parameter `?key=Cantacuzino27`)
- **Admin Portal**: `https://fratian.com/may2027/admin/` (Passcode: `CantacuzinoAdmin27`, bypass `?admin_key=CantacuzinoAdmin27`)
- **RSVP Form**: Submits directly from browser to Google Apps Script Webhook (`NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL`)

