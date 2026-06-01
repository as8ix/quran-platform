const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function main() {
  const credentialsFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || 'mueen-497103-b1cc5f33622f.json';
  const spreadsheetId = process.env.GOOGLE_SHEET_ID || '1wXJf41On91BO4yRXgnkG6KRIKBcdtRkzQz7HTJ-stHA';
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'لوحة التحكم';

  const credentialsPath = path.join(process.cwd(), credentialsFile);

  if (!fs.existsSync(credentialsPath)) {
    console.error(`Google credentials file not found at: ${credentialsPath}`);
    return;
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z10`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("No data found.");
      return;
    }

    console.log("First 10 rows from the sheet:");
    rows.forEach((row, index) => {
      console.log(`Row ${index + 1}:`, row);
    });

  } catch (error) {
    console.error('Error fetching sheet:', error);
  }
}

main();
