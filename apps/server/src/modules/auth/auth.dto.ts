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
  .email('Must be a valid email address');

const passwordSchema = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
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
});

export const LoginSchema = z.object({
  username: usernameSchema,
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;

