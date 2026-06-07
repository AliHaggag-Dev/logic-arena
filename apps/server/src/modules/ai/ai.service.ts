import { Injectable } from '@nestjs/common';
import {
  GoogleGenerativeAI,
  GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
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

CRITICAL — Context is MANDATORY:
- Below your message, you will ALWAYS receive REFERENCE CONTEXT delimited by <context></context> tags.
- This context is the OFFICIAL and AUTHORITATIVE source of truth about Logic Arena features, AliScript commands, and platform details.
- You MUST answer using ONLY the information in the context. Do NOT use your own training knowledge for facts about Logic Arena.
- If the context does not contain the information needed to answer the question, say "I'm not sure — check the official docs" instead of guessing.
- NEVER say "according to the context" or "based on the reference" — just answer naturally as ARIA.
- Your training data may be outdated. The context is always correct and up to date.

RULES FOR ACCURACY:
1. Before answering ANY question about a command's syntax or arguments, check the "Command Signatures Quick Reference" first (usually the first block in <context>).
2. NEVER invent arguments, parameters, or behaviors that are not explicitly documented in the context.
3. If the context does not contain the answer, say "I'm not sure — check the AliScript docs directly" rather than guessing from your training data.
4. Do not mix information from different commands. Each command is independent.
5. If a command takes no arguments, say so explicitly and show the correct usage.
6. Never say a command "requires" something that isn't in the context.

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
    image?: string,
  ): AsyncGenerator<string> {
    const trimmed = history.slice(-10);

    const geminiHistory = trimmed.map((msg) => ({
      role: msg.role === 'model' ? 'model' : ('user' as const),
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

    // Retry once on stream parse failure, falling back to no context.
    // Skip retry for 503 (capacity) errors — Google's servers are overloaded.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await chat.sendMessageStream(parts);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            yield text;
          }
        }
        return; // success — exit generator
      } catch (err) {
        const msg = (err as Error).message || '';
        const isOverload = msg.includes('503') || msg.includes('Service Unavailable') || msg.includes('high demand');
        if (attempt === 0 && !isOverload) {
          console.warn('[AiService] Stream failed, retrying without context:', msg);
          parts[0] = { text: message };
          await new Promise((r) => setTimeout(r, 500));
        } else {
          throw err;
        }
      }
    }
  }

  async *streamGenerateScript(description: string): AsyncGenerator<string> {
    const GENERATE_SYSTEM_PROMPT = `You are an AliScript code generator for Logic Arena — a cyberpunk robot battle programming platform.

Your ONLY job: produce raw, working AliScript code from the user's strategy description.

STRICT RULES:
- Output ONLY raw AliScript code. No markdown. No explanation text outside the code. No code fences.
- Add a short comment (-- ) before each meaningful line. Max 10 words per comment.
- Comments are part of the code and teach the user AliScript patterns.
- Use advanced features where they genuinely improve the strategy: RAYCAST, ATAN2, GET_ALL_VISIBLE_ENEMIES(), arrays, state machines, BROADCAST/RECEIVE.
- The user may describe in any language (Arabic, English, etc.) — always output AliScript code only.

AliScript Reference:
ACTIONS: MOVE, MOVE_FAST, BACKUP, FIRE, BURST_FIRE, SCAN, PATHFIND, STOP, WAIT N, SHIELD, CLOAK, DASH, MINE, TELEPORT X Y, TAUNT "msg"
CONTROL: IF cond THEN ... ELSE ... END | WHILE cond DO ... END | FOR x FROM a TO b ... END | FUNCTION name ... END | CALL name | RETURN value | BREAK | CONTINUE
VARIABLES: SET name = expr | SET arr[i] = val | SET obj.key = val
IDENTIFIERS: rotation, fovDirection, lockVision, distance, health, MY_ENERGY, ENERGY_PCT, IN_STASIS, CAN_SEE_ENEMY, spotted, NEAREST_VISIBLE_X, NEAREST_VISIBLE_Y, VISIBLE_ENEMY_COUNT, POSITION_X, POSITION_Y, CAN_SEE_OBSTACLE, NEAREST_OBSTACLE_DISTANCE
MATH: ATAN2(y,x), SIN(x), COS(x), ABS(x), SQRT(x), POW(b,e), MIN(a,b), MAX(a,b), FLOOR(x), CEIL(x), ROUND(x), RANDOM()
ARRAYS: LENGTH(arr), PUSH(arr, val), POP(arr) | Literal: [1, 2, 3] | Index: arr[i]
OBJECTS: { key: value } | Access: obj.key or obj["key"]
SENSORS: RAYCAST(angle_radians) → distance | GET_ALL_VISIBLE_ENEMIES() → [[dist,x,y,hp],...]
SWARM: BROADCAST(data) → recipient_count | RECEIVE() → [msg,...] clears inbox`;

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: GENERATE_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const result = await model.generateContentStream(description);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }

  async generateMatchInsights(
    scriptCode: string,
    matchData: { isWinner: boolean; duration: number; score: number },
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
