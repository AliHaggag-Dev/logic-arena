import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const port   = parseInt(process.env.SMTP_PORT ?? '587', 10);
    const secure = port === 465; // true = SSL (465), false = STARTTLS (587)

    this.transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Gmail App Password (16 chars, no spaces)
      },
    });

    // Verify connection on startup so misconfiguration is caught early
    this.transporter.verify((err) => {
      if (err) {
        this.logger.error(`SMTP connection failed: ${err.message}`);
        console.error('❌ SMTP verify failed:', err);
      } else {
        this.logger.log('✅ SMTP transporter ready');
        console.log('✅ SMTP transporter ready');
      }
    });
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from:    `"Logic Arena" <${process.env.SMTP_USER}>`,
        to,
        subject: '[ Logic Arena ] — Email Verification Code',
        html: `
          <div style="background:#030712;color:#22d3ee;font-family:monospace;padding:32px;border:1px solid rgba(34,211,238,0.2);border-radius:8px;max-width:480px">
            <h2 style="color:#22d3ee;letter-spacing:0.2em;margin:0 0 8px">LOGIC ARENA</h2>
            <p style="color:rgba(168,85,247,0.7);font-size:11px;letter-spacing:0.3em;margin:0 0 24px">[ IDENTITY VERIFICATION ]</p>
            <p style="color:#e2e8f0;margin:0 0 16px">Enter the following code to verify your identity:</p>
            <div style="background:rgba(34,211,238,0.05);border:1px solid rgba(34,211,238,0.3);border-radius:6px;padding:16px;text-align:center;letter-spacing:0.5em;font-size:32px;color:#22d3ee;margin:0 0 16px">${code}</div>
            <p style="color:rgba(148,163,184,0.6);font-size:11px;margin:0">Expires in 15 minutes. Do not share this code.</p>
          </div>
        `,
      });
      console.log(`✅ Verification email sent to ${to}`);
      this.logger.log(`Verification email sent → ${to}`);
    } catch (err: any) {
      console.error('❌ Verification email failed:', err.message, err);
      this.logger.error(`Failed to send verification email to ${to}: ${err.message}`);
      throw err; // re-throw so AuthService can surface the failure
    }
  }

  async sendResetCode(to: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from:    `"Logic Arena" <${process.env.SMTP_USER}>`,
        to,
        subject: '[ Logic Arena ] — Password Reset Code',
        html: `
          <div style="background:#030712;color:#a855f7;font-family:monospace;padding:32px;border:1px solid rgba(168,85,247,0.2);border-radius:8px;max-width:480px">
            <h2 style="color:#22d3ee;letter-spacing:0.2em;margin:0 0 8px">LOGIC ARENA</h2>
            <p style="color:rgba(168,85,247,0.7);font-size:11px;letter-spacing:0.3em;margin:0 0 24px">[ SECURITY KEY RESET ]</p>
            <p style="color:#e2e8f0;margin:0 0 16px">Enter this code to reset your security key:</p>
            <div style="background:rgba(168,85,247,0.05);border:1px solid rgba(168,85,247,0.3);border-radius:6px;padding:16px;text-align:center;letter-spacing:0.5em;font-size:32px;color:#a855f7;margin:0 0 16px">${code}</div>
            <p style="color:rgba(148,163,184,0.6);font-size:11px;margin:0">Expires in 15 minutes. If you did not request this, ignore this email.</p>
          </div>
        `,
      });
      console.log(`✅ Reset email sent to ${to}`);
      this.logger.log(`Reset email sent → ${to}`);
    } catch (err: any) {
      console.error('❌ Reset email failed:', err.message, err);
      this.logger.error(`Failed to send reset email to ${to}: ${err.message}`);
      throw err;
    }
  }
}
