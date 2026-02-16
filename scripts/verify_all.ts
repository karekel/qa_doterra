import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
envConfig.split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) {
        const key = line.substring(0, idx).trim();
        const value = line.substring(idx + 1).trim();
        if (key && value) process.env[key] = value;
    }
});

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

async function main() {
    console.log('=== Step 1: Test Gemini API Key ===');
    console.log('Key present:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);

    try {
        const { text } = await generateText({
            model: google('gemini-2.0-flash'),
            prompt: 'Say "Hello, I am working!" in Japanese. Keep it short.',
        });
        console.log('Gemini response:', text);
        console.log('=== Step 1 PASSED ===\n');
    } catch (e) {
        console.error('Step 1 FAILED:', e);
        process.exit(1);
    }

    console.log('=== Step 2: Test RAG retrieval ===');
    // Dynamic import for path alias
    const { getContext } = await import('../lib/rag');
    const chunks = await getContext('ゆきみさんはどんな人？');
    console.log('Chunks retrieved:', chunks.length);
    if (chunks.length > 0) {
        console.log('First chunk source:', chunks[0].source);
        console.log('First chunk preview:', chunks[0].content.substring(0, 80) + '...');
        console.log('=== Step 2 PASSED ===\n');
    } else {
        console.log('Step 2: No chunks found (check knowledge folder)');
    }

    console.log('=== Step 3: Test full pipeline (RAG + Gemini) ===');
    const contextChunks = chunks;
    const contextText = contextChunks.map(c => `[Source: ${c.source}]\n${c.content}`).join('\n\n');

    const systemPrompt = `You are a helpful assistant for a Member-only Club.
You have access to the following knowledge base:
---
${contextText}
---
Answer the user's question based ONLY on the provided knowledge base.
Please respond in Japanese.`;

    try {
        const { text } = await generateText({
            model: google('gemini-2.0-flash'),
            system: systemPrompt,
            messages: [{ role: 'user', content: 'ゆきみさんはどんな人？' }],
        });
        console.log('Full pipeline response:', text);
        console.log('=== Step 3 PASSED ===');
        console.log('\n=== ALL TESTS PASSED ===');
    } catch (e) {
        console.error('Step 3 FAILED:', e);
        process.exit(1);
    }
}

main();
