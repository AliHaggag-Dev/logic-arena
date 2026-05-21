"use client";
// ---------------------------------------------------------------------------
// Extracts clean, human-readable messages from API responses.
// Also handles special redirect signals for the auth flow.
// ---------------------------------------------------------------------------

export type ParsedApiError =
  | { kind: "errors"; messages: string[] }
  | { kind: "redirect"; to: string; message: string };

export function parseApiError(error: unknown): string[] {
  const parsed = parseApiErrorFull(error);
  return parsed.kind === "errors" ? parsed.messages : [parsed.message];
}

export function parseApiErrorFull(error: unknown): ParsedApiError {
  const err = error as { response?: { status?: number; data?: { message?: unknown; messages?: unknown } }; message?: string };
  const status = err?.response?.status;
  const data = err?.response?.data;

  // 429 Rate limit
  if (status === 429) {
    return { kind: "errors", messages: ["Too many attempts. Please wait 15 minutes and try again."] };
  }

  // Get the message string from data
  let serverMessage = "";
  if (typeof data?.message === "string") serverMessage = data.message;
  else if (Array.isArray(data?.messages) && (data.messages as unknown[]).length > 0) {
    return { kind: "errors", messages: data.messages as string[] };
  } else if (Array.isArray(data?.message)) {
    return { kind: "errors", messages: data.message as string[] };
  }

  // Special redirect signals from the server
  if (serverMessage.startsWith("Account created but verification email failed")) {
    return {
      kind: "redirect",
      to: "/verify-email",
      message: "Account created! We couldn't send the verification email automatically. Please check your email or enter your code below.",
    };
  }

  if (serverMessage.startsWith("Reset code saved but email delivery failed")) {
    return {
      kind: "redirect",
      to: "/reset-password",
      message: "Reset code generated! We couldn't send the email automatically. Please check your email or try again shortly.",
    };
  }

  if (serverMessage === "Please verify your email first") {
    return {
      kind: "redirect",
      to: "/verify-email",
      message: "Please verify your email before logging in. Check your inbox for the code.",
    };
  }

  if (serverMessage) {
    return { kind: "errors", messages: [serverMessage] };
  }

  return { kind: "errors", messages: [err?.message ?? "Something went wrong. Please try again."] };
}
