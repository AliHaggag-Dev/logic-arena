import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AiService } from './ai.service';

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY = 10;

interface ChatDto {
  message: string;
  history: { role: 'user' | 'model'; content: string }[];
  language?: 'ar' | 'en' | 'auto';
}

@SkipThrottle({ auth: true })
@Throttle({ global: { limit: 20, ttl: 60_000 } })
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('docs-chat')
  @HttpCode(200)
  async chat(
    @Body() body: ChatDto,
    @Res() res: Response,
  ) {
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      throw new BadRequestException('message is required and must be a string');
    }

    const sanitized = message.replace(/<[^>]*>/g, '').slice(0, MAX_MESSAGE_LENGTH);
    if (!sanitized.trim()) {
      throw new BadRequestException('message must not be empty');
    }

    if (!Array.isArray(history)) {
      throw new BadRequestException('history must be an array');
    }

    const validRoles = ['user', 'model'] as const;
    for (const entry of history) {
      if (!entry.role || !validRoles.includes(entry.role as typeof validRoles[number])) {
        throw new BadRequestException('history entries must have role "user" or "model"');
      }
      if (typeof entry.content !== 'string') {
        throw new BadRequestException('history entry content must be a string');
      }
    }

    const trimmedHistory = history.slice(-MAX_HISTORY);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      const stream = this.aiService.streamChat(sanitized, trimmedHistory);

      for await (const chunk of stream) {
        const escaped = JSON.stringify(chunk);
        res.write(`data: ${escaped}\n\n`);
      }

      res.write('data: [DONE]\n\n');
    } catch (error) {
      const message_ = error instanceof Error ? error.message : 'Unknown error';
      const escaped = JSON.stringify({ error: message_ });
      res.write(`data: ${escaped}\n\n`);
    } finally {
      res.end();
    }
  }
}
