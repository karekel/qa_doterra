import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
let apiKey = '';
envConfig.split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) {
        const key = line.substring(0, idx).trim();
        const value = line.substring(idx + 1).trim();
        if (key === 'OPENAI_API_KEY') apiKey = value;
    }
});

async function test() {
    console.log('Key starts with:', apiKey.substring(0, 20) + '...');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: 'Say hello' }],
            max_tokens: 10
        })
    });

    console.log('Status:', res.status);
    const body = await res.text();
    console.log('Full response:', body);
}

test();
