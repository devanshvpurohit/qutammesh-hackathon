/**
 * Google Sheets Integration
 * ─────────────────────────
 * This uses a Google Apps Script Web App as a free serverless endpoint.
 * See GOOGLE_SHEETS_SETUP.md at the project root for step-by-step setup instructions.
 *
 * After you deploy a Google Apps Script Web App, paste its URL into:
 *   VITE_GOOGLE_SHEET_URL inside a `.env` file at the project root.
 *
 * Example .env:
 *   VITE_GOOGLE_SHEET_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
 */

export interface RegistrationData {
  teamName: string;
  teamLead: string;
  college: string;
  contact: string;
  members: string;
  emails: string;
  track: string;
  submittedAt?: string;
}

export type SubmissionStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Submits registration data to a Google Apps Script Web App,
 * which appends a row to the connected Google Sheet.
 */
export async function submitToGoogleSheets(
  data: RegistrationData
): Promise<{ ok: boolean; message: string }> {
  const scriptUrl = import.meta.env.VITE_GOOGLE_SHEET_URL as string | undefined;

  if (!scriptUrl) {
    console.warn(
      '[CodeQuest] VITE_GOOGLE_SHEET_URL is not set. ' +
        'Registration data was NOT saved to Google Sheets. ' +
        'See GOOGLE_SHEETS_SETUP.md for instructions.'
    );
    // In development without a URL configured, we resolve successfully so
    // developers can still see the success state.
    return { ok: true, message: 'DEV_MODE: No sheet URL configured.' };
  }

  const payload: RegistrationData = {
    ...data,
    submittedAt: new Date().toISOString(),
  };

  // Google Apps Script requires a URL-encoded form POST for no-CORS submissions.
  const formData = new URLSearchParams(payload as unknown as Record<string, string>);

  const response = await fetch(scriptUrl, {
    method: 'POST',
    mode: 'no-cors', // Apps Script doesn't set CORS headers on POST
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  // `no-cors` responses are opaque — we can't read status, so we assume success
  // if fetch didn't throw. The Apps Script side validates and writes the row.
  void response;
  return { ok: true, message: 'Submitted successfully.' };
}
