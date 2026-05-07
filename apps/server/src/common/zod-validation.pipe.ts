import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

/**
 * A NestJS pipe that validates incoming data against a Zod schema.
 *
 * Usage (per-route):
 *
 *   @Post('register')
 *   @UsePipes(new ZodValidationPipe(RegisterSchema))
 *   async register(@Body() body: RegisterDto) { ... }
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const messages = this.formatErrors(result.error);
      throw new BadRequestException({
        statusCode: 400,
        error: 'Validation Failed',
        messages,
      });
    }

    return result.data;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private formatErrors(error: ZodError): string[] {
    // Zod v4 uses .issues (replaces .errors from v3)
    return error.issues.map((issue) => {
      const field = issue.path.join('.') || 'input';
      return `${this.humaniseField(field)}: ${issue.message}`;
    });
  }

  private humaniseField(field: string): string {
    const map: Record<string, string> = {
      username: 'Username',
      email: 'Email',
      password: 'Password',
    };
    return map[field] ?? field;
  }
}
