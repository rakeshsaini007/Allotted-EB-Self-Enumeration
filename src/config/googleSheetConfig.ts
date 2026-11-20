/**
 * GOOGLE APPS SCRIPT CONFIGURATION
 * --------------------------------
 * Paste your deployed Google Apps Script Web App URL below.
 *
 * Steps to get this URL:
 * 1. Open your Google Sheet containing "Master" and "Data" tabs.
 * 2. Go to Extensions -> Apps Script.
 * 3. Paste the code from `google-apps-script/Code.gs`.
 * 4. Click Deploy -> New deployment -> Web app.
 * 5. Set "Execute as" to "Me" and "Who has access" to "Anyone".
 * 6. Copy the Web App URL (ends with /exec) and paste it below.
 */
export const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzJoi0vbhfYjWkiMDVqyYoOEja0jaIbVDNv45pTVYCL_RTccTZIvQdczvJSw2D5GHjGaQ/exec';

export function isGoogleScriptConfigured(): boolean {
  const url = GOOGLE_SCRIPT_URL.trim();
  return (
    url.length > 0 &&
    url !== 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE' &&
    url.startsWith('https://script.google.com/')
  );
}
