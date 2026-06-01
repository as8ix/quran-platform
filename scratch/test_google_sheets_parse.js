require('dotenv').config();
const { getGoogleSheetsData } = require('../app/lib/googleSheets.js');

async function main() {
  try {
    const students = await getGoogleSheetsData();
    console.log("Parsed students count:", students.length);
    console.log("First 3 parsed students:");
    console.log(JSON.stringify(students.slice(0, 3), null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
