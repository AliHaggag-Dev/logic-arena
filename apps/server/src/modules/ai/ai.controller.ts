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
const MAX_DESCRIPTION_LENGTH = 500;

interface ChatDto {
  message: string;
  history: { role: 'user' | 'model'; content: string }[];
  language?: 'ar' | 'en' | 'auto';
  image?: string;
}

interface GenerateScriptDto {
  description: string;
}

@SkipThrottle({ auth: true })
@Throttle({ global: { limit: 20, ttl: 60_000 } })
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('docs-chat')
  @HttpCode(200)
  async chat(@Body() body: ChatDto, @Res() res: Response) {
    const { message, history, image } = body;

    const hasMessage =
      message && typeof message === 'string' && message.trim().length > 0;

    if (!hasMessage && !image) {
      throw new BadRequestException('message or image must be provided');
    }

    const sanitized = hasMessage
      ? message.replace(/<[^>]*>/g, '').slice(0, MAX_MESSAGE_LENGTH)
      : '';

    if (!Array.isArray(history)) {
      throw new BadRequestException('history must be an array');
    }

    const validRoles = ['user', 'model'] as const;
    for (const entry of history) {
      if (!entry.role || !validRoles.includes(entry.role)) {
        throw new BadRequestException(
          'history entries must have role "user" or "model"',
        );
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
      const stream = this.aiService.streamChat(
        sanitized,
        trimmedHistory,
        image,
      );

      for await (const chunk of stream) {
        const escaped = JSON.stringify(chunk);
        res.write(`data: ${escaped}\n\n`);
      }

      res.write('data: [DONE]\n\n');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      // Show friendly message for Google 503 overload errors
      const isOverload = msg.includes('503') || msg.includes('Service Unavailable') || msg.includes('high demand');
      const friendly = isOverload
        ? 'ARIA is currently overloaded. Please wait a moment and try again.\nARIA حالياً مرتفعة الضغط. برجاء الانتظار قليلاً والمحاولة مرة أخرى.'
        : msg;
      const escaped = JSON.stringify({ error: friendly });
      res.write(`data: ${escaped}\n\n`);
    } finally {
      res.end();
    }
  }

  @Post('generate-script')
  @HttpCode(200)
  async generateScript(@Body() body: GenerateScriptDto, @Res() res: Response) {
    const { description } = body;

    if (
      !description ||
      typeof description !== 'string' ||
      description.trim().length === 0
    ) {
      throw new BadRequestException('description must be a non-empty string');
    }

    const sanitized = description
      .replace(/<[^>]*>/g, '')
      .slice(0, MAX_DESCRIPTION_LENGTH);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      const stream = this.aiService.streamGenerateScript(sanitized);

      for await (const chunk of stream) {
        const escaped = JSON.stringify(chunk);
        res.write(`data: ${escaped}\n\n`);
      }

      res.write('data: [DONE]\n\n');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      const isOverload = msg.includes('503') || msg.includes('Service Unavailable') || msg.includes('high demand');
      const friendly = isOverload
        ? 'ARIA is currently overloaded. Please wait a moment and try again.\nARIA حالياً مرتفعة الضغط. برجاء الانتظار قليلاً والمحاولة مرة أخرى.'
        : msg;
      const escaped = JSON.stringify({ error: friendly });
      res.write(`data: ${escaped}\n\n`);
    } finally {
      res.end();
    }
  }
}
