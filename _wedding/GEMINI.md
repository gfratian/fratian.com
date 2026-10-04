# Project Memory: Elizabeth & George Carpathian Wedding Portal

## 1. Domain & Routing
- **Target Domain & Subpath**: `https://fratian.com/may2027/`
- **Shortcuts & Aliases**: `/may28`, `/wedding`, `/rsvp`, `/admin` redirect to `/may2027/` and `/may2027/admin/`
- **Canonical Repository**: `https://github.com/gfratian/fratian.com` (local path: `/Users/gfratian/fratian.com`)
- **Source Location in Repository**: `_wedding/` (excluded from Jekyll in `_config.yml`)
- **Pre-built Static Bundle**: `may2027/`
- **CI/CD Workflow**: `.github/workflows/pages.yml` (builds Jekyll + `_wedding` static export into `_site`)
- **Passcode Gate**: `Cantacuzino27` (with guest bypass parameter `?key=Cantacuzino27`)
- **Admin Portal**: `https://fratian.com/may2027/admin/` (Passcode: `CantacuzinoAdmin27`, bypass `?admin_key=CantacuzinoAdmin27`)

## 2. Google Sheets Webhook Integration
- **Active Webhook URL**: `https://script.google.com/macros/s/AKfycbzVbqtZEU5MoD2yZSnR8GS7SiWmN-29T-bP60Uug2TSm4w67SqQ0mNZq76MKgLJRyq_/exec`
- **Google Sheet URL**: `https://docs.google.com/spreadsheets/d/19KEL7knDCkQPInz0JpwlZmj0czKqM3Gf4Hxe2VXEsVc/edit`
- **Submission Mode**: Browser sends `POST` request with `mode: 'no-cors'` and `Content-Type: text/plain;charset=utf-8`.
- **Apps Script File**: `_wedding/scripts/google-apps-script.js` (and `scripts/google-apps-script.js` in scratch).

## 3. Key Design Decisions & Core Features
- **Dynamic Party Size Calculation**:
  - If a partner / plus-one name is present (`additionalGuests`), the party size is guaranteed to be at least `2` seats (or greater if extra guests are specified).
  - Admin dashboard dynamically computes seats and aggregates `acceptedSeats` and `totalSeats` accurately regardless of raw sheet column value.
- **Independent Dietary & Allergy Tracking**:
  - The RSVP form provides separate dietary selection for the primary guest and plus-one partner.
  - Submissions are formatted as `Primary Guest: [Dietary] | Plus-One: [Dietary]`.
  - The Admin Manifest parses this format and displays individual chips (amber for primary, emerald for partner).
- **RSVP-Focused Admin Dashboard**:
  - Eliminated pre-invitee workflow (no pre-loaded roster, no "Invited" column, no "Bulk Load" button).
  - Live Event Headcount KPI Cards: Total RSVPs (seats & parties), Attending (Yes), Declined (No), Peleș Castle Tour, Recovery Brunch, Cable Car / Bran Excursion.
  - Filter Tabs: All RSVPs, Attending, Declined, Dietary Requirements.
  - Manual RSVP Entry: `+ Record RSVP` modal allows hosts to record phone/verbal RSVPs with full attendee details.
- **Design & Aesthetics**:
  - Obsidian dark luxury aesthetic (`bg-stone-950`, gold and emerald accents, Cormorant Garamond serif).
  - Cleaned up RSVP form: removed unnecessary wavy decorative SVG divider.
