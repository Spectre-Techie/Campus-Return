# Local Lost & Found Campus

Local Lost & Found is a campus-focused web app to post found items and search for lost belongings using location and category filters.

## Current Implementation Status

Implemented now:
- Clerk authentication (client + server middleware + webhook user sync)
- Item posting flow with Cloudinary upload
- Item feed search (query/category/location/time filters)
- Item detail page and owner delete action
- Campus config endpoint and static campus map data

Not implemented yet:
- Claim lifecycle endpoints and UI workflow
- Messaging between finder and claimant
- Notifications and real-time Socket.io events
- Admin dashboard and moderation tools

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Express 5, TypeScript, Prisma ORM
- Database: PostgreSQL
- Auth: Clerk
- Media storage: Cloudinary

## Repository Layout

```
client/  Next.js app
server/  Express API + Prisma schema
```

## Quick Start

Prerequisites:
- Node.js 22+
- pnpm 10+
- PostgreSQL database URL (Supabase is fine)
- Clerk project
- Cloudinary project

1. Install dependencies:

```bash
cd client
pnpm install
cd ../server
pnpm install
```

2. Configure environment variables using values from .env.example.

3. Push Prisma schema:

```bash
cd server
pnpm db:push
```

4. Start both apps in separate terminals:

```bash
cd client
pnpm dev
```

```bash
cd server
pnpm dev
```

5. Open http://localhost:3000.

## Security and Stability (Immediate)

1. Supabase RLS alert (`rls_disabled_in_public`):
Run [server/prisma/supabase-rls-hardening.sql](server/prisma/supabase-rls-hardening.sql) in Supabase SQL Editor for this project.

2. Frontend dev memory crashes (`heap out of memory`):
The default client dev command is now webpack-based for lower memory pressure.

Use:

```bash
cd client
pnpm dev
```

Optional lower-memory mode on Windows:

```bash
cd client
pnpm dev:mem
```

## API Surface (Current)

Public:
- GET /health
- GET /api/config/buildings
- GET /api/items/search
- GET /api/items/:id

Protected (Clerk):
- POST /api/items
- DELETE /api/items/:id
- POST /api/webhooks/clerk (Clerk webhook)

## Execution Direction

The project is currently following the "keep Clerk for MVP" path to reduce delivery risk.

Next milestone sequence:
1. Add claims backend + claim modal/review flow
2. Add messaging + notifications (polling first, Socket.io next)
3. Add real-time events, expiry cleanup, and admin essentials
