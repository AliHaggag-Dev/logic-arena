import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { buildKnowledgeBase, KnowledgeChunk } from './knowledge-base';

const EMBEDDING_MODEL = 'text-embedding-004';

const FILE_SOURCES = [
  { path: 'docs/game-rules.md', title: 'Game Rules' },
  { path: 'docs/erd-diagram.md', title: 'ERD Diagram' },
  { path: 'docs/folder-structure.md', title: 'Folder Structure' },
  { path: 'docs/script-sandboxing.md', title: 'Script Sandboxing' },
  { path: 'docs/system-architecture.md', title: 'System Architecture' },
  { path: 'docs/aliscript-language.md', title: 'AliScript Language Reference' },
  { path: 'docs/rotation-system-guide.md', title: 'Rotation System Guide' },
  { path: 'docs/website-guide.md', title: 'Website Guide — All Pages & Features' },
  { path: 'README.md', title: 'Project README' },
  { path: 'CHANGELOG.md', title: 'Changelog' },
  { path: 'project-map.md', title: 'Project Map' },
];

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Split markdown content into chunks by ## or ### headers,
 * ensuring code blocks and command table rows stay intact.
 */
function chunkMarkdown(
  content: string,
  sourceLabel: string,
): { title: string; content: string }[] {
  const lines = content.split('\n');
  const chunks: { title: string; content: string }[] = [];
  let currentTitle = sourceLabel;
  let currentLines: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    // Track code block boundaries to avoid splitting inside them
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      currentLines.push(line);
      continue;
    }

    // Only split on headers when NOT inside a code block
    if (!inCodeBlock) {
      const headerMatch = line.match(/^#{2,3}\s+(.+)/);
      if (headerMatch) {
        if (currentLines.length > 0) {
          chunks.push({
            title: currentTitle,
            content: currentLines.join('\n').trim(),
          });
        }
        currentTitle = `${sourceLabel} > ${headerMatch[1].trim()}`;
        currentLines = [];
        continue;
      }
    }

    currentLines.push(line);
  }

  if (currentLines.length > 0) {
    chunks.push({
      title: currentTitle,
      content: currentLines.join('\n').trim(),
    });
  }

  return chunks.filter((c) => c.content.length > 20); // skip tiny fragments
}

/**
 * Split a long chunk into smaller pieces if it exceeds target word count.
 * Uses 20-word overlap to avoid losing context at boundaries.
 */
function splitChunk(
  title: string,
  content: string,
  targetWords = 200,
): { title: string; content: string }[] {
  const words = content.split(/\s+/);
  if (words.length <= targetWords) return [{ title, content }];

  // Find code block fence positions (word indices of ``` lines)
  const codeBlockMarkers: number[] = [];
  const lines = content.split('\n');
  let wordOffset = 0;
  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      codeBlockMarkers.push(wordOffset);
    }
    wordOffset += line.split(/\s+/).filter(Boolean).length || 1;
  }

  const overlap = 20;
  const result: { title: string; content: string }[] = [];

  for (let i = 0; i < words.length; i += targetWords - overlap) {
    if (i > 0 && i + overlap > words.length) break; // skip tiny tail
    result.push({
      title: `${title} (part ${Math.floor(i / (targetWords - overlap)) + 1})`,
      content: words.slice(i, i + targetWords).join(' '),
    });
  }

  return result;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private chunks: KnowledgeChunk[] = [];
  private ready = false;
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.loadKnowledgeBase();
  }

  private loadKnowledgeBase(): void {
    // 1. Static sections
    this.chunks = buildKnowledgeBase();
    this.logger.log(`Static chunks: ${this.chunks.length}`);

    // 2. File-based sections
    const projectRoot = resolve(process.cwd());
    const rootLabel = projectRoot.split(/[\\/]/).pop() || 'project';

    this.logger.log('Scanning knowledge source files...');
    let foundCount = 0;
    let missingCount = 0;
    const missingFiles: string[] = [];

    for (const source of FILE_SOURCES) {
      const fullPath = join(projectRoot, source.path);
      if (!existsSync(fullPath)) {
        // Try one level up from server directory
        const altPath = join(projectRoot, '..', source.path);
        if (!existsSync(altPath)) {
          this.logger.warn(`  [MISSING] ${source.path}`);
          missingCount++;
          missingFiles.push(source.path);
          continue;
        }
        this.logger.log(`  [FOUND] ${source.path} (from parent dir)`);
        foundCount++;
        this.readFileIntoChunks(altPath, source.title, rootLabel);
        continue;
      }
      this.logger.log(`  [FOUND] ${source.path}`);
      foundCount++;
      this.readFileIntoChunks(fullPath, source.title, rootLabel);
    }

    if (missingCount > 0) {
      this.logger.warn(
        `Files loaded: ${foundCount}/${FILE_SOURCES.length}. Missing: ${missingFiles.join(', ')}`,
      );
    } else {
      this.logger.log(`All ${FILE_SOURCES.length} knowledge source files loaded successfully`);
    }

    this.logger.log(`Total knowledge base: ${this.chunks.length} chunks`);
    this.warmup();
  }

  private readFileIntoChunks(
    filePath: string,
    title: string,
    rootLabel: string,
  ): void {
    try {
      const raw = readFileSync(filePath, 'utf-8');
      const label = `${rootLabel}/${title}`;
      const sections = chunkMarkdown(raw, label);

      let loaded = 0;
      for (const section of sections) {
        const subChunks = splitChunk(section.title, section.content);
        for (const sub of subChunks) {
          this.chunks.push({
            id: `file-${this.chunks.length}`,
            title: sub.title,
            content: sub.content,
          });
          loaded++;
        }
      }

      this.logger.log(`  Loaded ${loaded} chunks from ${title}`);
    } catch (err) {
      this.logger.warn(`Failed to read ${filePath}: ${err}`);
    }
  }

  private async warmup(): Promise<void> {
    try {
      await this.embedQuery('warmup');
      this.ready = true;
      this.logger.log('RAG service ready');
    } catch (err) {
      this.logger.warn('RAG warmup failed, will retry on first query', err);
    }
  }

  private async embedQuery(text: string): Promise<number[]> {
    try {
      const embedModel = this.genAI.getGenerativeModel({
        model: EMBEDDING_MODEL,
      });
      const result = await embedModel.embedContent(text);
      return result.embedding.values;
    } catch {
      return new Array(768).fill(0);
    }
  }

  async retrieve(query: string, topK = 4): Promise<string> {
    if (!this.ready) {
      await this.warmup();
    }

    const queryVec = await this.embedQuery(query);

    const scored = this.chunks.map((chunk, i) => ({
      index: i,
      score: chunk.embedding ? cosineSimilarity(queryVec, chunk.embedding) : 0,
    }));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, topK);

    for (const item of top) {
      const chunk = this.chunks[item.index];
      if (!chunk.embedding) {
        const vec = await this.embedQuery(chunk.content);
        chunk.embedding = vec;
        item.score = cosineSimilarity(queryVec, vec);
      }
    }

    top.sort((a, b) => b.score - a.score);

    // Always include high-priority chunks regardless of score (deduped)
    const priorityIndices = new Set<number>();
    const priorityChunks: string[] = [];
    for (let i = 0; i < this.chunks.length; i++) {
      if (this.chunks[i].title.includes('[HIGH-PRIORITY]')) {
        priorityIndices.add(i);
        priorityChunks.push(`[${this.chunks[i].title}]: ${this.chunks[i].content}`);
      }
    }

    // Take top chunks. Use a very low threshold (0.05) to filter out complete noise
    // while still allowing cross-language (Arabic/English) queries to pass through.
    // Always include at least the top-1 chunk even below threshold for coverage.
    const nonPriority = top.filter((item) => !priorityIndices.has(item.index));
    const retrieved = nonPriority
      .filter((item, idx) => idx === 0 || item.score > 0.05)
      .map((item) => {
        const ch = this.chunks[item.index];
        return `[${ch.title}]: ${ch.content}`;
      });

    const contextParts = [...priorityChunks, ...retrieved];
    return contextParts.join('\n\n') || '';
  }
}
