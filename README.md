# Shared Expense Management Application

A production-quality shared expense management application inspired by Splitwise, built using modern web technologies.

## Tech Stack
* **Framework**: Next.js 15 (App Router)
* **Language**: TypeScript
* **Database**: PostgreSQL (Neon)
* **ORM**: Prisma
* **Styling**: TailwindCSS
* **UI Components**: shadcn/ui
* **Deployment**: Vercel

## Core Features
1. **Authentication**: Secure user login and session management.
2. **Groups**: Create groups, manage membership, and maintain membership history.
3. **Expenses**: Add, edit, delete expenses. Support for Equal, Exact, and Percentage splits.
4. **Settlements**: Record payments between members.
5. **Balances**: Simplified debt settlement algorithm to calculate minimal transactions required to settle balances.
6. **CSV Import**: Import expenses exactly as provided, with a robust anomaly detection engine to ensure data integrity.

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Setup the database:
   - Copy `.env.example` to `.env` and fill in your database credentials.
   - Run `npx prisma generate` and `npx prisma db push` (or `migrate dev`).
   - Run `npm run seed` to populate seed data.
4. Start the development server: `npm run dev`

## File Structure

* `src/app`: Next.js App Router routes and pages.
* `src/components`: Reusable UI components.
* `src/lib`: Utility functions and shared logic.
* `src/services`: Business logic services (e.g., BalanceEngine, AnomalyDetection).
* `prisma/`: Prisma schema and migrations.
