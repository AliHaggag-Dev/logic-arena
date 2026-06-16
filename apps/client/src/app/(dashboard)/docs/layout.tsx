import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://logicarena.dev/docs",
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
