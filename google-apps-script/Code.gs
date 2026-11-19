/**
 * Aurora's invitation - RSVP -> Google Sheet + email.
 *
 * SETUP (about 5 minutes):
 *  1. Create a new Google Sheet (any name, e.g. "Aurora RSVPs").
 *  2. In the sheet: Extensions > Apps Script. Delete the sample code and paste ALL of this file.
 *  3. Change SECRET below to a long random string (keep it private) - you will paste the same value on the website host.
 *  4. Click Deploy > New deployment > type "Web app".
 *       Execute as: Me        Who has access: Anyone
 *     Click Deploy, approve the permissions (Sheets + sending email), copy the "Web app URL".
 *  5. On the website host (e.g. Vercel) set two environment variables and redeploy:
 *       GOOGLE_SCRIPT_URL    = the Web app URL
 *       GOOGLE_SCRIPT_SECRET = the same SECRET string
 *
 * If you edit this script later: Deploy > Manage deployments > edit > New version > Deploy.
 */
const SECRET = 'CHANGE-ME-to-a-long-random-string';
const NOTIFY_EMAIL = 'dianasharon89@gmail.com';
const SHEET_NAME = 'RSVPs';
const HEADERS = ['Received', 'Name', 'Attending', 'Guests', 'Guest names', 'Phone', 'Message'];

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.secret !== SECRET) return out({ ok: false, error: 'unauthorized' });

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sh = ss.getSheetByName(SHEET_NAME);
      if (!sh) {
        sh = ss.insertSheet(SHEET_NAME);
        sh.appendRow(HEADERS);
        sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#e9ddf7');
        sh.setFrozenRows(1);
      }
      const names = (d.guestNames || []).join(', ');
      sh.appendRow([new Date(), safe(d.name), d.attending ? 'Yes' : 'No', d.attending ? d.guests : 0, safe(names), safe(d.phone), safe(d.message)]);
    } finally {
      lock.releaseLock();
    }

    const status = d.attending ? 'Attending (' + d.guests + (d.guests === 1 ? ' guest)' : ' guests)') : 'Not attending';
    const lines = [
      'Name: ' + d.name,
      'Reply: ' + status,
      d.guestNames && d.guestNames.length ? 'Guests: ' + d.name + ', ' + d.guestNames.join(', ') : '',
      d.phone ? 'Phone: ' + d.phone : '',
      d.message ? '\n' + (d.attending ? 'Message' : 'Wish for Aurora') + ':\n' + d.message : '',
    ].filter(String);
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: (d.attending ? 'RSVP: Yes - ' : 'RSVP: No - ') + d.name + (d.attending ? ' (' + d.guests + ')' : ''),
      body: lines.join('\n') + '\n\n- Aurora\'s invitation',
      name: "Aurora's Invitation",
    });
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

/** Text that starts with = + - @ (e.g. a phone number like +91 98...) would be read by Sheets as a formula (#ERROR!). A leading apostrophe stores it as plain text. */
function safe(v) { v = (v == null) ? '' : String(v); return /^[=+\-@]/.test(v) ? "'" + v : v; }

function doGet() { return out({ ok: true, hello: 'Aurora RSVP endpoint is live' }); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
