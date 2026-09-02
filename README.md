# q-wash-admin

Network-wide operator console for the Q-Wash platform — the one role that
sees across every washing point, not scoped to one. Manages washing
points, owners, connection-request onboarding, and network-wide bookings/
analytics. Talks only to `q-wash-api` over its documented HTTP API, via
`q-wash-shared`'s API client — no direct DB access, no private endpoints.

Design and scope decisions live in `PLAN.md`; the phase-by-phase
implementation log lives in `PROGRESS.md`. Both are the source of truth
for this app's internals — this file is just how to run it.

## Stack

Vite + React 19.2 + TypeScript, `react-router-dom` v7, `@tanstack/react-query`
v5, `leaflet`/`react-leaflet` (washing-point location picker map). Depends
on `../q-wash-shared` via a `file:` dependency for theme tokens, the API
client, auth, and common components — not a workspace, this stays a fully
separate top-level project. Vitest + React Testing Library for tests,
oxlint for linting.

## Getting started

```bash
npm install
npm run dev      # needs a running q-wash-api
npm run build    # tsc -b && vite build
```

Log in with an `admin`-role account (username + password via
`POST /auth/login` — see `q-wash-api/README.md` for seeded dev accounts).

## Testing

```bash
npm test          # vitest run
npm run lint       # oxlint
npx tsc -b         # typecheck
```

## Structure

```
src/
  main.tsx, App.tsx      router root, auth gate
  theme/                  re-exports q-wash-shared's tokens + this app's
                          layout constants (sidebar width, header height)
  features/
    auth/                 login screen
    points/                stat cards + table + search, "+ Новая мойка"
                           wizard drawer, Leaflet location picker
    owners/                 owners CRUD screen
    connection-requests/    onboarding request review/approve/reject
    bookings/                network-wide live-queue table
    analytics/               stats cards + per-point live table
  shared/
    layout/                Sidebar/Header shell specific to this app
```

Resource-specific API calls (owners, admin stats, connection requests,
washing points) live in `../q-wash-shared/src/api/`, not locally — see
that package's own README.

## Status

Phases A–J are done and real-backend-verified (Мойки, wizard, owners,
connection requests, bookings, analytics, auth, logout). Phase K
(Услуги-справочник / services catalog) is deferred indefinitely — see
`PLAN.md`'s phase K note. A Vitest + React Testing Library suite (31
tests, added 2026-08-31) covers `shared/pluralRu.ts` and the drawer/page
components listed under Testing above; `LocationPicker.tsx` is
deliberately out of scope (pure Leaflet passthrough, no branching logic).
