import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import { MAX_SCRIPT_CONTENT_LENGTH } from './scripts.dto';

// ── Sandbox limits ──────────────────────────────────────────────────────────
const MAX_SCRIPT_CHARS = MAX_SCRIPT_CONTENT_LENGTH;
const MAX_SCRIPT_LINES = 100;
const MAX_SCRIPTS_PER_PAGE = 100;
const SCRIPT_TTL = 300;
const SCRIPT_LIST_TTL = 120;

const scriptKey = (userId: string, scriptId: string) =>
  `script:${userId}:${scriptId}`;
const scriptListKey = (userId: string) => `scripts:list:${userId}`;

@Injectable()
export class ScriptsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // ── Validation ────────────────────────────────────────────────────────────

  private validateScriptSize(content: string): void {
    if (content.length > MAX_SCRIPT_CHARS) {
      throw new BadRequestException(
        `Script exceeds maximum size: ${content.length}/${MAX_SCRIPT_CHARS} characters.`,
      );
    }
    const lineCount = content.split('\n').length;
    if (lineCount > MAX_SCRIPT_LINES) {
      throw new BadRequestException(
        `Script exceeds maximum lines: ${lineCount}/${MAX_SCRIPT_LINES} lines.`,
      );
    }
  }

  async createScript(userId: string, title: string, content: string) {
    if (!content) {
      throw new BadRequestException('Script content cannot be empty.');
    }
    this.validateScriptSize(content);
    const script = await this.prisma.robotScript.create({
      data: { userId, title, content },
    });
    await this.redis.del(scriptListKey(userId));
    await this.redis.set(scriptKey(userId, script.id), script, SCRIPT_TTL);
    return script;
  }

  async getScriptById(scriptId: string, userId: string) {
    const cached = await this.redis.get<unknown>(scriptKey(userId, scriptId));
    if (cached) return cached;

    const script = await this.prisma.robotScript.findFirst({
      where: { id: scriptId, userId },
    });
    if (!script) {
      throw new NotFoundException('Script not found or unauthorized.');
    }
    await this.redis.set(scriptKey(userId, scriptId), script, SCRIPT_TTL);
    return script;
  }

  async getUserScripts(userId: string) {
    const cached = await this.redis.get<unknown[]>(scriptListKey(userId));
    if (cached) return cached;

    const scripts = await this.prisma.robotScript.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: MAX_SCRIPTS_PER_PAGE,
    });
    await this.redis.set(scriptListKey(userId), scripts, SCRIPT_LIST_TTL);
    return scripts;
  }
  async updateScript(
    scriptId: string,
    userId: string,
    title: string,
    content: string,
  ) {
    if (!content) {
      throw new BadRequestException('Script content cannot be empty.');
    }
    this.validateScriptSize(content);
    const script = await this.prisma.robotScript.findFirst({
      where: { id: scriptId, userId },
    });

    if (!script) {
      throw new NotFoundException('Script not found or unauthorized.');
    }

    const updateData: { content: string; version: number; title?: string } = {
      content,
      version: script.version + 1,
    };
    if (title) {
      updateData.title = title;
    }

    const updated = await this.prisma.robotScript.update({
      where: { id: scriptId },
      data: updateData,
    });
    await this.redis.del(scriptListKey(userId));
    await this.redis.set(scriptKey(userId, scriptId), updated, SCRIPT_TTL);
    return updated;
  }

  async deleteScript(scriptId: string, userId: string) {
    const script = await this.prisma.robotScript.findFirst({
      where: { id: scriptId, userId },
    });

    if (!script) {
      throw new NotFoundException('Script not found or unauthorized.');
    }

    await this.prisma.robotScript.deleteMany({
      where: { id: scriptId, userId },
    });

    await this.redis.del(scriptKey(userId, scriptId), scriptListKey(userId));

    return { success: true };
  }
}
