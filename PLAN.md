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

**Update 2026-08-22**: built phase F, the Owners screen — not in the mock
at all, so designed from scratch to match the Мойки screen's own layout
language (header + search + primary button, `DataTable`). List (`GET
/owners`), create and edit (`POST`/`PATCH /owners/{id}`) all wired to the
real endpoints via a new `q-wash-shared` `api/owners.ts` module; clicking a
row opens the same drawer pre-filled, in edit mode. No owner-deletion
endpoint exists in `openapi.yaml`, so none is offered. This unblocks half
of phase E (owner picking) — the wizard's map-placeholder step still needs
real lat/lng before it can submit.

Same session, also built phases G and H:

- **G — Connection requests**: not in the mock either, same "match the
  Мойки screen's language" call as phase F. Status tabs (Новые/
  Одобренные/Отклонённые/Все) over a table; `new` rows get inline
  Одобрить/Отклонить buttons (`PATCH /connection-requests/{id}`), other
  statuses just show their pill. "+ Новая заявка" opens a create drawer
  (`POST /connection-requests`) — the API restricts creation to role
  admin too ("admin-created for now, no public self-service apply form
  yet"), so this is the only way one enters the system right now, matching
  the spec's own framing. Approving auto-creates an `Owner` + a
  `pending_review` `WashingPoint` with placeholder `0,0` coordinates
  server-side (see `openapi.yaml`'s `reviewConnectionRequest` description)
  — nothing else to do on this screen for that, but it's a real gap that
  the resulting point then needs its coordinates set before it can go
  live, and `PointsPage` has no edit action yet (its `⋯` column is still
  inert). Also wired the sidebar's "Заявки на подключение" counter card
  (dropped in the 2026-08-20 update) to a real `GET
  /connection-requests?status=new` count — the gap that blocked it is
  closed now that this screen's api module exists.
- **H — Bookings**: real gap found while planning this one, worth flagging
  explicitly: `GET /queue` network-wide (no `washing_point_id`) returns
  `BoardItem` rows with **no `washing_point_id` field at all**
  (`boardItemResponse` in `q-wash-api/internal/queue/handler.go` — checked
  the actual Go code, not just `openapi.yaml`, since the two could've
  drifted) — so a single "all points" request can't be attributed back to
  a point. Worked around without touching the backend contract (that needs
  approval per this app's boundaries doc): fetch each active/paused
  point's own board via `GET /queue?washing_point_id={id}` in parallel
  (`useQueries`, one query per point from the already-loaded
  `admin/washing-points` list) and tag each item with that point's id/name
  client-side before merging into one sorted table. N+1 requests instead
  of one, but real data, no backend change, no fake attribution. Rows
  refetch every 20s (`refetchInterval`) since this is a shift-monitoring
  screen. Added `PATCH /queue/{id}/status` wiring too (`admin` owns every
  washing point per `reqctx.AuthUser.OwnsWashingPoint`, confirmed in code)
  so a row's status can be advanced from the table
  (очередь→ожидание→мойка→готово removes it from the live board, matching
  `ListLive`'s active-only filter). No cancel action — `PATCH
  /queue/{id}/cancel` is owner-only in the actual handler
  (`manager.CancelBooking` calls `FindOwnedByID`), not broadened to
  staff/admin yet — `PLAN_WEB_APPS.md` phase 7 ("Worker role") is where
  that's planned, and phase 7 is still unstarted, so this isn't a
  docs/code mismatch, just a not-yet-built RBAC change.

Same session, also built phase I:

- **I — Analytics**: checked `internal/admin/handler.go`'s actual `stats`
  handler — `GET /admin/stats` really is network-wide-only (no per-point
  breakdown endpoint exists anywhere), so a screen built from it alone
  would just repeat the Мойки screen's 4 cards. Made it a real
  differentiator instead of a duplicate: the same `AdminStats` fields
  (now including `points_active` and two client-computed derived rates —
  active-point ratio, cancellation rate — both `null`-safe against
  divide-by-zero) as bigger/more prominent cards, plus a per-point table
  (boxes/services/status from `GET /admin/washing-points`, already
  cached) with a live "в очереди сейчас" column reusing the exact
  per-point `GET /queue?washing_point_id=` fetch (and query key) that
  `BookingsPage` uses — real current data, not a fabricated "today"
  breakdown, and if both screens are open the two share one cache entry
  per point instead of double-polling.

**Update 2026-08-22 (later, same day)**: grilled phase E's two remaining
blockers with the user directly (own message thread) rather than guessing:

- **Coordinates**: no map library exists anywhere in the platform (checked
  `q-wash`'s `pubspec.yaml` too — nothing there). Asked plain lat/lng
  number inputs vs. a real interactive map; user chose the real map —
  **Leaflet + `react-leaflet`, CARTO's keyless dark-tile basemap**
  (`https://{s}.basemaps.cartocdn.com/dark_all/...`, attribution shown
  inline under the map, no API key/billing). New dependency, approved by
  the user in that same answer. `react-leaflet@5` resolved cleanly against
  this app's React 19.2 with no peer-dep overrides needed.
- **Wizard scope**: step 2 ("Услуги") was always going to reuse
  `q-wash-cabinet`'s service CRUD — but `q-wash-cabinet` isn't built yet
  (still "Planned", not scaffolded), so there's nothing to reuse and
  nothing to point step 2 at. Asked whether to collapse to one real step
  or build a standalone step-2 service form now; user chose **collapse to
  one step** — dropped the "3-step wizard" framing entirely. `NewPointDrawer`
  now submits directly via `POST /washing-points` (new
  `q-wash-shared` `api/washingPoints.ts` — `createWashingPoint`, plus a
  `WashingPoint` type matching the full response schema). Services get
  added once a real service-CRUD screen exists somewhere (cabinet app or a
  dedicated admin screen) — not invented here.

Rebuilt `NewPointDrawer` for real: Название/Адрес (required text),
Владелец (a real `<select>` sourced from `listOwners()` — phase F's api
module, now actually consumed), a `LocationPicker` component (click or
drag-marker on the map, gold `divIcon` matching the theme instead of
Leaflet's default marker asset, coordinate readout below), Боксы (a real
number input, replacing the old mock's "2/3/4/5+" chip selector — "5+"
never mapped to a real integer `boxes_count`, so it was dropped rather
than kept as decorative-but-wrong), Открытие/Закрытие (`<input
type="time">`, defaulting to `WashingPointCreate`'s own `08:00`/`20:00`
defaults), Статус (`active`/`paused`/`pending_review` select, defaulting
to `active` since this is an admin directly creating a ready point, not
the connection-request path which defaults to `pending_review`
server-side).

**Verification**: real end-to-end, not just typechecked — the user ran
`q-wash-api` locally, `claude-in-chrome` connected, logged in, opened the
wizard, clicked the real Dushanbe-centered map to place a marker, filled
the form, submitted. New point appeared on Мойки immediately (cache
invalidation confirmed), stat cards updated with correct plural forms.
Cross-checked directly against the API (`GET /washing-points`) that the
persisted `latitude`/`longitude` matched the map's on-screen coordinate
readout exactly, and `open_time`/`close_time` persisted as `"08:00"`/
`"20:00"` despite the native time input displaying as 12-hour "08:00 AM"
in this browser's locale (a display-only quirk — the underlying value is
always 24h "HH:MM", not something worth working around given the
no-i18n-framework decision).

**One real bug found and fixed during this verification pass**: the
Боксы/Открытие/Закрытие row overflowed horizontally (visible scrollbar)
— three `flex:1` children with native `<input type="number">`/`type="time"`
elements whose intrinsic content width exceeds `flex-basis` under the
default `min-width:auto` flex behavior. Fixed with `minWidth: 0` on each
column plus explicit `width: '100%'` on the inputs; reverified in-browser,
no more overflow.

**Update 2026-08-22 (evening)**: grilled phase J's scope. Checked the API
for what a "Settings" screen could actually contain — no network-wide
config entity exists anywhere in `q-wash-api` (timezone, business name,
etc. are all hardcoded backend constants), and there's no staff/admin
user-management CRUD. The only real capability is `PATCH /me` (display
name) plus whatever `GET /me` returns. Asked the user whether to build a
minimal profile screen around that, or something smaller; they picked
smaller — while investigating this, found a genuine, unrelated gap:
**there was no logout affordance anywhere in the built app.** User chose
to fix just that (a Logout action in the sidebar) and leave "Настройки"
itself inert for now, rather than build a profile screen around one
editable field. Added a small ⎋ icon-button next to "Queue Admin" in
`Sidebar.tsx`'s header row, calling `authStore.logout()` (already existed
in `q-wash-shared`, just had no caller). Verified end-to-end: clicked it,
redirected to `/login`; navigated straight back to `/` afterward to
confirm the tokens were actually cleared (not just a stale in-memory
redirect) — correctly bounced back to `/login`. Phase J closed on that
scope; a real profile/settings screen can be built later if `q-wash-api`
ever grows account-editing beyond the display name, or network-wide
config beyond hardcoded constants — nothing to build against today.

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
- [x] **E — Wire the wizard to real creation**: design + build — see
      "Update 2026-08-22" below (grilled with the user: collapsed to one
      step, added a real Leaflet map picker).
- [x] **F — Owners screen**: design + build. No mock exists for this
      screen (this app owns its own design here, per "Scope for the 5
      undrawn nav items" above) — see "Update 2026-08-22" below.
- [x] **G — Connection requests screen**: design + build — see "Update
      2026-08-22" below. This is what the sidebar counter links to.
- [x] **H — Bookings screen**: design + build — see "Update 2026-08-22"
      below.
- [x] **I — Analytics screen**: design + build — see "Update 2026-08-22"
      below.
- [x] **J — Settings**: grilled with the user, scope turned out much
      smaller than "a screen" — see "Update 2026-08-22 (evening)" below.
- [ ] **K — Services catalog**: deferred indefinitely per
      `q-wash-api/docs/PLAN_WEB_APPS.md`'s "Deferred" note; revisit only
      if per-point service CRUD in the cabinet app turns out insufficient.

Progress against this list, decisions made along the way, and anything
discovered that changes the plan are logged in `PROGRESS.md` as work
happens.
