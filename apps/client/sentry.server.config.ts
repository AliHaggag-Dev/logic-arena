import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://25f236cc43aa8e5e864a1bbad8f1cf78@o4511043734798336.ingest.us.sentry.io/4511537989550080",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,
});
