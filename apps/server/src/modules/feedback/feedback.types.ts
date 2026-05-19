// ── Status constants ─────────────────────────────────────────────────────────

export const BugReportStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type BugReportStatusValue =
  (typeof BugReportStatus)[keyof typeof BugReportStatus];

export const BugReportSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type BugReportSeverityValue =
  (typeof BugReportSeverity)[keyof typeof BugReportSeverity];

export const FeatureRequestStatus = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  PLANNED: 'PLANNED',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
} as const;

export type FeatureRequestStatusValue =
  (typeof FeatureRequestStatus)[keyof typeof FeatureRequestStatus];

export const FeatureRequestPriority = {
  NICE_TO_HAVE: 'NICE_TO_HAVE',
  MODERATE: 'MODERATE',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type FeatureRequestPriorityValue =
  (typeof FeatureRequestPriority)[keyof typeof FeatureRequestPriority];

export const ContactMessageStatus = {
  UNREAD: 'UNREAD',
  READ: 'READ',
  REPLIED: 'REPLIED',
} as const;

export type ContactMessageStatusValue =
  (typeof ContactMessageStatus)[keyof typeof ContactMessageStatus];

// ── Response interfaces ──────────────────────────────────────────────────────

export interface BugReportResponse {
  id: string;
  title: string;
  description: string;
  steps: string | null;
  severity: string;
  status: string;
  userId: string | null;
  createdAt: Date;
}

export interface FeatureRequestResponse {
  id: string;
  title: string;
  description: string;
  useCase: string | null;
  priority: string;
  status: string;
  votes: number;
  userId: string | null;
  createdAt: Date;
}

export interface ContactMessageResponse {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
}

// ── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
