import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

export async function getGoogleSheetsData() {
  const credentialsFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'لوحة التحكم';

  if (!credentialsFile || !spreadsheetId) {
    throw new Error("Missing Google Sheets environment variables (GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SHEET_ID)");
  }

  // Resolve absolute path to the credentials JSON file at the root of the project
  const credentialsPath = path.join(process.cwd(), credentialsFile);

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Google credentials file not found at: ${credentialsPath}`);
  }

  // Authorize with Google Sheets API (readonly scope is enough)
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Fetch all rows from the specified sheet
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    throw new Error("No data found in the spreadsheet or sheet is empty.");
  }

  // Parse headers dynamically by scanning the top rows of the spreadsheet
  let headerRowIndex = -1;
  let nameIndex = -1;
  let nationalIdIndex = -1;
  let phoneIndex = -1;
  let parentPhoneIndex = -1;
  let halaqaIndex = -1;
  let stageIndex = -1;
  let progressIndex = -1;
  let nationalityIndex = -1;
  let joinDateIndex = -1;
  let notesIndex = -1;

  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Convert cell values to lowercase trimmed strings
    const rowCells = row.map(cell => (cell ? cell.toString().trim().toLowerCase() : ''));

    // Check if this row looks like the header row
    const currentNameIndex = rowCells.findIndex(h => h.includes('الاسم') || h.includes('الرباعي'));
    const currentNationalIdIndex = rowCells.findIndex(h => h.includes('الهوية') || h.includes('الهويه'));

    if (currentNameIndex !== -1 && currentNationalIdIndex !== -1) {
      headerRowIndex = i;
      nameIndex = currentNameIndex;
      nationalIdIndex = currentNationalIdIndex;

      // Find indices for optional columns in this row
      phoneIndex = rowCells.findIndex(h => (h.includes('الجوال') || h.includes('رقم الجوال')) && !h.includes('ولي'));
      parentPhoneIndex = rowCells.findIndex(h => h.includes('ولي الامر') || h.includes('ولي الأمر'));
      halaqaIndex = rowCells.findIndex(h => h.includes('الحلقة') || h.includes('حلقة'));
      stageIndex = rowCells.findIndex(h => h.includes('مرحلة'));
      progressIndex = rowCells.findIndex(h => h.includes('الحفظ') || h.includes('وصلت'));
      nationalityIndex = rowCells.findIndex(h => h.includes('نوع الهوية') || h.includes('الجنسية') || h.includes('نوع الهويه'));
      joinDateIndex = rowCells.findIndex(h => h.includes('تاريخ التسجيل') || h.includes('تاريخ الانضمام'));
      notesIndex = rowCells.findIndex(h => h.includes('ملاحظات') || h.includes('ملاحظه'));
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error("Could not find the required headers ('الاسم الرباعي' and 'رقم الهوية') in the spreadsheet rows.");
  }

  // Process data rows starting from the row after the headers
  const students = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Skip empty rows or rows where the name is completely empty
    if (!row || !row[nameIndex] || row[nameIndex].trim() === '') {
      continue;
    }

    // Safely extract values using matched indices
    const name = row[nameIndex]?.trim();
    const nationalId = row[nationalIdIndex]?.trim();
    const phone = phoneIndex !== -1 ? row[phoneIndex]?.trim() : '';
    const parentPhone = parentPhoneIndex !== -1 ? row[parentPhoneIndex]?.trim() : '';
    const halaqaName = halaqaIndex !== -1 ? row[halaqaIndex]?.trim() : '';
    const stage = stageIndex !== -1 ? row[stageIndex]?.trim() : '';
    const hifzProgress = progressIndex !== -1 ? row[progressIndex]?.trim() : '';
    const nationality = nationalityIndex !== -1 ? row[nationalityIndex]?.trim() : '';
    const joinDateRaw = joinDateIndex !== -1 ? row[joinDateIndex]?.trim() : '';
    const studentNotes = notesIndex !== -1 ? row[notesIndex]?.trim() : '';

    // Convert join date safely to Date object or ISO string if valid
    let joinDate = null;
    if (joinDateRaw) {
      // Expecting DD/MM/YYYY or similar
      const parts = joinDateRaw.split(/[\/\-]/);
      if (parts.length === 3) {
        let day, month, year;
        if (parts[2].length === 4) { // DD/MM/YYYY
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1;
          year = parseInt(parts[2], 10);
        } else if (parts[0].length === 4) { // YYYY/MM/DD
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1;
          day = parseInt(parts[2], 10);
        }
        if (day && month !== undefined && year) {
          const d = new Date(year, month, day);
          if (!isNaN(d.getTime())) {
            joinDate = d;
          }
        }
      }
      if (!joinDate) {
        const d = new Date(joinDateRaw);
        if (!isNaN(d.getTime())) {
          joinDate = d;
        }
      }
    }

    students.push({
      name,
      nationalId,
      phone: phone || null,
      parentPhone: parentPhone || null,
      halaqaName: halaqaName || null,
      stage: stage || null,
      hifzProgress: hifzProgress || null,
      nationality: nationality || null,
      joinDate: joinDate || null,
      studentNotes: studentNotes || null,
    });
  }

  return students;
}
