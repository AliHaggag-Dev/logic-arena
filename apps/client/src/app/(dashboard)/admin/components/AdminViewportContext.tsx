"use client";

import { createContext, useContext } from "react";

export interface AdminViewportContextValue {
  isMobile: boolean;
}

export const AdminViewportContext = createContext<AdminViewportContextValue>({ isMobile: false });

export function useAdminViewport(): AdminViewportContextValue {
  return useContext(AdminViewportContext);
}
