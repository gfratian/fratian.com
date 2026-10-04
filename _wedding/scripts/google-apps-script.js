/**
 * GOOGLE APPS SCRIPT WEBHOOK: Elizabeth & George Wedding RSVP & Guest Manifest
 * Target: gfratian@gmail.com
 *
 * Tracks both INVITED guests and their RESPONSE STATUS (Accepted, Declined, No response).
 */

var HEADERS = [
  "Timestamp (UTC)",
  "Primary Guest Name(s)",
  "Email Address",
  "Cell Phone",
  "Number of People",
  "Invited (Planning Email)",
  "Response Status",
  "Plus-One / Additional Guests",
  "Dietary Restrictions & Allergies",
  "Thu May 27 Peleș Tour & Welcome",
  "Sat May 29 Farewell Brunch",
  "Sat May 29 Cable Car / Bran Excursion",
  "Lodging Location / Shuttle Need",
  "Notes & Well Wishes",
  "Language (EN/RO)"
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return createJsonResponse({ status: "error", message: "Server is busy. Please try again." }, 503);
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

    // 1. Bulk Import Action from Admin Portal
    if (data.action === "bulk_invitees" && Array.isArray(data.invitees)) {
      var addedCount = 0;
      var existingData = sheet.getDataRange().getValues();

      data.invitees.forEach(function (inv) {
        if (!inv || !inv.name) return;
        var name = (inv.name || "").toString().trim();
        var email = (inv.email || "").toString().trim();
        var phone = (inv.phone || "").toString().trim();
        var safePhone = phone ? (phone.indexOf("+") === 0 ? "'" + phone : phone) : "";
        var count = parseInt(inv.partySize, 10) || 2;
        var invited = inv.invited !== false ? "YES" : "NO";
        var status = inv.responseStatus || "No response";

        // Check if existing row matches by email or name
        var matchedRow = -1;
        if (existingData.length > 1) {
          for (var r = 1; r < existingData.length; r++) {
            var rowEmail = (existingData[r][2] || "").toString().trim().toLowerCase();
            var rowName = (existingData[r][1] || "").toString().trim().toLowerCase();
            if ((email && rowEmail === email.toLowerCase()) || (rowName && rowName === name.toLowerCase())) {
              matchedRow = r + 1;
              break;
            }
          }
        }

        if (matchedRow > 0) {
          // Update existing row
          if (phone) sheet.getRange(matchedRow, 4).setValue(safePhone);
          sheet.getRange(matchedRow, 5).setValue(count);
          sheet.getRange(matchedRow, 6).setValue(invited);
          formatRowStatus(sheet, matchedRow, sheet.getRange(matchedRow, 7).getValue() || status);
        } else {
          // Append new invitee row
          var row = [
            new Date().toISOString(),
            name,
            email,
            safePhone,
            count,
            invited,
            status,
            "", "", "NO", "NO", "NO", "", "", "EN"
          ];
          sheet.appendRow(row);
          var lastRow = sheet.getLastRow();
          formatRowStatus(sheet, lastRow, status);
          addedCount++;
        }
      });

      return createJsonResponse({
        status: "success",
        message: "Successfully processed invitees",
        added: addedCount
      }, 200);
    }

    // 2. Standard Guest RSVP Submission (from wedding portal form)
    var timestamp = new Date().toISOString();
    var primaryName = (data.fullName || data.name || "").toString().trim();
    var email = (data.email || "").toString().trim();
    var isAttending = data.attending === true || data.attending === "yes" || data.attending === "true";
    var responseStatus = isAttending ? "Accepted" : "Declined";
    var additionalGuests = (data.additionalGuests || data.plusOne || "").toString().trim();
    var partySize = parseInt(data.partySize, 10) || (additionalGuests ? 2 : 1);
    var dietary = Array.isArray(data.dietary) ? data.dietary.join(", ") : (data.dietary || "None").toString().trim();
    var thuPeles = data.thuPeles ? "YES" : "NO";
    var satBrunch = data.satBrunch ? "YES" : "NO";
    var satExcursion = data.satExcursion ? "YES" : "NO";
    var lodging = (data.lodging || "").toString().trim();
    var notes = (data.notes || "").toString().trim();
    var language = (data.language || "en").toString().toUpperCase();

    // Check if guest is already in the sheet as an invited party
    var sheetData = sheet.getDataRange().getValues();
    var existingRow = -1;

    if (sheetData.length > 1) {
      for (var i = 1; i < sheetData.length; i++) {
        var existingEmail = (sheetData[i][2] || "").toString().trim().toLowerCase();
        var existingName = (sheetData[i][1] || "").toString().trim().toLowerCase();
        if ((email && existingEmail === email.toLowerCase()) || (existingName && existingName === primaryName.toLowerCase())) {
          existingRow = i + 1;
          break;
        }
      }
    }

    if (existingRow > 0) {
      // Update existing invited guest row with their response and details
      sheet.getRange(existingRow, 1).setValue(timestamp);
      sheet.getRange(existingRow, 5).setValue(partySize);
      sheet.getRange(existingRow, 7).setValue(responseStatus);
      sheet.getRange(existingRow, 8).setValue(additionalGuests);
      sheet.getRange(existingRow, 9).setValue(dietary);
      sheet.getRange(existingRow, 10).setValue(thuPeles);
      sheet.getRange(existingRow, 11).setValue(satBrunch);
      sheet.getRange(existingRow, 12).setValue(satExcursion);
      sheet.getRange(existingRow, 13).setValue(lodging);
      sheet.getRange(existingRow, 14).setValue(notes);
      sheet.getRange(existingRow, 15).setValue(language);
      formatRowStatus(sheet, existingRow, responseStatus);

      return createJsonResponse({
        status: "success",
        message: "RSVP response updated for invited guest",
        row: existingRow,
        responseStatus: responseStatus
      }, 200);
    } else {
      // New RSVP submission (append row)
      var phone = (data.phone || "").toString().trim();
      var safePhone = phone ? (phone.indexOf("+") === 0 ? "'" + phone : phone) : "";
      var newRow = [
        timestamp,
        primaryName,
        email,
        safePhone,
        partySize,
        "YES",
        responseStatus,
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
      var lastRow = sheet.getLastRow();
      formatRowStatus(sheet, lastRow, responseStatus);

      return createJsonResponse({
        status: "success",
        message: "RSVP recorded successfully",
        row: lastRow,
        responseStatus: responseStatus
      }, 200);
    }

  } catch (error) {
    Logger.log("Error processing RSVP: " + error.toString());
    return createJsonResponse({ status: "error", message: error.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "health";

  if (action === "list" || action === "stats") {
    try {
      var sheet = getOrCreateRsvpSheet();
      var data = sheet.getDataRange().getValues();
      var rows = [];

      if (data && data.length > 1) {
        var headerRow = data[0];
        // Determine whether sheet uses new 15-column format or legacy 12-column format
        var hasNewColumns = headerRow.length >= 15 && headerRow[6] === "Response Status";

        for (var i = 1; i < data.length; i++) {
          var r = data[i];
          if (!r[1] && !r[2]) continue; // Skip empty rows

          if (hasNewColumns) {
            rows.push({
              id: i,
              timestamp: r[0] ? new Date(r[0]).toISOString() : "",
              fullName: (r[1] || "").toString(),
              email: (r[2] || "").toString(),
              phone: (r[3] || "").toString(),
              partySize: parseInt(r[4], 10) || 1,
              invited: r[5] === "YES" || r[5] === true,
              responseStatus: (r[6] || "No response").toString(),
              attending: r[6] === "Accepted",
              additionalGuests: (r[7] || "").toString(),
              dietary: (r[8] || "").toString(),
              thuPeles: r[9] === "YES" || r[9] === true,
              satBrunch: r[10] === "YES" || r[10] === true,
              satExcursion: r[11] === "YES" || r[11] === true,
              lodging: (r[12] || "").toString(),
              notes: (r[13] || "").toString(),
              language: (r[14] || "EN").toString()
            });
          } else {
            // Graceful fallback for legacy 12-column format
            var attending = r[3] === "YES" || r[3] === true;
            rows.push({
              id: i,
              timestamp: r[0] ? new Date(r[0]).toISOString() : "",
              fullName: (r[1] || "").toString(),
              email: (r[2] || "").toString(),
              phone: "",
              partySize: 1,
              invited: true,
              responseStatus: attending ? "Accepted" : "Declined",
              attending: attending,
              additionalGuests: (r[4] || "").toString(),
              dietary: (r[5] || "").toString(),
              thuPeles: r[6] === "YES" || r[6] === true,
              satBrunch: r[7] === "YES" || r[7] === true,
              satExcursion: r[8] === "YES" || r[8] === true,
              lodging: (r[9] || "").toString(),
              notes: (r[10] || "").toString(),
              language: (r[11] || "EN").toString()
            });
          }
        }
      }

      var ss = SpreadsheetApp.getActiveSpreadsheet();
      return createJsonResponse({
        status: "success",
        spreadsheetUrl: ss ? ss.getUrl() : "",
        count: rows.length,
        data: rows
      }, 200);

    } catch (err) {
      return createJsonResponse({ status: "error", message: err.toString() }, 500);
    }
  }

  // Health check endpoint
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return createJsonResponse({
    status: "ok",
    message: "Elizabeth & George Wedding RSVP Webhook is active.",
    spreadsheetUrl: ss ? ss.getUrl() : "",
    time: new Date().toISOString()
  }, 200);
}

function getOrCreateRsvpSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "RSVP Responses";
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    var activeSheet = ss.getActiveSheet();
    if (activeSheet && activeSheet.getLastRow() === 0 && activeSheet.getName() === "Sheet1") {
      activeSheet.setName(sheetName);
      sheet = activeSheet;
    } else {
      sheet = ss.insertSheet(sheetName);
    }
  }

  // If brand new sheet, write the 15 headers
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    formatHeaderRow(sheet);
  } else {
    // If sheet exists with old headers, upgrade row 1 headers smoothly
    var headerValues = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), HEADERS.length)).getValues()[0];
    if (headerValues[6] !== "Response Status") {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      formatHeaderRow(sheet);
    }
  }

  return sheet;
}

function formatHeaderRow(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setBackground("#143729");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontFamily("Arial");
  headerRange.setFontSize(10);
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);

  sheet.getRange("D:D").setNumberFormat("@");
  for (var col = 1; col <= HEADERS.length; col++) {
    sheet.autoResizeColumn(col);
  }
}

function formatRowStatus(sheet, rowNum, status) {
  var rowRange = sheet.getRange(rowNum, 1, 1, HEADERS.length);
  rowRange.setFontFamily("Arial");
  rowRange.setFontSize(10);
  rowRange.setVerticalAlignment("middle");

  var statusCell = sheet.getRange(rowNum, 7);
  if (status === "Accepted") {
    statusCell.setBackground("#d4edda").setFontColor("#155724").setFontWeight("bold");
  } else if (status === "Declined") {
    statusCell.setBackground("#f8d7da").setFontColor("#721c24").setFontWeight("bold");
  } else {
    statusCell.setBackground("#fff3cd").setFontColor("#856404").setFontWeight("bold");
  }
}

function createJsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
