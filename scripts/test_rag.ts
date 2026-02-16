import { getContext } from '../lib/rag';

async function main() {
    const query = "ゆきみさんはどんな人？";
    console.log(`Query: ${query}`);
    const contexts = await getContext(query);

    console.log(`Found ${contexts.length} chunks.`);
    contexts.forEach((c, i) => {
        console.log(`\n--- Chunk ${i + 1} (Source: ${c.source}) ---`);
        console.log(c.content.substring(0, 200) + "...");
    });
}

main().catch(console.error);
