"use client";

import { ScrollToTop } from "../../components/ui/ScrollToTop";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ScrollToTop />
    </>
  );
}
