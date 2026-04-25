import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

// ── Sandbox limits ──────────────────────────────────────────────────────────
const MAX_SCRIPT_CHARS = 5_000;
const MAX_SCRIPT_LINES = 100;

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
        const script = await this.prisma.robotScript.findUnique({
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
        });
    }
    async updateScript(scriptId: string, userId: string, title: string, content: string) {
        if (!content) {
            throw new BadRequestException('Script content cannot be empty.');
        }
        this.validateScriptSize(content);
        const script = await this.prisma.robotScript.findUnique({
            where: { id: scriptId },
        });

        if (!script || script.userId !== userId) {
            throw new NotFoundException("Script not found or unauthorized.");
        }

        const updateData: any = { content, version: script.version + 1 };
        if (title) {
            updateData.title = title;
        }

        return this.prisma.robotScript.update({
            where: { id: scriptId },
            data: updateData,
        });
    }

    async deleteScript(scriptId: string, userId: string) {
        const script = await this.prisma.robotScript.findUnique({
            where: { id: scriptId },
        });

        if (!script || script.userId !== userId) {
            throw new NotFoundException("Script not found or unauthorized.");
        }

        return this.prisma.robotScript.delete({
            where: { id: scriptId },
        });
    }
}