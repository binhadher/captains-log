# 🖖 Captain's Log

Boat maintenance and document management system.

## Features

- 🚤 Multi-boat support
- 📋 Comprehensive maintenance logging
- 📄 Document storage with expiry alerts
- 🔧 Service provider directory
- 🤖 AI assistant for natural language queries
- 📱 PWA with offline support

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** PostgreSQL (Supabase)
- **Auth:** Clerk
- **Storage:** Cloudflare R2
- **AI:** Claude API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Clerk account

### Setup

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```

4. Set up the database:
   - Create a new Supabase project
   - Run `supabase/schema.sql` in the SQL Editor

5. Configure Clerk:
   - Create a new Clerk application
   - Enable Google OAuth (optional)
   - Add your keys to `.env.local`

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Auth pages (sign-in, sign-up)
│   ├── (dashboard)/    # Protected dashboard pages
│   │   └── boats/      # Boat management
│   └── api/            # API routes
├── components/
│   ├── ui/             # Reusable UI components
│   ├── boats/          # Boat-related components
│   ├── logs/           # Log entry components
│   ├── documents/      # Document components
│   └── services/       # Service provider components
├── lib/                # Utilities and clients
├── hooks/              # Custom React hooks
└── types/              # TypeScript types
```

## Development Phases

- [x] **Phase 1:** Core MVP (auth, boats, logs, documents, basic UI)
- [ ] **Phase 2:** Enhanced (hours tracking, admin panel, dashboard)
- [ ] **Phase 3:** AI Assistant (natural language queries, Telegram bot)
- [ ] **Phase 4:** Expansion (crew, sharing, analytics)

---

*Captain's Log, stardate 2026... 🖖*
