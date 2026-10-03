# Ziffix — Home Services Management System

A full-stack home services management platform with three role-based portals (Admin, Customer, Technician), built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Prisma, and MySQL.

Ziffix is designed to manage the complete home-service workflow from service discovery and booking through technician assignment, job completion, payments, subscriptions, notifications, and administration.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.11 (Turbopack) |
| React | 19.2.4 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui + Base UI |
| Animation | Motion / Framer Motion |
| Icons | Lucide React |
| Database | MySQL 8.x |
| ORM | Prisma 7.9.0 |
| Database Adapter | Prisma MariaDB adapter |
| Authentication | Phone + Password |
| Password Hashing | bcryptjs |
| Session | httpOnly session cookie |
| Notifications | Database-backed notification system |
| Toast | Sonner |
| Package Manager | npm |

## Features

### Customer Portal

- Public home page
- Featured services
- Service categories
- Quick services
- Offers
- Testimonials
- Service listing
- Service detail pages
- Service variants
- Centralized service images
- Cart system
- Booking creation
- Booking history
- Booking detail pages
- Booking status tracking
- Invoice management
- Notifications
- Subscription plans
- Manual payment flow
- Bank payment support
- GPay payment support
- GPay QR payment support
- Payment reference / UTR submission
- Customer profile
- Customer settings
- About page
- Contact page
- Mission page
- Privacy page
- Terms page

### Admin Portal

- Dashboard with operational statistics
- Customer management
- Technician management
- Service management
- Booking management
- Admin booking creation
- Technician assignment and reassignment
- Payment management
- Subscription management
- Subscription payment verification
- Subscription rejection
- Service active/inactive management
- Service price management
- Recent activity and dashboard statistics
- Admin profile
- Admin settings

### Technician Portal

- Technician dashboard
- Assigned jobs
- Job details
- Job status workflow
- Start job
- Complete job
- Availability management
- Earnings
- Pending payout information
- Notifications
- Technician profile
- Technician settings

## Authentication & Authorization

- Phone + password registration and login
- Passwords hashed with bcryptjs
- Session authentication using an httpOnly cookie
- Role-based access control
- Supported roles:
  - Admin
  - Customer
  - Technician
- Protected Admin, Customer, and Technician portal routes
- Sign-in redirect based on user role
- Original requested destination can be preserved through the sign-in flow
- Server-side API routes validate authenticated users and their roles

Portal access is organized as:

```text
/admin/*       -> Admin
/customer/*    -> Customer
/technician/*  -> Technician
```

## Service Management

Services are managed through the database and API.

Service functionality includes:

- Service name
- Description
- Price
- Active/inactive status
- Category
- Service image
- Service variants
- Customer-facing service pages
- Admin service management

Administrators can control whether services are active and visible to customers.

Service images are centralized so the same service image mapping can be reused across different parts of the application.

Important service-related files include:

```text
src/lib/service-images.ts
src/app/customer/services/
src/app/api/services/
src/app/api/customer/services/
```

## Cart System

Customers can add services to the cart before creating a booking.

The cart workflow supports:

- Add service
- Remove service
- Change selected services
- Review selected services
- Continue to booking
- Calculate booking totals from selected services

The cart uses the application's context-based state management and connects to the customer booking workflow.

## Booking System

The booking system connects customers, services, technicians, payments, and administrators.

Typical workflow:

```text
Browse Services
      |
      v
Select Service
      |
      v
Add to Cart
      |
      v
Review Cart
      |
      v
Select Date / Time
      |
      v
Enter Address
      |
      v
Add Notes
      |
      v
Create Booking
      |
      v
Payment / Payment Information
      |
      v
Booking Created
      |
      v
Admin Review
      |
      v
Technician Assignment
      |
      v
Technician Job Workflow
```

Booking records include information such as:

- Customer
- Technician
- Service
- Booking status
- Scheduled date
- Scheduled time
- Address
- Notes
- Total amount
- Payment status
- Created date
- Updated date

## Technician Job Workflow

After a booking is created, the administrator can assign a technician.

The technician can then manage the assigned job.

Typical workflow:

```text
Customer Creates Booking
          |
          v
Admin Reviews Booking
          |
          v
Admin Assigns Technician
          |
          v
Technician Receives Notification
          |
          v
Technician Views Job
          |
          v
Technician Starts Job
          |
          v
Job In Progress
          |
          v
Technician Completes Job
          |
          v
Booking Completed
```

The booking and technician status changes are stored in the database.

## Payments

### Current Payment System

Razorpay has been removed from the current Ziffix implementation.

The current application uses a manual payment workflow.

Supported configured payment methods include:

- Bank transfer
- GPay
- GPay QR

Customers can submit a payment reference / UTR for administrative verification.

Payment-related information is stored in the application's database and can be reviewed by administrators.

The current project does not require Razorpay API keys.

### Payment Flow

```text
Customer
   |
   v
Booking / Subscription Payment
   |
   +----> Bank Transfer
   |
   +----> GPay
   |
   +----> GPay QR
   |
   v
Payment Reference / UTR
   |
   v
Pending Verification
   |
   v
Admin Review
```

## Subscription Plans

Ziffix supports customer subscription plans.

The current customer subscription interface includes plans such as:

- Free
- Starter
- Pro

The exact subscription amount can be configured by the application and should be checked from the current subscription configuration/UI.

Subscription information includes:

- Subscription ID
- Customer
- Plan
- Amount
- Status
- Payment method
- Payment reference
- Start date
- End date
- Verification date
- Created date
- Updated date

## Subscription Payment Workflow

```text
Customer
   |
   v
Subscription Plans
   |
   v
Select Plan
   |
   v
Manual Payment
   |
   +----> Bank
   +----> GPay
   +----> GPay QR
   |
   v
Enter Payment Reference / UTR
   |
   v
Submit Subscription Payment
   |
   v
Pending
   |
   v
Admin Reviews Payment
   |
   +------------+
   |            |
   v            v
 Verify       Reject
   |            |
   v            v
 Active       Rejected
```

After successful verification, the subscription can become active and receive its applicable start and end dates.

The customer can receive a notification when the subscription is verified or rejected.

## Notifications

The application contains a database-backed notification system.

Notifications can be generated for events such as:

- Technician assignment
- Booking updates
- Subscription verification
- Subscription rejection
- Other service workflow events

Notifications include:

- User
- Title
- Message
- Type
- Read/unread status
- Creation date

## Customer Invoices

The customer portal contains an invoice area for viewing invoice-related information associated with customer bookings.

Invoice functionality is connected to the customer's booking/payment information.

## Database

Ziffix uses MySQL as its primary database.

Prisma is used as the ORM and database access layer.

Important database files:

```text
prisma/schema.prisma
prisma.config.ts
prisma/migrations/
prisma/seed.ts
```

The application currently uses Prisma 7.9.0.

## Prisma

Generate Prisma Client:

```bash
npx prisma generate
```

Synchronize the development database with the Prisma schema:

```bash
npx prisma db push
```

Open Prisma Studio:

```bash
npx prisma studio
```

For projects using the migration history, migrations are stored under:

```text
prisma/migrations/
```

Do not use destructive database reset commands against a production database.

## Getting Started

### Prerequisites

- Node.js 18+
- Node.js 20+ recommended
- npm
- MySQL 8.x
- Git

For Windows development, PowerShell can be used for the commands below.

Check Node.js:

```powershell
node -v
```

Check npm:

```powershell
npm -v
```

Check MySQL:

```powershell
mysql --version
```

## 1. Install Dependencies

Install the project dependencies:

```powershell
npm install
```

## 2. Set Up MySQL

Make sure MySQL is installed and running.

Create the Ziffix database:

```sql
CREATE DATABASE Ziffix;
```

Or open the MySQL client:

```powershell
mysql -u root -p
```

Then run:

```sql
CREATE DATABASE Ziffix;
```

Use your own MySQL username and password.

## 3. Configure Environment Variables

Create a `.env` file in the project root.

Example:

```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/Ziffix"
```

The actual username, password, host, port, and database name depend on your local MySQL configuration.

Do not commit `.env` to source control.

## 4. Generate Prisma Client

Run:

```powershell
npx prisma generate
```

## 5. Set Up the Database

For a development database:

```powershell
npx prisma db push
```

If migrations are required for the environment, apply the appropriate Prisma migrations instead.

## 6. Start the Development Server

Run:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

The primary environment variable currently required is:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | MySQL connection string | `mysql://root:password@localhost:3306/Ziffix` |

Do not place real passwords or production credentials in this README.

Do not add old Razorpay variables unless Razorpay is intentionally reintroduced into the project.

## Project Structure

```text
Ziffix/
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── prisma.config.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   ├── data/
│   └── migrations/
│
├── public/
│   └── images/
│
├── scripts/
│   ├── seed-admin.js
│   ├── seed-service-variants.js
│   └── check-service-variants.cjs
│
└── src/
    ├── app/
    │   ├── admin/
    │   │   ├── bookings/
    │   │   ├── customers/
    │   │   ├── dashboard/
    │   │   ├── payments/
    │   │   ├── services/
    │   │   ├── settings/
    │   │   ├── subscriptions/
    │   │   └── technicians/
    │   │
    │   ├── api/
    │   │   ├── admin/
    │   │   ├── customer/
    │   │   ├── services/
    │   │   └── technician/
    │   │
    │   ├── customer/
    │   │   ├── booking/
    │   │   ├── bookings/
    │   │   ├── cart/
    │   │   ├── invoices/
    │   │   ├── notifications/
    │   │   ├── payment/
    │   │   ├── services/
    │   │   ├── settings/
    │   │   └── subscriptions/
    │   │
    │   ├── technician/
    │   │   ├── availability/
    │   │   ├── dashboard/
    │   │   ├── earnings/
    │   │   ├── jobs/
    │   │   └── notifications/
    │   │
    │   ├── about/
    │   ├── contact/
    │   ├── mission/
    │   ├── privacy/
    │   ├── terms/
    │   ├── sign-in/
    │   ├── sign-up/
    │   ├── layout.tsx
    │   └── page.tsx
    │
    ├── components/
    │   ├── customer/
    │   ├── shared/
    │   └── ui/
    │
    ├── context/
    │   ├── auth-context.tsx
    │   ├── cart-context.tsx
    │   └── service-context.tsx
    │
    ├── data/
    ├── lib/
    │   ├── constants.ts
    │   ├── payment-details.ts
    │   ├── prisma.ts
    │   ├── service-images.ts
    │   ├── technician-auth.ts
    │   └── utils.ts
    │
    ├── types/
    └── proxy.ts
```

## Default Test Accounts

| Phone | Password | Role |
|---|---|---|
| `9677192579` | `admin123` | Admin |
| `8888888888` | `customer1` | Customer |
| `2222222222` | `technician2` | Technician |

**Note:** New accounts can be created through the Sign Up page. Administrators can also manage users through the Admin portal. The first registered user becomes an administrator when the application is configured with that initial-user behavior.

## Seed Data

The project contains seed-related files:

```text
prisma/seed.ts
scripts/seed-admin.js
scripts/seed-service-variants.js
scripts/check-service-variants.cjs
```

Review the seed files before running them against an existing database.

Do not use seed/reset operations against production unless they are specifically designed for the production environment.

## API Areas

The application contains API routes for major platform operations.

Main API areas include:

```text
src/app/api/auth/
src/app/api/admin/
src/app/api/customer/
src/app/api/services/
src/app/api/technician/
```

These APIs support authentication, customers, services, bookings, technicians, payments, subscriptions, notifications, and other application workflows.

## Available Scripts

```bash
npm run dev      # Start development server with Next.js/Turbopack
npm run build    # Create production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

Additional development checks:

```bash
npx tsc --noEmit
npx prisma generate
npx prisma db push
npx prisma studio
```

## Production Build

Before running a production build:

```bash
npm install
npx prisma generate
npx tsc --noEmit
npm run lint
npm run build
```

Start the production application:

```bash
npm start
```

Production deployment requires:

- Production MySQL database
- Production environment variables
- Generated Prisma Client
- Correct database schema/migrations
- Secure authentication configuration
- HTTPS

## Security

- Never commit `.env`.
- Never publish database passwords.
- Never publish production secrets.
- Never expose private API keys in client-side code.
- Use strong administrator passwords.
- Use HTTPS in production.
- Keep database credentials server-side.
- Review seed scripts before production use.
- If a secret is accidentally exposed, rotate/revoke it immediately.

## Troubleshooting

### Prisma: No database URL found

Check that `.env` exists in the project root and contains:

```env
DATABASE_URL="mysql://..."
```

Restart the development server after changing environment variables.

### Prisma Client Errors

Run:

```powershell
npx prisma generate
```

Then restart:

```powershell
npm run dev
```

### Database Connection Errors

Verify:

1. MySQL is running.
2. The database exists.
3. The username is correct.
4. The password is correct.
5. The host is correct.
6. The port is correct.
7. `DATABASE_URL` is correct.

### TypeScript Errors

Run:

```powershell
npx tsc --noEmit
```

Fix the reported source errors before creating the production build.

### Build Errors

Run:

```powershell
npm run build
```

Fix the first reported error and run the build again.

## Current Project Status

The current Ziffix project includes:

### Customer

- Public home experience
- Service browsing
- Service detail pages
- Service variants
- Service image management
- Cart workflow
- Booking workflow
- Booking details
- Booking history
- Invoice area
- Subscription workflow
- Manual payment workflow
- Payment reference / UTR submission
- Notifications
- Profile and settings
- Informational pages

### Technician

- Technician authentication
- Technician dashboard
- Assigned jobs
- Job status workflow
- Availability management
- Earnings
- Pending payout information
- Notifications
- Profile and settings

### Admin

- Admin dashboard
- Customer management
- Technician management
- Service management
- Booking management
- Admin booking creation
- Technician assignment
- Payment management
- Subscription management
- Subscription verification/rejection
- Statistics
- Settings

### Backend

- Next.js API routes
- Prisma ORM
- MySQL database
- Role-based authentication
- Session-based access control
- Database-backed bookings
- Database-backed subscriptions
- Database-backed notifications
- Customer APIs
- Admin APIs
- Technician APIs
- Service APIs

### Payment Architecture

The current payment architecture is manual.

Razorpay has been removed from the current implementation.

Current payment methods include configured:

- Bank payment
- GPay
- GPay QR

Customers can submit payment references/UTRs for administrative verification.

## License

Private — All rights reserved.
