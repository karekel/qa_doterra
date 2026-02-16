import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { getContext } from '@/lib/rag';

export const maxDuration = 30;

export async function POST(req: Request) {
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { messages } = body;

    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return new Response('Invalid input: expected array in messages', { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content;

    // Retrieve context from knowledge base
    const contextChunks = await getContext(query);
    const contextText = contextChunks.map(c => `[Source: ${c.source}]\n${c.content}`).join('\n\n');

    let systemPrompt: string;

    if (contextChunks.length > 0) {
        systemPrompt = `あなたは「ELIGOクン」というELIGOチームのQAアシスタントです。
doTERRAのエッセンシャルオイルやサプリメントに詳しいアドバイザーです。

以下の参考情報（チームメンバーの体験談や知識ベース）をもとに回答してください。
---
${contextText}
---

【絶対に守るルール】

1. 回答は必ず200文字以内にしてください。簡潔に要点だけを伝えてください。

2. 会話の最初の回答（ユーザーからの最初の質問への返答）のみ、文頭に「ELIGOです！」と付けてください。2回目以降の回答には付けないでください。

3. 以下の書式記号は絶対に使わないでください：
   「**」「##」「###」「#」「---」「___」「\`\`\`」
   使って良い記号は「・」「①②③④⑤」「→」「、」「。」のみです。

4. 以下の人物名は絶対に回答に含めないでください：
   「千紗」「ちさ」「チサ」「ケラ」「けら」およびそれに類似する名前。
   体験談を紹介する際は「チームメンバー」「メンバーの方」など匿名で表現してください。

5. 「ナレッジベースによると」「参考情報によると」などの前置きは使わないでください。

6. 【症状への対応に関する質問の場合】
   症状に対応するオイルやサプリの使い方を簡潔に提案してください。
   関連する体験談がある場合は末尾に：
   「この症状に関連するチームメンバーの体験談がありますが、合わせてご覧になりますか？」

7. 【オイル名を含む質問の場合】
   そのオイルの使い方を簡潔に説明してください（飲める/飲めない、塗れる/要希釈など）。
   関連する体験談がある場合は末尾に：
   「このオイルに関連するチームメンバーの体験談がありますが、合わせてご覧になりますか？」

8. 【「見たい」「知りたい」「教えて」など体験談を求めるフォローアップの場合】
   体験談を匿名で具体的に紹介してください。人名は出さないこと。

9. 親しみやすく丁寧な口調で、絵文字を少し使ってください。
10. 日本語で回答してください。`;
    } else {
        systemPrompt = `あなたは「ELIGOクン」というELIGOチームのQAアシスタントです。
doTERRAのエッセンシャルオイルやサプリメントに詳しいアドバイザーです。

ユーザーの質問に直接当てはまる体験談や情報が見つかりませんでした。

【絶対に守るルール】
1. 回答は必ず200文字以内にしてください。
2. 会話の最初の回答のみ、文頭に「ELIGOです！」と付けてください。2回目以降は不要。
3. 「**」「##」「#」「---」などの書式記号は使わないでください。使って良いのは「・」「①②③」「→」のみ。
4. 「千紗」「ちさ」「ケラ」「けら」およびそれに類似する名前は絶対に出さないでください。
5. 一般的な知識で回答できる場合は回答してください。チーム固有の情報は推測で答えないでください。
6. 親しみやすく丁寧な口調で、絵文字を少し使ってください。
7. 日本語で回答してください。`;
    }

    // Convert frontend messages
    const coreMessages: any[] = messages.map((m: any) => ({
        role: m.role,
        content: m.content,
    }));

    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 5000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`Generating text with Gemini... (attempt ${attempt}/${MAX_RETRIES})`);
            const { text } = await generateText({
                model: google('gemini-2.5-flash'),
                system: systemPrompt,
                messages: coreMessages,
            });

            console.log('Generation complete:', text.substring(0, 50) + '...');

            // Post-process: remove any markdown formatting that slipped through
            let cleanText = text
                .replace(/\*\*/g, '')
                .replace(/^#{1,6}\s/gm, '')
                .replace(/^---$/gm, '')
                .replace(/^___$/gm, '')
                .replace(/```[\s\S]*?```/g, '')
                .replace(/`([^`]+)`/g, '$1');

            // Post-process: remove forbidden names
            cleanText = cleanText
                .replace(/千紗/g, 'メンバー')
                .replace(/ちさ/g, 'メンバー')
                .replace(/チサ/g, 'メンバー')
                .replace(/ケラ/g, 'メンバー')
                .replace(/けら/g, 'メンバー');

            return new Response(JSON.stringify({ role: 'assistant', content: cleanText }), {
                headers: { 'Content-Type': 'application/json' },
            });

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            const isRateLimit = errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED');

            if (isRateLimit && attempt < MAX_RETRIES) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 5s, 10s, 20s
                console.log(`Rate limited. Retrying in ${delay / 1000}s... (attempt ${attempt}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            console.error(`Gemini API Error (attempt ${attempt}):`, error);
            return new Response(JSON.stringify({ error: 'Error processing request', details: errorMsg }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }
}
