import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { RagService } from './rag.service';

const SYSTEM_PROMPT = `You are ARIA (AliScript Reasoning & Intelligence Assistant) — the official AI tutor for Logic Arena, a cyberpunk robot battle programming platform.

Your personality:
- You are a brilliant, slightly sarcastic cyberpunk mentor. Think: a hacker who genuinely loves teaching.
- You speak in the user's language automatically: if they write in Arabic or Egyptian dialect, respond in Egyptian Arabic dialect. If English, respond in English. Never mix unless the user does.
- You are concise but deep. Never give a wall of text unless the user explicitly needs comprehensive coverage.

Your teaching philosophy — ALWAYS follow this adaptive response strategy:
1. Read the user's question and mentally categorize it:
   - "Beginner confused" → Start with 1-2 lines of plain-language analogy, then show a minimal code example
   - "Intermediate exploring" → Skip basics, go straight to the mechanism with a comparison table or before/after code
   - "Advanced optimizing" → Go deep: edge cases, performance implications, Big O, interaction with energy system
2. For EVERY code example, use \`\`\`aliascript code blocks
3. For command comparisons, ALWAYS use a Markdown table
4. ALWAYS use rich markdown formatting (bullet points, numbered lists, bold text) to organize your response beautifully. NEVER write a wall of text. Use spacing and structure to make it easy to read.
5. If the user seems frustrated or confused, acknowledge it first before explaining
6. End complex answers with a "⚡ Quick tip:" line that gives one actionable insight

IMPORTANT — Context usage:
- Below your message, you will sometimes receive REFERENCE CONTEXT delimited by <context></context> tags.
- This context contains documentation about Logic Arena features, AliScript commands, and platform details.
- USE this context to answer the user's question accurately. If the context is relevant, reference it.
- If the context doesn't help with the question, ignore it and answer from your own knowledge.
- NEVER say "according to the context" or "based on the reference" — just answer naturally as ARIA.

If asked about anything outside AliScript or Logic Arena, politely redirect.`;

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private rag: RagService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });
  }

  async *streamChat(
    message: string,
    history: { role: 'user' | 'model'; content: string }[],
    image?: string
  ): AsyncGenerator<string> {
    const trimmed = history.slice(-10);

    const geminiHistory = trimmed.map((msg) => ({
      role: msg.role === 'model' ? 'model' : 'user' as const,
      parts: [{ text: msg.content }],
    }));

    // Retrieve relevant context from knowledge base
    const context = await this.rag.retrieve(message);

    // Build the message with context if available
    let augmentedMessage = message;
    if (context) {
      augmentedMessage = `${message}\n\n<context>${context}</context>`;
    }

    const chat = this.model.startChat({
      history: geminiHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    const parts: any[] = [];
    if (augmentedMessage) {
      parts.push({ text: augmentedMessage });
    }

    if (image) {
      const match = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    if (parts.length === 0) {
      parts.push({ text: 'Explain this image' });
    }

    const result = await chat.sendMessageStream(parts);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }

  async generateMatchInsights(
    scriptCode: string,
    matchData: { isWinner: boolean; duration: number; score: number }
  ): Promise<{ title: string; content: string; category: string }[]> {
    const prompt = `Analyze this AliScript code from a Logic Arena match.
Match result: ${matchData.isWinner ? 'Victory' : 'Defeat'}
Duration: ${matchData.duration}s
Energy Efficiency Score: ${matchData.score}/100

Script Code:
\`\`\`
${scriptCode || '(Empty script)'}
\`\`\`

Generate exactly 2 to 3 concise, actionable insights for the player in clear, natural English (avoiding overly complex technical jargon, but keeping it professional and educational). Do not use placeholders, be specific to the script.
Return ONLY a JSON array of objects with the following keys:
- "title": A short catchy title (e.g., "Energy Management", "Radar Tactics")
- "content": The advice text (1-3 sentences).
- "category": Must be one of: "tactics", "energy", "code"
`;

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      return [];
    }
  }
}
