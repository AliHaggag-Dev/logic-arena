import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared field rules (Zod v4 compatible)
// ---------------------------------------------------------------------------

const usernameSchema = z
  .string({ error: 'Username is required' })
  .min(3, 'Username must be at least 3 characters')
  .max(16, 'Username must be at most 16 characters')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username may only contain letters, numbers, and underscores',
  );

const emailSchema = z
  .string({ error: 'Email is required' })
  .max(254, 'Email must be at most 254 characters')
  .email('Must be a valid email address');

const passwordSchema = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^a-zA-Z0-9]/,
    'Password must contain at least one special character',
  );

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export const RegisterSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
}).strict();

export const LoginSchema = z.object({
  username: usernameSchema,
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required').max(128, 'Password must be at most 128 characters'),
}).strict();

export const VerifyEmailSchema = z.object({
  email: emailSchema,
  code: z.string().length(6, 'Verification code must be exactly 6 characters'),
}).strict();

export const ForgotPasswordSchema = z.object({
  email: emailSchema,
}).strict();

export const ResetPasswordSchema = z.object({
  email: emailSchema,
  code: z.string().length(6, 'Reset code must be exactly 6 characters'),
  newPassword: passwordSchema,
}).strict();

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;


