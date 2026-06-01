const { getGoogleSheetsData } = require('../app/lib/googleSheets.js');
require('dotenv').config();

async function main() {
  try {
    const query = process.argv[2] || 'سليمان';
    const students = await getGoogleSheetsData();
    const matches = students.filter(s => 
      s.name.includes(query) || 
      (s.nationalId && s.nationalId.includes(query))
    );
    console.log(`Found ${matches.length} matches in Google Sheet for "${query}":`);
    console.log(JSON.stringify(matches, null, 2));
  } catch (err) {
    console.error(err);
  }
}

main();
