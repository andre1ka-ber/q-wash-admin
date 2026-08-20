# q-wash-admin — Plan

Source design: Claude Design project "Car wash queue app"
(`Car Wash Web Apps.dc.html`), the "Админ" tab, imported 2026-08-20.
Backend: `../q-wash-api`, extended per
`../q-wash-api/docs/PLAN_WEB_APPS.md` — this app is blocked on that plan's
phases 1–3 (migrations, owners, admin washing-point extensions) before any
screen beyond the static shell can show real data.

Network-wide operator console — the one role that sees across every
washing point, not scoped to one. Replaces the throwaway
`pegasus-frontend`/`pegasus-board` test harnesses' admin bits with a real
product.

## What the design actually is

A dark/gold-themed dashboard, sidebar + content layout:

- **Sidebar**: logo/name, nav (Мойки [washing points, active by default] ·
  Владельцы [owners] · Услуги-справочник [services catalog] · Записи
  [bookings] · Аналитика [analytics] · Настройки [settings]), a
  "Заявки на подключение" (connection requests) counter card pinned to the
  bottom.
- **Мойки (washing points) — the only screen actually drawn in the mock**:
  a header with search + "+ Новая мойка" button, 4 stat cards (points in
  network, bookings today, average utilization, cancellations — each with
  a delta), then a table of points (name/owner, address, boxes, services
  count, hours, status pill, overflow menu).
- **"+ Новая мойка" wizard**: a right-side drawer, step 1 of 3 ("Основное")
  shown — name/owner/phone/address text fields, a map-placeholder point
  picker, a box-count chip selector (2/3/4/5+). Steps 2–3 ("Услуги" and
  whatever follows) aren't drawn in the mock at all — only referenced by
  the "Далее · Услуги" button label.
- Every other nav item (Владельцы, Услуги-справочник, Записи, Аналитика,
  Настройки) is a **label only** — no screen behind it in the mock. This
  app's own design work (not just backend wiring) is needed for those five
  before they're real.

## Decisions locked in (with the user)

- **Framework**: Vite + React + TypeScript, matching the other 3 web apps.
- **Shared package**: depends on `../q-wash-shared` (theme, API client,
  auth, common components) via a `file:` dependency — see its `PLAN.md`.
  Not a workspace; this stays a fully separate top-level project.
- **Fidelity**: port the visual design closely (colors, Prata/Manrope
  pairing, the 1440×900 dashboard layout, rounded-card language) — same
  bar q-wash (mobile) held itself to.
- **Auth**: username + password via `POST /auth/login`, `admin` role only
  — same login pegasus-board/pegasus-frontend already use, no new
  mechanism (see `q-wash-api/docs/PLAN_WEB_APPS.md`, User section).
- **Scope for the 5 undrawn nav items**: build real screens for them (this
  app owns their design, not just their wiring) once the corresponding
  backend phase exists — no placeholder/"coming soon" screens shipped as
  final; each gets its own mini design pass, described per-screen in
  `PROGRESS.md` as it happens rather than speculatively detailed here.
- **New-point wizard step 2 ("Услуги") and step 3**: not in the mock —
  step 2 almost certainly reuses the same service+price-option CRUD the
  cabinet app has; step 3 is unknown (confirm/review screen is the likely
  guess, matching a typical 3-step wizard shape, but flag with the user
  before building it rather than inventing a step).

## Backend dependency

Everything on this screen needs `q-wash-api/docs/PLAN_WEB_APPS.md`
phases 1–3 (`Owner`, `ConnectionRequest`, `WashingPoint.owner_id`/`status`/
`description`/`amenities`, `GET /admin/washing-points`, `GET /admin/stats`,
`GET /queue` network filter) before it can run against real data.

**Update 2026-08-20**: phases 1–3 shipped the same day this plan was
written, before phase C below started — built directly against the real
endpoints instead of the originally-planned mock-data step (confirmed with
the user; phases C and E below are merged as a result). One real gap this
surfaced: `AdminWashingPoint` has no open/close-hours field (the schedule
now lives per-weekday, no network-wide summary endpoint exists yet), so
the mock's "Часы" table column is dropped rather than faked — revisit if a
schedule summary ever gets added to that endpoint. Also dropped: the stat
cards' delta chips (`AdminStats` has no historical/comparison figures to
back them) and the sidebar's "Заявки на подключение" counter card (real
count needs its own api module, deferred to phase G alongside the actual
screen — showing a fake number was rejected as worse than not showing one).

## App architecture

```
q-wash-admin/
  PLAN.md
  PROGRESS.md
  package.json          depends on q-wash-shared via file:../q-wash-shared
  vite.config.ts
  src/
    main.tsx
    App.tsx               router root, auth gate
    theme/                 re-exports q-wash-shared's tokens, app-specific
                            layout constants (sidebar width, header height)
    api/                    q-wash-admin-specific resource calls layered on
                            q-wash-shared's client (owners, admin stats,
                            connection requests) — thin, most calls go
                            straight through the shared client
    features/
      auth/                 login screen
      points/                the one real screen: stat cards + table +
                             search, "+ Новая мойка" wizard drawer
      owners/                 (built once q-wash-api phase 2 lands)
      services-catalog/       (deferred — see PLAN_WEB_APPS.md "Deferred")
      bookings/                (built once the network-wide queue filter lands)
      analytics/               (built once GET /admin/stats lands)
      settings/                (scope not yet defined — grill before building)
      connection-requests/    (built once q-wash-api phase 2 lands)
    shared/
      layout/                Sidebar, Header shell specific to this app's
                             dashboard chrome (not generic enough for
                             q-wash-shared)
```

- **Routing**: `react-router`, a single authenticated shell route (sidebar
  + outlet) wrapping all nav items, redirect-to-login when unauthenticated.
- **Data/server-state**: `@tanstack/react-query` over `q-wash-shared`'s API
  client — mutations for wizard steps, queries for the points table/stats
  with a reasonable `staleTime` (this is a console someone stares at
  during a shift, not a one-shot form).
- **Localization**: Russian only, matching the mock — same call q-wash
  (mobile) made, no i18n framework.

## Phased build order

- [x] **A — Scaffold**: Vite react-ts, `q-wash-shared` wired in, theme
      applied, empty sidebar shell routed.
- [x] **B — Auth**: login screen, token storage/refresh via
      `q-wash-shared/auth`.
- [x] **C — Мойки screen, wired to real `q-wash-api`** (merged with E
      below; see "Update 2026-08-20" above): stat cards, points table,
      client-side search — against real `GET /admin/washing-points` /
      `GET /admin/stats`, pixel-matching the `.dc.html` prototype where the
      real data model allows.
- [x] **D — "+ Новая мойка" wizard, step 1**: drawer UI, controlled form
      fields + box-count chip selector — but UI-only, neither button
      submits. Step 1 alone doesn't map to `WashingPointCreate` cleanly
      (its "Телефон" field is an owner/connection-request concept, not a
      washing-point field; "Владелец" needs a real owner picker, which is
      phase F). Steps 2–3 still blocked on grilling their actual content
      with the user.
- [ ] **E — Wire the wizard to real creation**: once owner picking (phase
      F) and step 2/3's actual content are settled, make the wizard submit
      for real.
- [ ] **F — Owners screen**: design + build, once phase 2 ships.
- [ ] **G — Connection requests screen**: design + build, once phase 2
      ships (this is what the sidebar counter links to).
- [ ] **H — Bookings screen**: design + build, once the network-wide queue
      filter ships.
- [ ] **I — Analytics screen**: design + build, once `GET /admin/stats`
      (or a richer successor) ships — the 4 stat cards on the Мойки screen
      are a preview of this, not the real thing.
- [ ] **J — Settings screen**: scope undefined — grill with the user before
      starting.
- [ ] **K — Services catalog**: deferred indefinitely per
      `q-wash-api/docs/PLAN_WEB_APPS.md`'s "Deferred" note; revisit only
      if per-point service CRUD in the cabinet app turns out insufficient.

Progress against this list, decisions made along the way, and anything
discovered that changes the plan are logged in `PROGRESS.md` as work
happens.
