const fs = require('fs');
const https = require('https');

const url = 'https://api.alquran.cloud/v1/quran/quran-simple-min';

console.log('Fetching Quran data...');

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const surahs = json.data.surahs;

            const pageMap = {}; // pageNum -> { surah, ayah } (Last ayah of the page)

            // Initialize coverage check
            for (let i = 1; i <= 604; i++) {
                pageMap[i] = null;
            }

            surahs.forEach(surah => {
                surah.ayahs.forEach(ayah => {
                    const p = ayah.page;
                    // We want the LAST ayah of the page.
                    // Since we iterate in order, we can just overwrite.
                    // But wait, a page might have multiple surahs.
                    // If a page has Surah X Ayah Y, and then Surah X+1 Ayah 1.
                    // The "End" of the page is Surah X+1 Ayah 1 (or whatever is last).
                    // The user's input asks for "To Ayah" of the *Selected Surah*?
                    // No. The inputs are: "From Page", "To Page" (Select).
                    // And "From Ayah", "To Ayah" (Input).
                    // But wait, the Hifz section has inputs: "From Page" (Select), "From Ayah" (Input).
                    // "To Page" (Select), "To Ayah" (Input).
                    // And the context is "Hifz New".
                    // Usually "Hifz New" is within boundaries of pages.
                    // If I select "To Page: 502", I want "To Ayah: 35".
                    // Page 502 contains Surah 46 (Al-Ahqaf) only.
                    // If I select "Page 1", it has Surah 1 (1-7).
                    // If I select "Page 2", it starts Surah 2 (1-5).

                    // We need to know: For a given Page, what is the LAST Ayah number ON THAT PAGE?
                    // And which Surah does that last Ayah belong to?
                    // The UI: `hifzToAyah` is strictly an Ayah Number (1...N).
                    // But which Surah? The user selects `hifzToPage`.
                    // Does the user select Surah?
                    // Let's check the UI again.
                    // Data structure: `currentSurah`.
                    // The Hifz section is for `currentSurah`.
                    // So if `currentSurah` is Al-Baqarah (2).
                    // User selects Page 3.
                    // Page 3 contains Al-Baqarah 6-16.
                    // So "To Ayah" should default to 16.

                    // So I need a map: `Page -> { [surahId]: lastAyahNum }`.
                    // Because a page can have multiple surahs.
                    // But usually for Hifz recording, it's one surah focus.
                    // If the page contains multiple surahs, and the user is on Surah X.
                    // We need the last ayah of Surah X *on that page*.

                    // Map structure:
                    // {
                    //   "502": { "46": 35 },
                    //   "3": { "2": 16 },
                    //   "1": { "1": 7 }
                    // }

                    if (!pageMap[p]) pageMap[p] = {};

                    if (!pageMap[p][surah.number]) {
                        // First time seeing this surah on this page -> It's the start
                        pageMap[p][surah.number] = { start: ayah.numberInSurah, end: ayah.numberInSurah };
                    } else {
                        // Already saw this surah on this page -> Update end
                        pageMap[p][surah.number].end = ayah.numberInSurah;
                    }
                });
            });

            // Write to file
            const output = `export const pageAyahMap = ${JSON.stringify(pageMap, null, 4)};`;
            fs.writeFileSync('app/data/pageAyahMap.js', output);
            console.log('Successfully generated app/data/pageAyahMap.js');

        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    });

}).on('error', (err) => {
    console.error('Error fetching data:', err);
});
