import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { MAX_SCRIPT_CONTENT_LENGTH } from './scripts.dto';

// ── Sandbox limits ──────────────────────────────────────────────────────────
const MAX_SCRIPT_CHARS = MAX_SCRIPT_CONTENT_LENGTH;
const MAX_SCRIPT_LINES = 100;
const MAX_SCRIPTS_PER_PAGE = 100;

@Injectable()
export class ScriptsService {
    constructor(private prisma: PrismaService) { }

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
        return this.prisma.robotScript.create({
            data: { userId, title, content },
        });
    }

    async getScriptById(scriptId: string, userId: string) {
        const script = await this.prisma.robotScript.findFirst({
            where: { id: scriptId, userId },
        });
        if (!script) {
            throw new NotFoundException("Script not found or unauthorized.");
        }
        return script;
    }

    async getUserScripts(userId: string) {
        return this.prisma.robotScript.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: MAX_SCRIPTS_PER_PAGE,
        });
    }
    async updateScript(scriptId: string, userId: string, title: string, content: string) {
        if (!content) {
            throw new BadRequestException('Script content cannot be empty.');
        }
        this.validateScriptSize(content);
        const script = await this.prisma.robotScript.findFirst({
            where: { id: scriptId, userId },
        });

        if (!script) {
            throw new NotFoundException("Script not found or unauthorized.");
        }

        const updateData: { content: string; version: number; title?: string } = { content, version: script.version + 1 };
        if (title) {
            updateData.title = title;
        }

        return this.prisma.robotScript.update({
            where: { id: scriptId },
            data: updateData,
        });
    }

    async deleteScript(scriptId: string, userId: string) {
        const script = await this.prisma.robotScript.findFirst({
            where: { id: scriptId, userId },
        });

        if (!script) {
            throw new NotFoundException("Script not found or unauthorized.");
        }

        await this.prisma.robotScript.deleteMany({
            where: { id: scriptId, userId },
        });

        return { success: true };
    }
}