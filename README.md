# Ledgerghost

Build LedgerGhost, an autonomous agent app that audits financial statements and invoices to uncover hidden fees, creeping subscription costs, and unexpected charges, and drafts dispute letters to merchants.

Key features and screens to include:
1. Home / Audit Launcher:
   - Clear value proposition explaining what LedgerGhost detects (stealth price hikes, duplicate line items, quiet service/recovery fees).
   - "Try Sample Statement Audit" button (pre-loaded with realistic sample charges featuring unexpected fees like a sneaky telecom surcharge, a quiet SaaS plan bump, and a hidden delivery fee) for instant 1-click judging demos.
   - File upload dropzone to upload statement files (PDF, CSV, image).

2. Statement Review & Transaction View:
   - Editable table/cards showing extracted charges: Merchant, Date, Category, Line Item Description, and Amount.
   - Ability to add or adjust items before running the audit.

3. Audit Results & Agent Findings:
   - Breakdown of audited charges with clear status badges (Clear, Needs Review, High Risk).
   - Detailed inspection drawer/card explaining the reasoning behind flagged items (e.g. "Price increased 20% compared to prior period without notice", "Unitemized regulatory fee added").
   - Summary statistics: Total Audited, Potential Overcharges Detected, Savings Opportunity.

4. Merchant Dispute Draft Generator:
   - One-click dispute letter generator for flagged items.
   - Formatted, professional, and polite drafted letter asking the merchant to review or refund the specific charge.
   - Copy to clipboard and download draft options.

5. AI & Model Settings Modal:
   - Configuration panel prepared for Nebius Token Factory / NVIDIA Nemotron API integration (API Key input, Model selectors for Nemotron Nano/Super for parsing and Nemotron Ultra for reasoning/dispute drafting) with mock mode enabled by default so the demo works smoothly right away.

Clean, modern financial fintech aesthetic with dark/light mode support, responsive layout, and intuitive navigation.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ledgerghost.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/183e2350-8cb6-49d2-98cc-eb36288356c0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
