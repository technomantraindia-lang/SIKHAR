# Sikhar Fleet Management System

Sikhar Fleet is a web application for managing a vehicle rental and fleet business. It brings operations, drivers, vehicles, rentals, collections, finance, maintenance and compliance into one admin workspace.

This guide explains the pages in the same order as the left sidebar.

## Start the application

Install the packages once:

```bash
npm install
```

Start the frontend and backend together:

```bash
npm run dev
```

On Windows PowerShell, use this if the `npm.ps1` policy is blocked:

```bash
npm.cmd run dev
```

Open the frontend at `http://localhost:5173/`. The backend runs at `http://localhost:5000/`.

Create a production build with:

```bash
npm run build
```

## Login

The application opens with a public landing page. Use the admin login button to enter the workspace. The login page supports the demo accounts shown in the application.

After login, the active page is saved in the browser URL hash. This means refreshing the browser keeps the current page open.

## Pages and features

### 1. Dashboard

The Dashboard is the first screen after login. It gives management a quick view of:

- Total fleet and fleet utilization
- Revenue and collections
- Outstanding customer balances
- Wallet health
- Vendor payables
- Recent alerts and reminders

The KPI cards and action buttons open the detailed pages that need attention.

### 2. Fleet Control Tower

This is the live operational view of the fleet. It shows:

- Vehicles on road, at workshop, ready to deploy or in breakdown
- Driver status
- Maintenance pipeline
- Compliance issues
- Vehicle health
- Off-road vehicles and pending job-card closures

Vehicle rows and action items open the relevant vehicle, maintenance or compliance workflow.

### 3. Drivers

The Drivers page manages the driver control tower. It covers:

- Driver list and driver profiles
- Active, leave, suspended and unassigned drivers
- Wallet balance and wallet health
- Attendance and document status
- Vehicle assignment and lease status
- Driver actions such as wallet top-up and status changes

### 4. Vehicles

The Vehicles menu has two pages:

#### All Vehicles

Vehicle Master is the main record for every vehicle. It stores the registration number, model, vehicle type, driver, operational status, odometer, health and linked records.

#### Vehicle Assignment

This page assigns and unassigns vehicles to drivers. It also keeps an assignment history so operations can see who used a vehicle and when.

### 5. Bookings / Leases

Bookings and Leases manage the rental lifecycle from customer creation to activation. The workflow includes:

1. Customer profile and KYC
2. Deal and billing setup
3. Vehicle selection
4. Agreement and deposit
5. Driver and vehicle activation

The page also supports lease status, customer details and agreement actions.

### 6. Rental Invoices

Rental Invoices shows invoices created for customers and leases. Users can:

- Search and review invoices
- View invoice status and amount
- Open invoice details
- Move to payment or collection actions

### 7. Generate Invoice

Generate Invoice creates a new rental invoice from the selected customer, lease or operational record. It supports invoice details, charges, discounts, tax information and a printable invoice preview.

### 8. Wallet Health

Wallet Health monitors driver wallet balances. It highlights:

- Healthy wallets
- Low balances
- Breached or negative balances
- Recharge requirements
- Wallet transactions and top-ups

This page helps prevent trips or assignments from continuing when a driver wallet needs attention.

### 9. Escalation Master

Escalation Master is the central issue-management page. It tracks:

- Escalation ticket number
- Driver and vehicle
- Category and priority
- Owner and SLA
- Evidence, notes and resolution

It keeps the complete escalation journey available for audit and follow-up.

### 10. Trips

Trips records trip activity and revenue-share information. It provides:

- Trip list and trip details
- Trip source, vehicle and driver
- Distance, duration and revenue
- Completed, live, cancelled and disputed states
- Manual trip creation and trip import
- Status changes and escalation actions

### 11. Maintenance

Maintenance follows the vehicle service process from beginning to end. The page includes the ten-stage workflow:

1. Service due
2. Job card
3. Workshop check-in
4. Estimate and approval
5. Work in progress
6. Quality control
7. Final bill
8. Payment
9. Vehicle release
10. Ready to deploy

It also stores job cards, vendor bills, approvals, QC records and maintenance payments.

### 12. Fuel

Fuel manages fuel logs and EV charging activity. It shows:

- EV charging sessions
- CNG and energy usage
- Energy cost
- Vehicle efficiency
- Charging station information
- Fuel records and verification

Users can start or stop charging sessions, settle charging records and verify fuel logs.

### 13. RTO & Compliance

RTO & Compliance tracks the documents and legal status of the fleet. It includes:

- Insurance
- Permit
- Fitness
- PUC
- Challans
- Expiry and renewal status
- Challan payment and wallet deduction actions

The page helps operations identify documents that are due, expired or breached.

## Finance pages

Finance is the money section of the application. It helps the owner, manager and finance team understand money earned, money spent, money to collect and money to pay.

### 14. P&L Statement

This page answers one simple question: **Did the business make a profit?**

- **Revenue:** money earned from rentals and operations
- **Expenses:** money spent on running the business
- **Net profit / loss:** revenue minus expenses
- **Margin:** how much profit is left from the revenue

Use this page for a monthly or date-wise profit check. You can also compare periods, view the source entries and export the report.

### 15. Cash Flow

This page shows the movement of cash.

- **Cash in:** money received by the business
- **Cash out:** money paid by the business
- **Net movement:** cash in minus cash out

Use it to check whether cash is increasing or decreasing. Internal wallet transfers are kept separate so the cash report is not misleading.

### 16. Accounts Receivable

Accounts Receivable means **money customers still have to pay us**.

This page shows:

- Total outstanding
- Unpaid invoices
- Collections this month
- DSO
- Ageing buckets
- Customers with overdue balances

Use it to find customers with pending payments, see how old the dues are and open their detailed statement.

### 17. Customer SOA

SOA means **Statement of Account**.

This page shows the complete money history of one customer:

- Invoices raised
- Payments received
- Deposits
- Wallet activity
- Credit notes or adjustments
- Current balance

Use it when a customer asks, “What do I owe?” or when the finance team needs to verify the account.

### 18. Accounts Payable

Accounts Payable means **money we still have to pay to vendors** such as workshops and service providers.

This page shows:

- Total payable
- Overdue bills
- Vendor spend
- Payment status
- Payable ageing
- Vendor bill register

Use it to see which vendor bills are due, overdue or already paid.

### 19. Asset EMI / Financing

This page shows the loan and EMI information for financed vehicles.

It tracks:

- Financed assets
- Lender
- Monthly and daily EMI
- Collections
- Recovery percentage
- Coverage or shortfall
- Financing configuration health

Use it to answer: **Are vehicle collections enough to cover the EMI?**

### 20. Management Reports

This is the quick summary page for the owner or management team. It brings the important numbers together:

- Revenue, expenses, net profit, outstanding and cash movement KPIs
- Links to all finance reports
- CEO Daily Scorecard
- Management Action Queue
- Profitability view
- Cash control view
- Exportable report pack

Use it when you want to understand the overall business position quickly and decide what needs attention next.

### 21. Reference Screens

This page is a simple map of the finance and operational pages. It helps a new user understand where each feature is located.

It contains:

- Finance reference screens
- Operational control surfaces
- Links to each implemented module
- Status of each mapped workflow

Use it as a quick navigation guide when you do not know which page to open.

## Administration pages

### 22. Reports

Reports is reserved for the broader reporting roadmap. It currently opens the module placeholder while the detailed report modules are being delivered through the Finance section.

### 23. Settings

Settings is reserved for future administration controls such as company setup, users, permissions and system preferences.

## Data and database

The backend reads database settings from the root `.env` file:

```env
PORT=5000
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=your-mysql-database
DB_PORT=3306
```

The application uses MySQL as the live source of truth for admin changes:

- Successful operational changes are saved in the `admin_operational_snapshots` MySQL table before the admin response is returned.
- Finance ledger reports continue to use MySQL tables.
- `server/data/` is kept as a local cache for development and fallback mode.
- In production, set `REQUIRE_LIVE_DB=true`. If MySQL is unavailable, the admin change returns an error and the local cache is rolled back; it is not silently treated as saved.
- Existing JSON records are not bulk-copied into live SQL automatically. To perform that migration after taking a database backup, explicitly set `MIGRATE_JSON_TO_SQL=true` for one controlled startup, then remove the flag.

For a production-style configuration, use:

```env
REQUIRE_LIVE_DB=true
MIGRATE_JSON_TO_SQL=false
```

The health endpoint (`/api/health`) shows the current database connection and operational storage mode.

Never commit real passwords or API keys to source control. Keep them in `.env` on the server.

## Add new dropdown options

In create and update forms, configurable dropdowns include **＋ Add new option…** at the bottom.

1. Open the dropdown.
2. Choose **＋ Add new option…**.
3. Enter the new value.
4. The value is saved and becomes available immediately in that form and in other forms using the same option group.

When MySQL is connected, these values are stored in the `admin_dropdown_options` table. If the database is temporarily unavailable during local development, the API stores them in `server/data/options.json` and continues working. Live vehicle, driver and lease selectors still use real records from their master data; the add-new control is intended for business master values such as lenders, service types, payment methods, hubs, escalation categories and document types. 

## Useful commands

```bash
npm run dev       # Start frontend and backend for development
npm run build     # Build the frontend for production
npm run lint      # Run code checks
npm run start     # Start the production Node server
```
