# FleetPulse — Driver Trip & Fuel Tracking System

A full-stack modern web application for drivers to log standard & VIP trips and track fuel expenditures, accompanied by an executive admin command center for fleet owners.

Built with **Next.js 15 (App Router)**, **React 19**, **Neon Serverless PostgreSQL**, and **Tailwind CSS**. Ready for 1-click deployment on **Vercel**.

---

## Features

### 1. Mobile-First Driver Application
- **Ultra-Fast Trip Logging**: Select pickup and dropoff points (Booysens, Rosettenville, JHB CBD, Southgate, Sandton, Rosebank, Gold Reef City).
- **VIP Trip Management**: Toggle between Standard and VIP trips. VIP trips support custom rates, account references, and distinct gold badges.
- **Fuel Refill Logging**: Log fuel cost, station name (Shell, Engen, BP, Total, Sasol), liters pumped, and odometer readings.
- **Real-Time Shift Summary**: Immediate tracking of gross earnings, fuel spent, and shift net profit.
- **Duty Toggle**: Interactive "On Duty" / "Off Duty" status.

### 2. Executive Admin Command Center
- **Financial Analytics & KPI Cards**:
  - Total Gross Revenue
  - Total Fuel Cost & fuel-to-revenue efficiency ratio
  - Net Operating Profit margin
  - Trip distribution (Regular vs VIP volume & earnings)
- **Interactive Daily Revenue vs. Fuel Outflow Chart**: Hover tooltips and breakdowns.
- **Corridor Route Leaderboards**: Volume and earnings between high-frequency routes (e.g., Booysens ⇄ Rosettenville).
- **Operational Ledger Table**:
  - Filter by driver, trip type (All / Regular / VIP), date, and search notes.
  - Interactive status audits: toggle between "Approved" and "Pending".
  - One-click CSV export.
- **Locations & Pricing Settings Drawer**: Add new operational locations (e.g. Booysens South) and configure VIP pricing multipliers dynamically.

---

## Database Architecture (Neon PostgreSQL)

FleetPulse is powered by **Neon Serverless PostgreSQL** using `@neondatabase/serverless`:

- **Auto-Provisioning**: On first launch, `initDb()` automatically creates the schema:
  - `locations`
  - `drivers`
  - `pricing_rules`
  - `trips`
  - `fuel_logs`
  - `pricing_settings`
- **Zero-Config Dual Mode**: If `DATABASE_URL` is not yet configured, the app runs in in-memory mode with sample data so you can test and preview immediately. As soon as `DATABASE_URL` is provided, it automatically switches to Neon PostgreSQL!

---

## Getting Started Locally

### 1. Clone & Install
```bash
npm install
```

### 2. Configure Environment (Optional for local testing)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your free connection string from [Neon Console](https://neon.tech):
```env
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-sample-pool-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploying to Vercel

1. Push your repository to **GitHub** or **GitLab**.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. In **Project Settings** ➔ **Environment Variables**, add:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Neon PostgreSQL connection string
4. Click **Deploy**. Vercel will automatically build and publish your Next.js application!
