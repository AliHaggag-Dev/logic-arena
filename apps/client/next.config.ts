import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@logic-arena/engine", "@logic-arena/logic-parser"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: "cs-arena",
  project: "logic-arena-client",
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
});