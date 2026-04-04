# 📊 Google Sheets Integration — Setup Guide

This guide walks you through connecting **CodeQuest** registration submissions to a Google Sheet using a free Google Apps Script Web App (no backend, no billing required).

---

## Step 1 — Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2. Rename the first sheet tab to **`Registrations`** (right-click the tab → Rename).
3. In **Row 1** add these exact headers (one per column):

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Timestamp | Team Name | Team Lead | College | Contact | Members | Emails | Track |

---

## Step 2 — Create the Apps Script Web App

1. In your Google Sheet, click **Extensions → Apps Script**.
2. Delete any code in the editor and paste the following:

```javascript
const SHEET_NAME = "Registrations";

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const p = e.parameter;

    sheet.appendRow([
      p.submittedAt  || new Date().toISOString(),
      p.teamName     || "",
      p.teamLead     || "",
      p.college      || "",
      p.contact      || "",
      p.members      || "",
      p.emails       || "",
      p.track        || "",
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: handle GET for quick health-check
function doGet() {
  return ContentService.createTextOutput("CodeQuest Sheets endpoint is live ✅");
}
```

3. Click **💾 Save** (Ctrl+S / Cmd+S), name the project e.g. `CodeQuest Registrations`.

---

## Step 3 — Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click ⚙️ next to "Select type" and choose **Web App**.
3. Fill in:
   - **Description**: `CodeQuest registration handler`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone` ← **important** (allows the site to POST)
4. Click **Deploy** → **Authorize access** → pick your Google account → **Allow**.
5. Copy the **Web App URL** shown (looks like `https://script.google.com/macros/s/ABCDEF.../exec`).

---

## Step 4 — Add URL to CodeQuest

1. In the **CodeQuest** project root, create a file called **`.env`**:

```env
VITE_GOOGLE_SHEET_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

2. Replace `YOUR_SCRIPT_ID` with your actual script ID from Step 3.
3. Restart the dev server (`npm run dev`) — done! 🎉

> **Note:** `.env` is already in `.gitignore`. Never commit this URL publicly.

---

## Testing

Submit the registration form on the site. Within a few seconds a new row should appear in your Google Sheet.

If no row appears:
- Double-check the URL in `.env` is correct and starts with `https://script.google.com/macros/s/`
- Make sure "Who has access" is set to **Anyone** (not "Anyone with Google account")
- Re-deploy the script after any code changes (Deploy → Manage deployments → Edit → New version → Deploy)
