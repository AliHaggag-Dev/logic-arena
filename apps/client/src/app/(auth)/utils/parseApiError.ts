// ---------------------------------------------------------------------------
// Extracts clean, human-readable messages from both our ZodValidationPipe
// ({ messages: string[] }) and NestJS built-in exceptions ({ message: string }).
// ---------------------------------------------------------------------------
export function parseApiError(error: any): string[] {
  const data = error?.response?.data;
  if (!data) return [error?.message ?? "An unexpected error occurred"];
  if (Array.isArray(data.messages) && data.messages.length > 0) return data.messages;
  if (Array.isArray(data.message)) return data.message as string[];
  if (typeof data.message === "string") return [data.message];
  return [error?.message ?? "An unexpected error occurred"];
}
