import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://logicarena.dev/friends",
  },
};

export default function FriendsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
