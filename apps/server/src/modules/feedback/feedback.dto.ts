import { z } from 'zod';
import { BugReportSeverity, FeatureRequestPriority } from './feedback.types';

// ── BugReport ────────────────────────────────────────────────────────────────

export const CreateBugReportSchema = z
  .object({
    title: z
      .string({ error: 'Title is required' })
      .min(1, 'Title is required')
      .max(200),
    description: z
      .string({ error: 'Description is required' })
      .min(1, 'Description is required')
      .max(5000),
    steps: z.string().max(5000).optional(),
    severity: z.enum(
      [
        BugReportSeverity.LOW,
        BugReportSeverity.MEDIUM,
        BugReportSeverity.HIGH,
        BugReportSeverity.CRITICAL,
      ],
      { error: 'Severity must be LOW, MEDIUM, HIGH, or CRITICAL' },
    ),
  })
  .strict();

export type CreateBugReportDto = z.infer<typeof CreateBugReportSchema>;

// ── FeatureRequest ───────────────────────────────────────────────────────────

export const CreateFeatureRequestSchema = z
  .object({
    title: z
      .string({ error: 'Title is required' })
      .min(1, 'Title is required')
      .max(200),
    description: z
      .string({ error: 'Description is required' })
      .min(1, 'Description is required')
      .max(5000),
    useCase: z.string().max(5000).optional(),
    priority: z.enum(
      [
        FeatureRequestPriority.NICE_TO_HAVE,
        FeatureRequestPriority.MODERATE,
        FeatureRequestPriority.HIGH,
        FeatureRequestPriority.CRITICAL,
      ],
      { error: 'Priority must be NICE_TO_HAVE, MODERATE, HIGH, or CRITICAL' },
    ),
  })
  .strict();

export type CreateFeatureRequestDto = z.infer<
  typeof CreateFeatureRequestSchema
>;

// ── ContactMessage ───────────────────────────────────────────────────────────

export const CreateContactMessageSchema = z
  .object({
    name: z
      .string({ error: 'Name is required' })
      .min(1, 'Name is required')
      .max(100),
    email: z
      .string({ error: 'Email is required' })
      .email('Must be a valid email address')
      .max(254),
    subject: z
      .string({ error: 'Subject is required' })
      .min(1, 'Subject is required')
      .max(200),
    message: z
      .string({ error: 'Message is required' })
      .min(1, 'Message is required')
      .max(5000),
  })
  .strict();

export type CreateContactMessageDto = z.infer<
  typeof CreateContactMessageSchema
>;

// ── Status update ────────────────────────────────────────────────────────────

export const UpdateStatusSchema = z
  .object({
    status: z
      .string({ error: 'Status is required' })
      .min(1, 'Status is required'),
  })
  .strict();

export type UpdateStatusDto = z.infer<typeof UpdateStatusSchema>;

// ── Pagination query ─────────────────────────────────────────────────────────

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'desc';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(DEFAULT_PAGE_SIZE),
  status: z.string().optional(),
  sortBy: z.string().optional().default(DEFAULT_SORT_BY),
  sortOrder: z.enum(['asc', 'desc']).optional().default(DEFAULT_SORT_ORDER),
});

export type PaginationQueryDto = z.infer<typeof PaginationQuerySchema>;
