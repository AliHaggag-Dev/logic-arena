import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import * as nodemailer from 'nodemailer';

const EMAIL_QUEUE_KEY = 'email:queue';
const EMAIL_QUEUE_BACKOFF_KEY = 'email:backoff';
const MAX_RETRIES = 3;

interface EmailJob {
  to: string;
  subject: string;
  html: string;
  retries?: number;
}

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);
  private transporter: nodemailer.Transporter;
  private processing = false;

  constructor(private readonly redis: RedisService) {
    const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 8_000,
      socketTimeout: 8_000,
      greetingTimeout: 5_000,
    });

    this.transporter.verify((err) => {
      if (err) {
        this.logger.error(`SMTP connection failed: ${err.message}`);
      } else {
        this.logger.log('SMTP transporter ready');
      }
    });

    setInterval(() => this.processQueue(), 2_000);
  }

  async enqueue(job: EmailJob): Promise<void> {
    try {
      await this.redis.getClient().lpush(EMAIL_QUEUE_KEY, JSON.stringify(job));
      this.logger.log(`Email queued → ${job.to} (${job.subject})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to enqueue email: ${msg}`);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (true) {
        const raw = await this.redis.getClient().brpop(EMAIL_QUEUE_KEY, 1);
        if (!raw) break;

        const job: EmailJob = JSON.parse(raw[1]);
        try {
          await this.transporter.sendMail({
            from: `"Logic Arena" <${process.env.SMTP_USER}>`,
            to: job.to,
            subject: job.subject,
            html: job.html,
          });
          this.logger.log(`Email sent → ${job.to}`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          const retries = (job.retries ?? 0) + 1;
          if (retries < MAX_RETRIES) {
            this.logger.warn(`Email failed (${retries}/${MAX_RETRIES}), requeueing: ${msg}`);
            await this.redis.getClient().lpush(EMAIL_QUEUE_KEY, JSON.stringify({ ...job, retries }));
          } else {
            this.logger.error(`Email failed after ${MAX_RETRIES} retries: ${msg}`);
            await this.redis.getClient().lpush(EMAIL_QUEUE_BACKOFF_KEY, JSON.stringify({ ...job, failedAt: Date.now() }));
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Email queue processor error: ${msg}`);
    } finally {
      this.processing = false;
    }
  }
}
