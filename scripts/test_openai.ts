import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import fs from 'fs';
import path from 'path';

// Load env validation
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

async function main() {
    console.log('API Key present:', !!process.env.OPENAI_API_KEY);
    // Mask key for safety log
    console.log('API Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 15) + '...');

    try {
        console.log('Generating text...');
        // Set timeout for generation
        const result = await Promise.race([
            generateText({
                model: openai('gpt-4o'),
                prompt: 'Hello, are you working?',
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]) as any;

        console.log('Result:', result.text);
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
