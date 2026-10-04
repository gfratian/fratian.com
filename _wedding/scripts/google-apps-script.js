/**
 * GOOGLE APPS SCRIPT WEBHOOK: Elizabeth & George Wedding RSVP
 * Account Target: gfratian@gmail.com
 *
 * ============================================================================
 * STEP-BY-STEP DEPLOYMENT INSTRUCTIONS (2 Minutes):
 * ============================================================================
 * 1. Sign in to your Google Account (gfratian@gmail.com).
 * 2. Go to Google Drive (https://drive.google.com) or Google Sheets (https://sheets.new).
 * 3. Create a new Google Spreadsheet and name it:
 *    "Elizabeth & George Wedding RSVPs 2027"
 * 4. In the top menu, click: Extensions > Apps Script.
 * 5. Delete any placeholder code in the script editor (Code.gs).
 * 6. Copy and paste the ENTIRE contents of this file into Code.gs.
 * 7. Click the disk icon ("Save project").
 * 8. At the top right, click "Deploy" > "New deployment".
 * 9. Click the gear icon next to "Select type" and choose "Web app".
 * 10. Configure deployment settings:
 *     - Description: Wedding RSVP Webhook
 *     - Execute as: Me (gfratian@gmail.com)
 *     - Who has access: Anyone  <-- (CRITICAL: enables your Next.js site to post)
 * 11. Click "Deploy".
 * 12. Review Permissions:
 *     - Click "Authorize access", choose your gfratian@gmail.com account.
 *     - If Google displays "Google hasn't verified this app", click "Advanced"
 *       and then "Go to Untitled project (unsafe)". Click "Allow".
 * 13. Copy the "Web app URL" (it starts with https://script.google.com/macros/s/...).
 * 14. Paste this URL into your website's .env.local:
 *     GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
 * ============================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds for concurrent writes
  try {
    lock.waitLock(30000);
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "Server is busy. Please try again."
    }, 503);
  }

  try {
    var sheet = getOrCreateRsvpSheet();
    var data = {};

    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var timestamp = new Date().toISOString();
    var primaryName = (data.fullName || data.name || "").toString().trim();
    var email = (data.email || "").toString().trim();
    var attending = data.attending === true || data.attending === "yes" || data.attending === "true" ? "YES" : "NO";
    var additionalGuests = (data.additionalGuests || data.plusOne || "").toString().trim();
    var dietary = Array.isArray(data.dietary) ? data.dietary.join(", ") : (data.dietary || "None").toString().trim();
    var thuPeles = data.thuPeles ? "YES" : "NO";
    var satBrunch = data.satBrunch ? "YES" : "NO";
    var satExcursion = data.satExcursion ? "YES" : "NO";
    var lodging = (data.lodging || "").toString().trim();
    var notes = (data.notes || "").toString().trim();
    var language = (data.language || "en").toString().toUpperCase();

    // Append to sheet
    var newRow = [
      timestamp,
      primaryName,
      email,
      attending,
      additionalGuests,
      dietary,
      thuPeles,
      satBrunch,
      satExcursion,
      lodging,
      notes,
      language
    ];

    sheet.appendRow(newRow);

    // Apply clean styling to the newly appended row
    var lastRow = sheet.getLastRow();
    var rowRange = sheet.getRange(lastRow, 1, 1, newRow.length);
    rowRange.setFontFamily("Arial");
    rowRange.setFontSize(10);
    rowRange.setVerticalAlignment("middle");

    // Highlight row green if attending, gray if declining
    if (attending === "YES") {
      sheet.getRange(lastRow, 4).setBackground("#d4edda").setFontColor("#155724").setFontWeight("bold");
    } else {
      sheet.getRange(lastRow, 4).setBackground("#f8d7da").setFontColor("#721c24").setFontWeight("bold");
    }

    return createJsonResponse({
      status: "success",
      message: "RSVP successfully recorded",
      row: lastRow,
      name: primaryName
    }, 200);

  } catch (error) {
    Logger.log("Error processing RSVP: " + error.toString());
    return createJsonResponse({
      status: "error",
      message: error.toString()
    }, 500);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  // Health check endpoint
  return createJsonResponse({
    status: "ok",
    message: "Elizabeth & George Wedding RSVP Webhook is active.",
    time: new Date().toISOString()
  }, 200);
}

function doOptions(e) {
  // CORS Preflight handler
  var output = ContentService.createTextOutput("");
  output.setMimeType(ContentService.MimeType.TEXT);
  return output;
}

function getOrCreateRsvpSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "RSVP Responses";
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    // If default "Sheet1" is empty, rename it; otherwise insert new sheet
    var activeSheet = ss.getActiveSheet();
    if (activeSheet && activeSheet.getLastRow() === 0 && activeSheet.getName() === "Sheet1") {
      activeSheet.setName(sheetName);
      sheet = activeSheet;
    } else {
      sheet = ss.insertSheet(sheetName);
    }
  }

  // Setup headers if sheet is brand new
  if (sheet.getLastRow() === 0) {
    var headers = [
      "Timestamp (UTC)",
      "Primary Guest Name(s)",
      "Email Address",
      "Attending Wedding (Fri May 28)",
      "Plus-One / Additional Guests",
      "Dietary Restrictions & Allergies",
      "Thu May 27 Peleș Tour & Welcome",
      "Sat May 29 Farewell Brunch",
      "Sat May 29 Cable Car / Bran Excursion",
      "Lodging Location / Shuttle Need",
      "Notes & Well Wishes",
      "Language (EN/RO)"
    ];

    sheet.appendRow(headers);

    // Style the header row
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#143729"); // Carpathian forest green
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontFamily("Arial");
    headerRange.setFontSize(11);
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    sheet.setRowHeight(1, 38);

    // Freeze top header row
    sheet.setFrozenRows(1);

    // Auto-resize columns
    for (var col = 1; col <= headers.length; col++) {
      sheet.autoResizeColumn(col);
    }
  }

  return sheet;
}

function createJsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
