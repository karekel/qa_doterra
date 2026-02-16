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
    // List models
    console.log('Listing available models...');
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listBody = await listRes.json();

    if (listBody.models) {
        const generateModels = listBody.models
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name);
        console.log('Models supporting generateContent:');
        generateModels.forEach(m => console.log(' ', m));
    } else {
        console.log('List response:', JSON.stringify(listBody, null, 2));
    }
}
test();
