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

const modelsToTry = [
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash',
    'gemma-3-4b-it',
];

async function testModel(modelName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    try {
        const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hello in Japanese, one line only' }] }] })
        });
        const body = await r.json();
        if (r.status === 200) {
            const text = body.candidates?.[0]?.content?.parts?.[0]?.text || 'no text';
            console.log(`✅ ${modelName}: ${text.trim()}`);
            return true;
        } else {
            console.log(`❌ ${modelName}: ${r.status} - ${body.error?.message?.substring(0, 80)}`);
            return false;
        }
    } catch (e) {
        console.log(`❌ ${modelName}: ${e.message}`);
        return false;
    }
}

async function main() {
    console.log('Testing models for free tier access...\n');
    for (const model of modelsToTry) {
        const ok = await testModel(model);
        if (ok) {
            console.log(`\n🎉 Working model found: ${model}`);
            break;
        }
    }
}
main();
