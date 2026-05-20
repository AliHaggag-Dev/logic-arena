"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

const DEFAULT_ERROR_MESSAGE = "The admin console hit an unexpected fault.";

interface AdminErrorBoundaryProps {
  children: ReactNode;
}

interface AdminErrorBoundaryState {
  errorMessage: string | null;
}

export class AdminErrorBoundary extends Component<AdminErrorBoundaryProps, AdminErrorBoundaryState> {
  public state: AdminErrorBoundaryState = {
    errorMessage: null,
  };

  public static getDerivedStateFromError(error: Error): AdminErrorBoundaryState {
    return { errorMessage: error.message || DEFAULT_ERROR_MESSAGE };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Admin boundary caught an error", error, errorInfo);
  }

  private handleRetry = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (!this.state.errorMessage) {
      return this.props.children;
    }

    return (
      <section className="rounded-lg border border-[var(--sem-danger)] bg-card p-5 shadow-[var(--card-shadow)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[var(--sem-danger)] bg-[rgba(var(--sem-danger-rgb),0.12)] text-[var(--sem-danger)]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-text-primary">Something went wrong</h2>
              <p className="mt-2 break-words text-sm font-bold leading-6 text-text-secondary">{this.state.errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-accent/30 bg-bg-primary px-4 text-xs font-black uppercase tracking-[0.16em] text-accent transition-colors hover:border-accent hover:bg-accent/10"
          >
            <RefreshCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </section>
    );
  }
}
