import fs from 'fs';
import path from 'path';

// Load env validation
const envPath = path.resolve(process.cwd(), '.env.local');
let apiKey = '';
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key.trim() === 'OPENAI_API_KEY') {
            apiKey = value.trim();
        }
    });
}

// Need to use dynamic import for node-fetch if in CJS, or just use global fetch if Node 18+
// Start test
async function test() {
    console.log('Testing Raw OpenAI API...');
    console.log('Key length:', apiKey.length);

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: 'Say hello' }]
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text.substring(0, 200));

    } catch (e) {
        console.error('Error:', e);
    }
}

test();
