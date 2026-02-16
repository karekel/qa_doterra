import fs from 'fs';
import path from 'path';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');

export interface KnowledgeChunk {
    source: string;
    content: string;
}

interface CachedChunk {
    source: string;
    content: string;
    contentLower: string; // Pre-computed for search
}

// ===== In-Memory Cache =====
let cachedChunks: CachedChunk[] = [];
let cacheLoadedAt = 0;

function loadChunks(): CachedChunk[] {
    if (!fs.existsSync(KNOWLEDGE_DIR)) {
        console.warn('Knowledge directory not found.');
        return [];
    }

    const files = fs.readdirSync(KNOWLEDGE_DIR).filter(file =>
        file.endsWith('.txt') || file.endsWith('.md')
    );

    // Check if any file was modified after last cache load
    const latestMtime = files.reduce((max, file) => {
        const filePath = path.join(KNOWLEDGE_DIR, file);
        try {
            const stat = fs.statSync(filePath);
            return Math.max(max, stat.mtimeMs);
        } catch { return max; }
    }, 0);

    // Return cached if no changes since last load
    if (cachedChunks.length > 0 && latestMtime <= cacheLoadedAt) {
        return cachedChunks;
    }

    console.log(`[RAG] Loading ${files.length} knowledge files...`);
    const startTime = Date.now();

    const chunks: CachedChunk[] = [];

    for (const file of files) {
        const filePath = path.join(KNOWLEDGE_DIR, file);
        if (fs.statSync(filePath).isDirectory()) continue;

        const content = fs.readFileSync(filePath, 'utf-8');
        const fileChunks = content.split(/\n\s*\n/).filter(c => c.trim().length > 0);

        fileChunks.forEach(chunk => {
            const trimmed = chunk.trim();
            chunks.push({
                source: file,
                content: trimmed,
                contentLower: trimmed.toLowerCase(),
            });
        });
    }

    cachedChunks = chunks;
    cacheLoadedAt = Date.now();
    console.log(`[RAG] Loaded ${chunks.length} chunks from ${files.length} files in ${Date.now() - startTime}ms`);
    return cachedChunks;
}

// ===== Bi-gram helper =====
function getBiGrams(text: string): string[] {
    const biGrams: string[] = [];
    for (let i = 0; i < text.length - 1; i++) {
        const bigram = text.substring(i, i + 2);
        if (!/^\s+$/.test(bigram)) {
            biGrams.push(bigram);
        }
    }
    return biGrams;
}

// ===== Search =====
export async function getContext(query: string): Promise<KnowledgeChunk[]> {
    try {
        const allChunks = loadChunks();
        if (allChunks.length === 0) return [];

        const queryLower = query.toLowerCase();
        const spaceTerms = queryLower.split(/\s+/).filter(w => w.length > 2);
        const isJapanese = !!queryLower.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/);
        const biGrams = (spaceTerms.length === 0 || isJapanese) ? getBiGrams(queryLower) : [];

        const scored: { source: string; content: string; score: number }[] = [];

        for (const chunk of allChunks) {
            let score = 0;

            // 1. Direct phrase match
            if (chunk.contentLower.includes(queryLower)) score += 10;

            // 2. Space-separated keywords
            for (const term of spaceTerms) {
                if (chunk.contentLower.includes(term)) score += 2;
            }

            // 3. Bi-gram match (Japanese)
            for (const bg of biGrams) {
                if (chunk.contentLower.includes(bg)) score += 1;
            }

            if (score > 0) {
                scored.push({ source: chunk.source, content: chunk.content, score });
            }
        }

        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, 15)
            .map(c => ({ source: c.source, content: c.content }));

    } catch (error) {
        console.error("Error reading knowledge base:", error);
        return [];
    }
}
