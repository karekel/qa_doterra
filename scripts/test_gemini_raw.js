const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8');
let apiKey = '';
envContent.split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) {
        const k = line.substring(0, idx).trim();
        const v = line.substring(idx + 1).trim();
        if (k === 'GOOGLE_GENERATIVE_AI_API_KEY') apiKey = v;
    }
});

async function test() {
    console.log('Key from file:', apiKey);
    console.log('Key length:', apiKey.length);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hello in Japanese' }] }] })
    });

    console.log('Status:', r.status);
    const body = await r.text();
    console.log('Response:', body.substring(0, 500));
}
test();
