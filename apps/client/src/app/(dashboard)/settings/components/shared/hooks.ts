"use client";

import React from "react";
import { FeedbackState } from "./types";

export function useFeedback() {
  const [state, setState] = React.useState<FeedbackState>({ status: "idle" });
  const flash = React.useCallback((status: "success" | "error", message?: string) => {
    setState({ status, message });
    setTimeout(() => setState({ status: "idle" }), 2500);
  }, []);
  return { state, flash };
}
