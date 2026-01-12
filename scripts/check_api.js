async function main() {
    try {
        const res = await fetch('http://localhost:3000/api/students');
        if (res.ok) {
            const data = await res.json();
            console.log('Students from API:', JSON.stringify(data, null, 2));
        } else {
            console.log('API Error:', res.status, res.statusText);
        }
    } catch (e) {
        console.log('Fetch failed:', e.message);
    }
}
main();
