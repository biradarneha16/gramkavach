# GRAMKAVACH

GRAMKAVACH is a React prototype for suspicious bank-account access alerts. It focuses on:

- instant pop-up alerts when access or bank-link activity is detected
- SMS notifications to the registered phone
- a three-step citizen verification flow
- escalation to a cyber crime number after more than three blocked alerts
- an offline-first posture with a queued retry path and an Android SMS bridge hook

## Important Reality Check

This prototype can demonstrate the workflow, but two production requirements need non-browser infrastructure:

1. Real bank access detection needs an approved integration with the bank, UPI platform, or account aggregator APIs.
2. True offline SMS delivery needs a native Android shell or another SMS-capable device gateway. Browsers cannot send SMS on their own without network and device permissions.

## Local Setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Run `npm run dev`.

The local Vite server includes a development-only `/api/send-alert` and `/api/escalate` fallback, so the alert flow can be tested without sending a real SMS. Configure Twilio variables before deploying if real SMS delivery is required.

## Permanent Public Deployment

This repository includes `vercel.json` and a GitHub Actions deployment workflow. To publish it:

1. Create or import the repository as a Vercel project.
2. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` as GitHub Actions secrets.
3. Add the Twilio variables from `.env.example` to the Vercel project environment.
4. Push to `main` or `codex/alert-prototype-sync`.

Vercel then builds the PWA and deploys the `/api` SMS handlers. The public URL remains stable across deployments.

## Production Integrations

- `api/send-alert.ts` sends the user alert through Twilio when the app is online.
- `api/escalate.ts` sends the escalation message when blocked alerts go above three.
- `supabase/migrations/202604020001_gramkavach_schema.sql` creates a security-first Postgres schema with RLS.

## Recommended Next Build Phase

- Wrap the web app in Capacitor or React Native for offline SMS permissions.
- Replace selfie storage with an encrypted on-device face embedding.
- Hash the guardian PIN server-side instead of keeping it in local prototype state.
- Ingest real alert events from the bank or telecom partner instead of the simulator.
