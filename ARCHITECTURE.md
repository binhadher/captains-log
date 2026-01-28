# Captain's Log - Architecture & Source Code Guide

## Overview

Captain's Log is a boat maintenance management system built with modern web technologies. This document explains the codebase structure for developers and future maintenance.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (React) + TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Database | PostgreSQL via Supabase |
| File Storage | Supabase Storage |
| Authentication | Clerk (Google + Email) |
| Icons | Lucide React |

---

## Project Structure

```
captains-log/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (sign-in, sign-up)
│   │   ├── api/               # API Routes (backend)
│   │   │   ├── boats/         # Boat CRUD + sub-resources
│   │   │   ├── components/    # Component CRUD + logs
│   │   │   └── upload/        # File upload handler
│   │   ├── boats/[id]/        # Boat detail pages
│   │   │   └── components/[componentId]/  # Component detail
│   │   ├── layout.tsx         # Root layout with Clerk
│   │   ├── page.tsx           # Dashboard (boat list)
│   │   └── globals.css        # Global styles
│   │
│   ├── components/            # React Components
│   │   ├── alerts/           # Alert display components
│   │   ├── boats/            # Boat-related components
│   │   ├── health/           # Health check components
│   │   ├── maintenance/      # Maintenance logging components
│   │   ├── parts/            # Parts catalog components
│   │   └── ui/               # Reusable UI components (Button, FileUpload)
│   │
│   ├── lib/                  # Utilities & Helpers
│   │   ├── alerts.ts         # Alert calculation logic
│   │   ├── maintenance-items.ts  # Service types per component
│   │   ├── supabase.ts       # Supabase client
│   │   └── utils.ts          # Formatting helpers
│   │
│   ├── types/                # TypeScript Types
│   │   └── database.ts       # All data model types
│   │
│   └── middleware.ts         # Clerk auth middleware
│
├── supabase/
│   ├── schema.sql            # Original database schema
│   └── migrations/           # Incremental migrations
│       ├── 001_add_engine_fields.sql
│       ├── 002_boat_components.sql
│       ├── 003_maintenance_items.sql
│       ├── 004_document_uploads.sql
│       ├── 005_parts_catalog.sql
│       ├── 006_health_checks.sql
│       └── 007_service_intervals.sql
│
├── public/                   # Static assets
├── .env.local               # Environment variables (NOT in git)
├── .env.example             # Template for env vars
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript config
```

---

## Data Models

### Core Entities

```
USERS (synced from Clerk)
  └── BOATS (1:many)
        ├── BOAT_COMPONENTS (1:many) - engines, generator, AC, etc.
        │     ├── LOG_ENTRIES (1:many) - maintenance records
        │     │     └── DOCUMENTS (1:many) - photos/files per log
        │     ├── PARTS (1:many) - parts catalog
        │     └── Service Schedule (fields on component)
        ├── HEALTH_CHECKS (1:many) - quick operational logs
        ├── DOCUMENTS (1:many) - boat-level docs
        └── ALERTS (calculated from schedules & expiry dates)
```

### Component Types

| Category | Types |
|----------|-------|
| Propulsion | engine, generator, shaft, propeller |
| Systems | hydraulic, bow_thruster |
| HVAC | ac_chiller, ac_air_handler |

### Maintenance Items (per component type)

Defined in `src/lib/maintenance-items.ts`:
- **Engines/Generator:** Fuel Filters, Oil Filters, Air Filters, Water Separators, Impeller, Belts, Zincs, etc.
- **AC Chiller:** Chemical Cleaning, Sea Water Pump, Chiller Pump, etc.
- **Air Handlers:** Filter Cleaning, Coil Cleaning, Drain Cleaning, etc.

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/boats | List user's boats |
| POST | /api/boats | Create boat |
| GET | /api/boats/[id] | Get boat details |
| PUT | /api/boats/[id] | Update boat |
| DELETE | /api/boats/[id] | Delete boat |
| GET | /api/boats/[id]/components | List components |
| POST | /api/boats/[id]/components | Create component |
| PUT | /api/boats/[id]/components | Bulk create components |
| GET | /api/boats/[id]/parts | List parts |
| POST | /api/boats/[id]/parts | Create part |
| GET | /api/boats/[id]/health-checks | List health checks |
| POST | /api/boats/[id]/health-checks | Create health check |
| GET | /api/boats/[id]/alerts | Get calculated alerts |
| GET | /api/components/[id] | Get component with logs |
| PUT | /api/components/[id] | Update component |
| DELETE | /api/components/[id] | Delete component |
| POST | /api/components/[id]/logs | Create maintenance log |
| POST | /api/upload | Upload file to storage |

---

## Environment Variables

Required in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

---

## Running Locally

```bash
cd captains-log
npm install
npm run dev
# Open http://localhost:3000
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

---

## Future Enhancements

- [ ] Email/push notifications for alerts
- [ ] Crew accounts (share with captain)
- [ ] Service provider directory
- [ ] Cost reports & analytics
- [ ] Multi-boat dashboard view
- [ ] Mobile app (React Native)

---

*Built with ❤️ for boat owners who want to keep their vessels in top shape.*
