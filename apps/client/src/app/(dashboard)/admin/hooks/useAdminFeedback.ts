"use client";

import { useCallback, useState } from "react";
import { apiClient } from "@/lib/api-client";

const DEFAULT_ERROR_MESSAGE = "Unable to update feedback";

export type AdminSortOrder = "asc" | "desc";
export type BugReportStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type BugReportStatusFilter = "ALL" | BugReportStatus;
export type BugReportSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FeatureRequestStatus = "SUBMITTED" | "UNDER_REVIEW" | "PLANNED" | "SHIPPED" | "REJECTED";
export type FeatureRequestStatusFilter = "ALL" | FeatureRequestStatus;
export type FeatureRequestPriority = "NICE_TO_HAVE" | "MODERATE" | "HIGH" | "CRITICAL";
export type ContactMessageStatus = "UNREAD" | "READ" | "REPLIED";
export type ContactMessageStatusFilter = "ALL" | ContactMessageStatus;

export interface FeedbackListParams<TStatus extends string> {
  page: number;
  pageSize: number;
  status: TStatus | "ALL";
  sortOrder: AdminSortOrder;
}

export interface BugReportItem {
  id: string;
  title: string;
  description: string;
  steps: string | null;
  severity: BugReportSeverity;
  status: BugReportStatus;
  userId: string | null;
  createdAt: string;
}

export interface FeatureRequestItem {
  id: string;
  title: string;
  description: string;
  useCase: string | null;
  priority: FeatureRequestPriority;
  status: FeatureRequestStatus;
  votes: number;
  userId: string | null;
  createdAt: string;
}

export interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
}

export interface PaginatedFeedback<TItem> {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FeedbackOperationState {
  isLoading: boolean;
  error: string | null;
}

export interface UseAdminFeedbackResult {
  fetchBugReports: (params: FeedbackListParams<BugReportStatus>) => Promise<PaginatedFeedback<BugReportItem>>;
  fetchFeatureRequests: (params: FeedbackListParams<FeatureRequestStatus>) => Promise<PaginatedFeedback<FeatureRequestItem>>;
  fetchContactMessages: (params: FeedbackListParams<ContactMessageStatus>) => Promise<PaginatedFeedback<ContactMessageItem>>;
  updateBugReportStatus: (id: string, status: BugReportStatus) => Promise<BugReportItem>;
  updateFeatureRequestStatus: (id: string, status: FeatureRequestStatus) => Promise<FeatureRequestItem>;
  updateContactMessageStatus: (id: string, status: ContactMessageStatus) => Promise<ContactMessageItem>;
  deleteBugReport: (id: string) => Promise<void>;
  deleteFeatureRequest: (id: string) => Promise<void>;
  deleteContactMessage: (id: string) => Promise<void>;
  bugReportsState: FeedbackOperationState;
  featureRequestsState: FeedbackOperationState;
  contactMessagesState: FeedbackOperationState;
  updateState: FeedbackOperationState;
  deleteState: FeedbackOperationState;
}

type OperationKey = "bugReports" | "featureRequests" | "contactMessages" | "update" | "delete";

type OperationStateMap = Record<OperationKey, FeedbackOperationState>;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return DEFAULT_ERROR_MESSAGE;
}

function buildParams<TStatus extends string>(params: FeedbackListParams<TStatus>): Record<string, string | number | undefined> {
  return {
    page: params.page,
    pageSize: params.pageSize,
    status: params.status === "ALL" ? undefined : params.status,
    sortOrder: params.sortOrder,
  };
}

const INITIAL_STATE: OperationStateMap = {
  bugReports: { isLoading: false, error: null },
  featureRequests: { isLoading: false, error: null },
  contactMessages: { isLoading: false, error: null },
  update: { isLoading: false, error: null },
  delete: { isLoading: false, error: null },
};

export function useAdminFeedback(): UseAdminFeedbackResult {
  const [states, setStates] = useState<OperationStateMap>(INITIAL_STATE);

  const setOperationState = useCallback((key: OperationKey, nextState: FeedbackOperationState): void => {
    setStates((currentStates) => ({ ...currentStates, [key]: nextState }));
  }, []);

  const runOperation = useCallback(async <TResult,>(key: OperationKey, operation: () => Promise<TResult>): Promise<TResult> => {
    setOperationState(key, { isLoading: true, error: null });

    try {
      const result = await operation();
      setOperationState(key, { isLoading: false, error: null });
      return result;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setOperationState(key, { isLoading: false, error: message });
      throw error;
    }
  }, [setOperationState]);

  const fetchBugReports = useCallback((params: FeedbackListParams<BugReportStatus>): Promise<PaginatedFeedback<BugReportItem>> => (
    runOperation("bugReports", async () => {
      const response = await apiClient.get<PaginatedFeedback<BugReportItem>>("/admin/feedback/bug-reports", { params: buildParams(params) });
      return response.data;
    })
  ), [runOperation]);

  const fetchFeatureRequests = useCallback((params: FeedbackListParams<FeatureRequestStatus>): Promise<PaginatedFeedback<FeatureRequestItem>> => (
    runOperation("featureRequests", async () => {
      const response = await apiClient.get<PaginatedFeedback<FeatureRequestItem>>("/admin/feedback/feature-requests", { params: buildParams(params) });
      return response.data;
    })
  ), [runOperation]);

  const fetchContactMessages = useCallback((params: FeedbackListParams<ContactMessageStatus>): Promise<PaginatedFeedback<ContactMessageItem>> => (
    runOperation("contactMessages", async () => {
      const response = await apiClient.get<PaginatedFeedback<ContactMessageItem>>("/admin/feedback/contact", { params: buildParams(params) });
      return response.data;
    })
  ), [runOperation]);

  const updateBugReportStatus = useCallback((id: string, status: BugReportStatus): Promise<BugReportItem> => (
    runOperation("update", async () => {
      const response = await apiClient.patch<BugReportItem>(`/admin/feedback/bug-reports/${id}`, { status });
      return response.data;
    })
  ), [runOperation]);

  const updateFeatureRequestStatus = useCallback((id: string, status: FeatureRequestStatus): Promise<FeatureRequestItem> => (
    runOperation("update", async () => {
      const response = await apiClient.patch<FeatureRequestItem>(`/admin/feedback/feature-requests/${id}`, { status });
      return response.data;
    })
  ), [runOperation]);

  const updateContactMessageStatus = useCallback((id: string, status: ContactMessageStatus): Promise<ContactMessageItem> => (
    runOperation("update", async () => {
      const response = await apiClient.patch<ContactMessageItem>(`/admin/feedback/contact/${id}`, { status });
      return response.data;
    })
  ), [runOperation]);

  const deleteBugReport = useCallback((id: string): Promise<void> => (
    runOperation("delete", async () => {
      await apiClient.delete(`/admin/feedback/bug-reports/${id}`);
    })
  ), [runOperation]);

  const deleteFeatureRequest = useCallback((id: string): Promise<void> => (
    runOperation("delete", async () => {
      await apiClient.delete(`/admin/feedback/feature-requests/${id}`);
    })
  ), [runOperation]);

  const deleteContactMessage = useCallback((id: string): Promise<void> => (
    runOperation("delete", async () => {
      await apiClient.delete(`/admin/feedback/contact/${id}`);
    })
  ), [runOperation]);

  return {
    fetchBugReports,
    fetchFeatureRequests,
    fetchContactMessages,
    updateBugReportStatus,
    updateFeatureRequestStatus,
    updateContactMessageStatus,
    deleteBugReport,
    deleteFeatureRequest,
    deleteContactMessage,
    bugReportsState: states.bugReports,
    featureRequestsState: states.featureRequests,
    contactMessagesState: states.contactMessages,
    updateState: states.update,
    deleteState: states.delete,
  };
}
