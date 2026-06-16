import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://logicarena.dev/garage",
  },
};

export default function GarageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
