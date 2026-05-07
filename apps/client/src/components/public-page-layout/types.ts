import type { ReactNode } from "react";

export interface PublicSection {
  id: string;
  title: string;
  /** Short label used in the sidebar TOC (defaults to title if omitted) */
  label?: string;
}

export interface PublicPageLayoutProps {
  /** Page-level badge text (e.g. "LEGAL DOCUMENT", "PLATFORM GUIDE") */
  badge: string;
  /** Main page heading */
  title: string;
  /** One-line subtitle shown below the heading */
  subtitle: string;
  /** ISO date string (e.g. "May 2026") */
  lastUpdated: string;
  /** Back link href + label */
  backHref?: string;
  backLabel?: string;
  /** Ordered sections — ids must match the <section id="..."> elements in children */
  sections: PublicSection[];
  children: ReactNode;
}
