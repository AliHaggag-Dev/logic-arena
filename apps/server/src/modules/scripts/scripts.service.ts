import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class ScriptsService {
    constructor(private prisma: PrismaService) { }

    async createScript(userId: string, title: string, content: string) {
        if (!content) {
            throw new Error("Script content cannot be empty.");
        }
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
            throw new Error("Script content cannot be empty.");
        }
        const script = await this.prisma.robotScript.findUnique({
            where: { id: scriptId },
        });

        if (!script || script.userId !== userId) {
            throw new NotFoundException("Script not found or unauthorized.");
        }

        return this.prisma.robotScript.update({
            where: { id: scriptId },
            data: { title, content, version: script.version + 1 },
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