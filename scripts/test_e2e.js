const fs = require('fs');
const path = require('path');

// Load env
const envContent = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8');
envContent.split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) {
        const k = line.substring(0, idx).trim();
        const v = line.substring(idx + 1).trim();
        if (k && v) process.env[k] = v;
    }
});

async function test() {
    console.log('=== Full End-to-End Test ===\n');

    // Step 1: Test API connectivity
    console.log('Step 1: Testing Gemini API key...');
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Say OK' }] }] })
    });
    if (r.status !== 200) {
        console.log('FAILED: API returned', r.status);
        process.exit(1);
    }
    console.log('✅ Gemini API key works\n');

    // Step 2: Test chat endpoint
    console.log('Step 2: Testing /api/chat endpoint with question...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
        const chatRes = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'ゆきみさんはどんな人ですか？' }]
            }),
            signal: controller.signal
        });
        clearTimeout(timeout);

        console.log('Chat API Status:', chatRes.status);

        if (chatRes.status !== 200) {
            const errText = await chatRes.text();
            console.log('FAILED:', errText);
            process.exit(1);
        }

        const data = await chatRes.json();
        console.log('✅ Chat API returned response');
        console.log('Response content:\n---');
        console.log(data.content);
        console.log('---\n');
        console.log('=== ALL TESTS PASSED ===');
    } catch (e) {
        clearTimeout(timeout);
        console.log('FAILED:', e.message);
        process.exit(1);
    }
}

test();
