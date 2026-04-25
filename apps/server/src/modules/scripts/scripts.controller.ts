import {
  Controller, Post, Get, Put, Delete,
  Body, Param, Req, UseGuards,
  HttpException, HttpStatus,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ScriptsService } from './scripts.service';
import { AuthGuard } from '../../common/auth.guard';
import { RedisService } from '../../common/redis.service';

// ── Sandbox: script-save rate limit ──────────────────────────────────────────
const SCRIPT_SAVE_LIMIT = 10;       // max saves
const SCRIPT_SAVE_WINDOW_SEC = 60;  // per 60 s

@SkipThrottle({ auth: true })
@UseGuards(AuthGuard)
@Controller('scripts')
export class ScriptsController {
    constructor(
        private scriptsService: ScriptsService,
        private redis: RedisService,
    ) { }

    // ── Rate-limit gate ──────────────────────────────────────────────────────

    private async enforceScriptSaveLimit(userId: string): Promise<void> {
        const key = `ratelimit:scripts:${userId}`;
        const count = await this.redis.incr(key, SCRIPT_SAVE_WINDOW_SEC);
        if (count > SCRIPT_SAVE_LIMIT) {
            throw new HttpException(
                `Rate limit exceeded: max ${SCRIPT_SAVE_LIMIT} script saves per minute.`,
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }
    }

    // ── Endpoints ────────────────────────────────────────────────────────────

    @Post()
    async create(@Req() req: { user: { sub: string } }, @Body() body: { title: string; content: string }) {
        const userId = req.user.sub;
        await this.enforceScriptSaveLimit(userId);
        return this.scriptsService.createScript(userId, body.title, body.content);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
        const userId = req.user.sub;
        return this.scriptsService.getScriptById(id, userId);
    }

    @Get()
    async findAll(@Req() req: { user: { sub: string } }) {
        const userId = req.user.sub;
        return this.scriptsService.getUserScripts(userId);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Req() req: { user: { sub: string } }, @Body() body: { title: string; content: string }) {
        const userId = req.user.sub;
        await this.enforceScriptSaveLimit(userId);
        return this.scriptsService.updateScript(id, userId, body.title, body.content);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
        const userId = req.user.sub;
        return this.scriptsService.deleteScript(id, userId);
    }
}