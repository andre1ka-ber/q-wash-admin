# Progress

See `PLAN.md` for the full plan and build order.

- [x] Phase A — Scaffold
- [x] Phase B — Auth
- [x] Phase C — Мойки screen, wired to real q-wash-api (merged with E)
- [x] Phase D — "+ Новая мойка" wizard, step 1 (UI only)
- [x] Phase E — Wire the wizard to real creation
- [x] Phase F — Owners screen
- [x] Phase G — Connection requests screen
- [x] Phase H — Bookings screen
- [x] Phase I — Analytics screen
- [x] Phase J — Settings (scope reduced to a Logout action, see log)
- [ ] Phase K — Services catalog (deferred)

## Log

- 2026-08-20 — Imported the design from Claude Design (`Car Wash Web
  Apps.dc.html`, "Админ" tab), read `q-wash-api` end to end, grilled the
  plan with the user, wrote `PLAN.md`. Nothing built yet.
- 2026-08-20 — Phases A–D built. Node/npm turned out to be installed via
  `nvm` (`~/.nvm/versions/node/v24.18.1`) but not on the default `PATH` —
  used real `npm create vite@latest --template react-ts` to get the
  current, tooling-vouched-for baseline config/versions (React 19.2,
  Vite 8.2, TypeScript ~6.0.2, oxlint for lint) rather than hand-writing
  package.json/tsconfig blind, then built `q-wash-shared` (see its own
  `PROGRESS.md`) and this app for real against it.

  **Scope decision, confirmed with the user**: `q-wash-api/docs/
  PLAN_WEB_APPS.md` phases 1–3 (the admin backend endpoints) shipped the
  same day this plan was written, before this session started building —
  so phase C was built directly against real `GET /admin/washing-points` /
  `GET /admin/stats` instead of the originally-planned static mock data,
  merging plan phases C and E. See `PLAN.md`'s "Update 2026-08-20" for the
  three fidelity gaps that decision surfaced (dropped "Часы" table column,
  dropped stat-card delta chips, dropped the sidebar's connection-requests
  counter) — all real-API limitations, not oversights.

  **What was built**: `AdminShell`/`Sidebar` (only "Мойки" is a real,
  clickable nav item — the other five render dimmed and inert, no route,
  matching the mock's own non-functional nav plus this plan's "no
  placeholder screens" rule); `LoginPage` (not in the mock at all — the
  mock jumps straight to authenticated views — designed to match the
  theme, centered card, username/password, error text); `PointsPage`
  (4 stat cards, search-filtered points table, `⋯` row action left inert —
  no per-point actions designed yet); `NewPointDrawer` (step 1 of 3, all
  fields as real controlled inputs, box-count chip selector — both footer
  buttons currently just close the drawer, since neither a real submit
  target nor steps 2–3 exist yet, see `PLAN.md` phase D/E).

  **Verification**: `tsc -b && vite build` and `oxlint` clean in both
  packages (a `useMemo`/`exhaustive-deps` warning and an unsafe
  `errorBody?.error.code` optional-chain in `q-wash-shared/api/client.ts`
  were caught this way and fixed). Ran the real Vite dev server and drove
  it via `claude-in-chrome`: confirmed the login screen renders correctly
  and that a real login attempt against port 8080 (nothing listening)
  surfaces "Не удалось связаться с сервером" — proving the fetch/error
  path works end-to-end outside of react-query. To see the Мойки screen
  and the wizard drawer (both behind the auth gate, and no backend
  available here to actually authenticate against — Docker/`psql` are
  blocked by this sandbox's shell policy, same standing gap as every
  `q-wash-api` session), temporarily bypassed `ProtectedRoute` in
  `App.tsx`, screenshotted, then reverted it — confirmed both screens
  render correctly and the box-count chip selector is interactive.

  **One open finding, not a bug**: with the auth gate bypassed and no
  backend reachable, `PointsPage`'s `pointsQuery`/`statsQuery` sat in
  react-query's `fetchStatus: 'paused'` indefinitely instead of ever
  reaching `isError` — confirmed via temporary debug logging that this is
  TanStack Query's default `networkMode: 'online'` pausing retries because
  this specific automated-browser tab reports itself offline, not an app
  bug (the login page's independent error path, which doesn't go through
  react-query, proved the same underlying request/error code works). Real
  users with real connectivity but a merely-unreachable API will get the
  normal `isError` path. Worth an actual end-to-end check (real backend,
  real browser) next time one's available — nothing here should regress
  it, but it's unverified against a live server.

- 2026-08-22 — Built phase F, the Owners screen (`GET/POST /owners`,
  `PATCH /owners/{id}`). Not in the mock (only "Мойки" is drawn) — designed
  from scratch to match its layout language rather than inventing a new
  one: header (title, search, "+ Новый владелец") over a `DataTable`,
  columns Название/Контактное лицо/Телефон/Email. One `OwnerDrawer`
  component serves both create and edit — clicking a row opens it
  pre-filled via `PATCH`; the "+" button opens it empty via `POST`. Both
  paths are real `useMutation` calls (first mutation-backed form in this
  app — `PointsPage`/`NewPointDrawer` only use `useQuery` so far), with
  `queryClient.invalidateQueries(['admin','owners'])` on success and
  `ApiError`-aware inline error text on failure, matching `LoginPage`'s
  error-display pattern. No delete — `openapi.yaml` has no
  `DELETE /owners/{id}`. Added to `q-wash-shared`: `Owner`/`OwnerList`/
  `OwnerCreate`/`OwnerUpdate` types and `api/owners.ts`
  (`listOwners`/`createOwner`/`updateOwner`) — see its own `PROGRESS.md`.
  Sidebar's "Владельцы" item now routes to `/owners` (was inert); `App.tsx`
  gained the route.

  **Verification**: `tsc -b`, `vite build`, and `oxlint` all clean in both
  packages. Could not visually verify in-browser this session — the
  `claude-in-chrome` extension wasn't connected in this environment (no
  active Chrome extension session), unlike the prior session where it was
  available. Confirmed the dev server itself serves the app (`curl` 200 on
  `/`) and reverted the temporary `ProtectedRoute` bypass used to reach
  that check. Screen has not been eyeballed against a running backend or
  in a real browser yet — do that before calling phase F fully done, same
  caveat as the open react-query finding above.

  Phase E remains partially blocked: owner picking is now possible, but
  the wizard's map placeholder still needs to produce a real lat/lng
  before `WashingPointCreate` can be submitted, and steps 2–3 still need
  grilling with the user.

- 2026-08-22 (same session) — Built phases G and H.

  **G — Connection requests** (`GET/POST /connection-requests`, `PATCH
  /connection-requests/{id}`): status tabs (Новые/Одобренные/Отклонённые/
  Все) over a `DataTable`; `new` rows get inline Одобрить/Отклонить
  buttons, a `useMutation` each, invalidating both
  `['admin','connection-requests']` and `['admin','washing-points']` on
  success (approving creates a `WashingPoint` server-side, so the Мойки
  screen's list needs to know too). "+ Новая заявка" opens a create drawer
  — same `useMutation` + `ApiError`-display pattern as `OwnerDrawer`. Also
  wired the sidebar's "Заявки на подключение" counter (a `useQuery` for
  `status=new` inside `Sidebar` itself, badge turns gold when count > 0)
  — this was dropped in the 2026-08-20 update for lack of an api module;
  that module (`api/connectionRequests.ts`) exists now, so it's wired for
  real. Flagged in `PLAN.md`: approving a request leaves the resulting
  point at placeholder `0,0` coordinates and `PointsPage` has no edit
  action yet to fix that — a real gap, not solved here.

  **H — Bookings** (`GET /queue`, `PATCH /queue/{id}/status`): found a
  real API gap while planning this one — checked
  `q-wash-api/internal/queue/handler.go`'s `boardItemResponse` directly
  (not just `openapi.yaml`, in case the spec had drifted from the actual
  code) and confirmed the network-wide `GET /queue` response has no
  `washing_point_id` on its items, so a single "all points" call can't be
  attributed back to a point. Didn't touch the backend contract for this
  (needs explicit approval per this app's boundaries) — instead fetched
  each point's own board in parallel via `useQueries` (one `GET
  /queue?washing_point_id={id}` per point from the already-loaded
  `admin/washing-points` list) and tagged each item with that point's
  name/id client-side before merging into one table sorted by
  `scheduled_start_at`. N+1 requests, but real data end to end. Table:
  Мойка/Клиент/Бокс/Время/Статус/Действие, `refetchInterval: 20_000` (a
  shift-monitoring screen, same "someone stares at this" reasoning as
  `PointsPage`'s table), times formatted explicitly in `Asia/Dushanbe`
  (not the browser's local zone) per the platform's fixed-timezone
  convention. "Действие" advances a row's status
  (queue→waiting→washing→ready) via `PATCH /queue/{id}/status` — checked
  `reqctx.AuthUser.OwnsWashingPoint` in code, confirmed `admin` owns every
  point so this works network-wide, not just for a staff user's own point.
  Reaching `ready` removes the row from the board (`ListLive` only
  returns `queue`/`waiting`/`washing`, confirmed in
  `internal/queue/repository.go`). No cancel action: `PATCH
  /queue/{id}/cancel` is owner-only in the actual handler
  (`CancelBooking` → `FindOwnedByID`) — `PLAN_WEB_APPS.md` phase 7
  ("Worker role") is where broadening that RBAC is planned, and phase 7
  hasn't started, so admin genuinely can't cancel via the API yet; this
  isn't a docs/code mismatch, just an unbuilt phase, confirmed by reading
  the handler rather than assuming from the plan doc alone.

  Added to `q-wash-shared`: `ConnectionRequest*` types and
  `api/connectionRequests.ts`
  (`listConnectionRequests`/`createConnectionRequest`/
  `reviewConnectionRequest`); `BoardItem`/`BoardItemList`/`Booking`/
  `BookingStatusUpdate` types and `api/queue.ts`
  (`listQueueNetworkWide`/`updateBookingStatus`) — see its own
  `PROGRESS.md`. Sidebar's "Записи" item now routes to `/bookings` (was
  inert); `App.tsx` gained both routes.

  **Verification**: `tsc -b`/`tsc --noEmit`, `vite build`, and `oxlint`
  all clean in both packages after each phase. Same caveat as phase F:
  `claude-in-chrome` still wasn't connected in this environment, so
  neither screen has been eyeballed in a real browser against a running
  backend. Do that (along with an actual approve→point-appears check and
  a real status-advance click) before calling G/H fully verified.

  Remaining: phase E still blocked as above (map lat/lng, steps 2–3);
  phase J (Settings) still needs scope grilled with the user before
  starting; phase K stays deferred.

- 2026-08-22 (same session) — Built phase I, Analytics.

  Checked `q-wash-api/internal/admin/handler.go`'s `stats` handler
  directly: `GET /admin/stats` is genuinely network-wide-only, no
  per-point breakdown endpoint exists anywhere in the API. A screen built
  from `AdminStats` alone would just be a bigger copy of the Мойки
  screen's 4 cards, so this adds two things that make it a real
  differentiator instead:
  - The same `AdminStats` fields as bigger cards, now also showing
    `points_active` and two client-computed derived rates (active-point
    ratio, cancellation rate = `canceled_today / (bookings_today +
    canceled_today)`) — both guarded against divide-by-zero (render `—`
    when the denominator is 0), since these are real ratios of real
    fields, not invented numbers.
  - A per-point table: boxes/services/status from the already-cached
    `GET /admin/washing-points`, plus a live "в очереди сейчас" column
    reusing `BookingsPage`'s exact per-point `GET
    /queue?washing_point_id=` fetch and query key
    (`['admin','queue',id]`) — real current data (not a fake "today per
    point" number `AdminStats` can't back), and since the query key
    matches, having both this screen and Bookings open shares one cache
    entry per point instead of polling twice.

  Sidebar's "Аналитика" item now routes to `/analytics` (was inert);
  `App.tsx` gained the route. No new `q-wash-shared` API surface needed —
  this screen only composes `getAdminStats`, `listAdminWashingPoints`,
  and `listQueueNetworkWide`, all already added for earlier phases.

  **Verification**: `tsc -b`, `vite build`, `oxlint` all clean. Same
  caveat as F/G/H — `claude-in-chrome` still not connected in this
  environment, so not yet eyeballed in a real browser against a running
  backend.

  Remaining: phase E still blocked (map lat/lng, steps 2–3, needs the
  user); phase J (Settings) needs scope grilled with the user before
  starting; phase K stays deferred.

- 2026-08-22 (same session) — Real end-to-end browser verification, with
  the user running `q-wash-api` locally and `claude-in-chrome` connected
  (it wasn't earlier in this session — retried once the user reconnected
  it). Ran the real Vite dev server against the real API for the first
  time this session, logged in with the dev-seed `admin`/`admin12345`
  credentials (`q-wash-api/README.md`), and drove every built screen for
  real:
  - **Login** → real 200, redirects to `/`.
  - **Мойки**: real seeded point ("Pegasus Wash - Downtown") and stats
    render correctly.
  - **Владельцы**: created an owner through the drawer — appeared in the
    list immediately (cache invalidation confirmed working); clicked the
    row, edit drawer pre-filled correctly with "Сохранить" instead of
    "Добавить".
  - **Заявки на подключение**: created a request through the drawer,
    watched the sidebar counter go 0→1 live; clicked Одобрить — request
    moved to the "Одобренные" tab, sidebar counter went back to 0, **and**
    a new `pending_review` washing point plus a new owner appeared on the
    Мойки/Владельцы screens with no manual refresh — confirms the
    cross-screen `invalidateQueries(['admin','washing-points'])` wiring
    from `ReviewActions` actually works, not just compiles.
  - **Записи**: real seeded bookings rendered, correctly attributed to
    their point — confirms the per-point `useQueries` workaround for
    `GET /queue`'s missing `washing_point_id` actually produces correct
    attribution against a real multi-point backend, not just plausible
    code. Clicked "Начать ожидание" — `PATCH /queue/{id}/status` fired for
    real, row flipped from В очереди → Ожидание, button label updated to
    the next transition.
  - **Аналитика**: stat cards and per-point table rendered correctly,
    including the shared `['admin','queue',id]` cache with `BookingsPage`
    (both screens' queue counts matched) and the `null`-safe "Доля отмен"
    render (`—`, no crash, no `NaN`) with `bookings_today +
    canceled_today === 0`.
  - No console errors on any screen (checked via
    `read_console_messages`).

  **One real bug found and fixed**: several header subtitles were
  grammatically wrong for anything other than the "few" count — "1
  владельцев", "1 точек · 1 активных" (visible in the very first
  screenshot of this verification pass). Added
  `src/shared/pluralRu.ts` (standard Russian mod-10/mod-100 agreement
  rule) and applied it in `PointsPage`, `OwnersPage`,
  `ConnectionRequestsPage`, `BookingsPage` — reverified in-browser after
  the fix ("2 точки · 1 активная", "2 владельца" now read correctly).
  Not caught by `tsc`/`oxlint` since it's a string-content bug, not a
  type error — exactly the class of thing this verification pass exists
  to catch.

  Also found, not a frontend issue: the user's freshly-started
  `q-wash-api` initially 500'd on every request (confirmed via direct
  `curl`, before touching the admin app) — asked the user, who ran
  `make migrate-up && make seed` themselves; retried and everything
  worked. Not a code change here, just noted so a future session doesn't
  mistake a fresh unseeded DB for an app bug.

  **This closes out the "not yet visually verified" caveat on phases
  A–D, F, G, H, I** — all are now real-backend-verified, not just
  typechecked/linted.

- 2026-08-22 (later, same day) — Built phase E. Grilled its two
  blockers directly with the user rather than guessing (see
  `PLAN.md`'s "Update 2026-08-22 (later, same day)" for the full
  reasoning): chose a real Leaflet + `react-leaflet` map over plain
  lat/lng inputs (new dependency, user-approved; keyless CARTO dark
  tiles, no billing); collapsed the wizard from 3 steps to 1, since step
  2 ("Услуги") was always meant to reuse `q-wash-cabinet`'s service CRUD
  and `q-wash-cabinet` doesn't exist yet.

  `NewPointDrawer` now submits for real via `POST /washing-points`
  (`createWashingPoint`, new in `q-wash-shared`'s `api/washingPoints.ts`,
  plus a `WashingPoint` type — see its own `PROGRESS.md`). Fields:
  Название/Адрес (required), Владелец (real `<select>` from
  `listOwners()`), a new `LocationPicker` component (click-or-drag on a
  Dushanbe-centered map, custom gold `divIcon` matching the theme,
  coordinate readout), Боксы (real number input — dropped the old mock's
  "5+" chip option since it never mapped to a real integer),
  Открытие/Закрытие (`<input type="time">`), Статус (defaults to
  `active`, unlike the connection-request path which defaults to
  `pending_review` server-side).

  **Verification**: real end-to-end with the user's local `q-wash-api`
  and `claude-in-chrome` connected — clicked the actual map, submitted,
  watched the point appear on Мойки immediately, then cross-checked
  `GET /washing-points` directly and confirmed the persisted
  `latitude`/`longitude` matched the map's on-screen readout exactly,
  and `open_time`/`close_time` persisted correctly as 24h `"08:00"`/
  `"20:00"` (the browser displayed 12h "08:00 AM" — a locale-driven
  display quirk of the native time input, not a data bug).

  **One real bug found and fixed**: the Боксы/Открытие/Закрытие row
  overflowed horizontally in-browser (three `flex:1` native
  number/time inputs exceeding their flex-basis under default
  `min-width:auto`) — fixed with `minWidth:0` + explicit `width:'100%'`,
  reverified.

  Remaining scope: phase J (Settings) needs scope grilled with the
  user before starting; phase K stays deferred. Every other phase
  (A–I) is now both built and real-backend-verified.

- 2026-08-22 (evening) — Grilled and closed phase J. Checked the API for
  what "Настройки" could actually contain — no network-wide config exists
  in `q-wash-api` (everything's a hardcoded backend constant), no
  staff/admin user-management CRUD, only `PATCH /me` for display name.
  Asked the user: build a minimal profile screen around that one field,
  or go smaller. They chose smaller — and while checking this, found a
  real, unrelated gap: **no logout affordance existed anywhere in the
  built app.** Fixed exactly that, nothing more: a small ⎋ icon-button in
  `Sidebar.tsx`'s header, calling `authStore.logout()` (existed in
  `q-wash-shared` since phase B, just had no caller until now —
  `q-wash-shared`'s own `PROGRESS.md` doesn't need an update, no new API
  surface).
  "Настройки" nav item stays inert — genuinely nothing to build against.

  **Verification**: real end-to-end. Clicked the new logout button,
  confirmed redirect to `/login`; navigated straight back to `/`
  afterward (not just trusting the redirect) and confirmed it bounced to
  `/login` again — tokens actually cleared, not a stale in-memory
  redirect. No console errors. Logged back in afterward to leave the
  session usable.

  **Phase J is closed at this scope.** All of A–J are now built and
  real-backend-verified. Only phase K (Services catalog) remains, and
  it's deferred per `q-wash-api/docs/PLAN_WEB_APPS.md`'s own "Deferred"
  note — not scheduled unless per-point service CRUD in a future
  `q-wash-cabinet` turns out insufficient.

- 2026-08-31 — Added test infrastructure (this app had none): Vitest
  4.1.11 + React Testing Library 16.3.3 + `@testing-library/jest-dom`
  7.0.1 + `@testing-library/user-event` 14.6.6, jsdom environment
  (`vitest.config.ts`, `vitest.setup.ts`), `npm test` script.

  **Scope narrowed from the plan after reading the drawer components**:
  dropped `LocationPicker.tsx` (pure Leaflet click-passthrough, no
  branching logic worth testing) and dropped the "non-integer boxes
  count" case for `NewPointDrawer` — its boxes field is
  `type="number" min={1}` with default `step`, so the browser's own
  constraint validation already blocks a non-integer/sub-1 value before
  `onSubmit` ever runs; the component's own `Number.isInteger`/`< 1`
  check in that handler is dead code, unreachable through this input.
  Not fixing it (out of scope for a test-only task) — flagging it here.
  Added `ConnectionRequestDrawer.tsx` in its place (not in the original
  file list, found while reading step 1's target files): its
  `boxes_count` field is a plain text input (no native step/min guard),
  so the same validation check *is* reachable there and worth covering.

  **Tests added** (31 total): `pluralRu` (18 cases across all plural
  forms), `ConnectionRequestsPage`'s `ReviewActions` (approve/reject
  error surfaced, non-`ApiError` fallback message, list re-fetch on
  success), `ConnectionRequestDrawer` and `OwnerDrawer` (validation
  branches, trim/`undefined`-mapping, create-vs-update branch, `ApiError`
  message surfaced and drawer stays open on failure), `NewPointDrawer`
  (location-required branch, happy path, `ApiError` surfaced — mocking
  `./LocationPicker` to sidestep react-leaflet's jsdom/canvas
  requirements, verified NOT the unit under test).

  **A real, reproducible Vitest 4.1.11 quirk found and worked around**:
  resetting a `vi.hoisted` mock inside `beforeEach` (`mockReset`/
  `mockClear`, either one) — when that same mock later rejects inside a
  react-query mutation the test also asserts against — makes Vitest
  misattribute an already-caught rejection (verified via a
  `window.addEventListener('unhandledrejection', ...)`/
  `process.on('unhandledRejection', ...)` probe: neither ever fired) as
  the test's own failure, nondeterministically depending on file/hook
  timing (bisected: reproduces with `beforeEach` present regardless of
  what it does to the mock; disappears when the same reset call moves to
  the first line of each `it` body instead). Worked around by moving
  every mock reset inline; also set `mutations: { retry: false }`
  everywhere queries already had it, since mutations default to 3
  retries outside a server environment and that's worth being explicit
  about regardless of this quirk. Left a one-line comment at each
  `describe` explaining why there's no `beforeEach` here.

  **Verification**: `npm test` (31/31 pass, reran 4× including 3 back to
  back to confirm no flakiness), `npm run lint` (oxlint, clean),
  `npx tsc -b` (added `@testing-library/jest-dom` to
  `tsconfig.app.json`'s `types` for matcher typings — clean), `npm run
  build` (production build still succeeds, `dist/` is gitignored).

- 2026-09-19 — **New palette/font/logo from Claude Design.** Picked up
  `q-wash-shared`'s new `theme/tokens.ts` values (near-black palette,
  single Sora font) and its new `LogoMark` component (replaces the old
  bordered letter badge in the sidebar/header/login screen — no
  app-specific logic changed, see `q-wash-shared/PROGRESS.md`). Locally:
  removed the `theme/fonts.css` import from `main.tsx` and added the
  Google Fonts `<link>`s + an inline-SVG favicon (same logo mark) to
  `index.html` — self-hosted Manrope/Prata dropped in favor of the CDN.
  `npm run build` and `npm test` both clean.

- 2026-09-24 — **Mobile layout (≤768px), matching the Claude Design mock's
  admin mobile screen.** New `shared/layout/BottomNav.tsx` (4-item bottom
  nav mirroring `Sidebar.tsx`'s real routes: Мойки/Владельцы/Записи/
  Аналитика — the inert catalog/settings entries stay sidebar-only).
  `AdminShell.tsx` swaps `Sidebar` for `BottomNav` below the breakpoint via
  `q-wash-shared`'s new `useIsMobile()`; desktop path unchanged. `PointsPage.tsx`
  gained a status filter-chip row (Все/Активна/На паузе/Проверка, client-side
  over the already-fetched list — new UI, shown on both desktop and mobile)
  and a mobile card-list view of the same filtered data (desktop keeps
  `DataTable`); the 3-up mini-stat row uses Боксы/Услуги/Владелец, not
  "Часы" like the mock — `AdminWashingPoint` has no hours field, and adding
  one wasn't in scope. `NewPointDrawer.tsx` reflows to a full-width bottom
  sheet on mobile (same one-step real form/submit handler — still no
  reintroduction of the mock's 3-step wizard, see the file's 2026-08-22
  comment). Header row and floating "+ Новая мойка" action button also
  reflow on mobile.

  **Found and fixed a real dual-React-copy bug surfaced by this change**:
  `q-wash-shared`'s `useIsMobile` is the first hook actually called from
  *inside* `q-wash-shared`'s own module scope (existing shared components
  render but don't call hooks) — this hit `vite.config.ts`'s already-known
  "two React copies" issue (see its comment) but in `vitest.config.ts`,
  which was missing the same `resolve.dedupe: ['react','react-dom']`.
  Added it there too. Also added a `window.matchMedia` polyfill to
  `vitest.setup.ts` (jsdom doesn't implement it), defaulting to
  non-matching/desktop so existing tests keep exercising the desktop path.

  **Verification**: `npx tsc -b` clean, `npm test` (31/31 pass), `npx
  oxlint` clean, `npm run build` clean.

- 2026-09-24 (later, same day) — **QR-codes pool page**, per the approved
  Claude Design mock ("Q Wash QR Codes.dc.html") and the platform's
  cross-repo `plan.md`, wired to the now-live `q-wash-api` backend and
  `q-wash-shared`'s new `qrCodes` API module + `QrCodeImage` component.
  New `src/features/qr-codes/QrCodesPage.tsx`: stat row + filter chips
  (Все/Свободные/Привязанные/Отключённые) + search, all server-side via
  `listQrCodes({status, search})` (not client-side filtering like
  `PointsPage`'s chips — the backend already supports it); a 5-up grid of
  real, scannable QR thumbnails (`QrCodeImage`, encoding
  `resolveApiAssetUrl('/api/v1/qr-codes/scan/' + token)` — a real absolute
  URL a phone camera can resolve, not a bare token); a selected-code detail
  panel (separate `getQrCode(id)` query, since list items omit `stats`)
  with assign/unassign/disable actions as `useMutation`s invalidating the
  `['admin','qr-codes']` query-key prefix (covers list + detail + the
  unfiltered "all codes" query in one call); a "Сгенерировать партию" modal
  (count quick-picks + a batch-label text input, since the real endpoint
  requires one the mock's fake version didn't need); "Печать свободных ·
  PDF" via `window.print()` + a `@media print` stylesheet, no PDF library
  (out of scope per `plan.md`) — the print-only block only mounts into the
  DOM while actually printing (not permanently CSS-hidden), since a
  duplicate-but-hidden copy of every free code's text would double up for
  assistive tech and for any DOM query, not just tests. New sidebar item
  "QR-коды" (`Sidebar.tsx`, right after "Мойки", matching the mock's nav
  order) + route (`App.tsx`).

  **Deliberate scope calls**: (1) skipped a separate "assign by typed code
  number" sub-flow — the pool page's existing search box already resolves
  a typed `QW-XXXX` to its card via the same server-side search, so a
  second, duplicate input felt like avoidable complexity for the same
  outcome. (2) No mobile-responsive variant for this page — a brand-new
  admin desktop feature, not one of the four apps' existing screens the
  earlier mobile-views pass covered.

  **Verification**: `npx tsc -b` clean, `npx oxlint` clean, `npm test`
  (36/36, including 5 new `QrCodesPage.test.tsx` cases: grid+stats render,
  filter-click refetches with the right params, assign flow, mutation
  error surfaces instead of being swallowed, generate-modal submit), `npm
  run build` clean.

- 2026-09-25 — **Fixed a real visual regression**: the pool grid's small QR
  thumbnails looked noticeably denser/muddier than the design mock's clean
  pattern — the mock's fake generator used a fixed, small 25×25 grid, but
  the real encoded value was the full `/api/v1/qr-codes/scan/{token}` URL,
  long enough to need a much higher QR version. `q-wash-api` added a short
  root-level alias, `GET /q/{token}` (same handler, see its own
  `PROGRESS.md`), matching the design mock's own intended sticker-URL
  shape; `scanUrl()` here now builds against that instead. `npx tsc -b`,
  `npx vitest run` (36/36, no test needed changing — nothing asserted the
  literal URL string), `npx oxlint` all clean.

- 2026-09-25 (same day) — **Fixed a real layout bug reported on the QR-codes
  page**: with 25 codes the grid overflowed a full viewport, and the whole
  shell — including `Sidebar` — scrolled away with the page instead of
  staying pinned while only the page's own content area scrolled. Root
  cause was in `AdminShell.tsx`, not this page: its root container used
  `minHeight: '100vh'`, which lets the box grow past the viewport on tall
  content, even though every page here (`PointsPage`, `OwnersPage`,
  `BookingsPage`, `AnalyticsPage`, `ConnectionRequestsPage`, and now this
  one) already assumes a bounded-height ancestor via its own
  `flex:1; minHeight:0; overflowY:'auto'` content region — confirmed by
  grepping all of them before making the change, so this wasn't a
  QR-codes-only patch. Changed to `height: '100vh'`. Verified in a real
  browser (not just `vitest`, since jsdom doesn't compute box layout):
  ran the API server + this app's dev server against local Postgres,
  logged in, generated a real 25-code batch, and confirmed via screenshots
  that scrolling the grid to the bottom now leaves `Sidebar` and the
  header exactly where they were — before the fix, both had visibly
  scrolled out of frame.

- 2026-09-25 (same day) — **Two more real bugs from the same QR-image work,
  both caught by the user testing locally, not by my own earlier check**:
  the detail panel's big QR (`QrCodesPage.tsx`) overflowed its white card
  instead of being centered inside it — the previous fix had pinned it to
  a hardcoded `size={280}`, which didn't actually fit the panel's real
  padded width (~256px). See `q-wash-shared`'s own `PROGRESS.md` for the
  root cause and the component-level fix (`QrCodeImage` now fills 100% of
  its wrapper by default, matching the design mock's own `<svg
  width="100%">` markup, instead of a hand-picked pixel number that had
  to be kept in sync with padding math elsewhere). Dropped `size={280}`
  here to use that default.

  First attempt at that same fix also switched the pool grid's thumbnail
  (`size={96}`) to the same 100%-fill approach — that broke a second way:
  a percentage-width child inside this grid's `repeat(5, minmax(0,1fr))`
  columns confused the grid's own column-sizing, and the whole page
  overflowed horizontally (caught this one myself, in the browser, before
  it reached the user again). Kept `size={96}` as an explicit fixed pixel
  box there instead — `QrCodeImage` now documents fixed-size as the right
  choice specifically for a grid/flex item sharing space with siblings,
  vs. the 100%-fill default for a wrapper that's already its own
  standalone box.

  `npx tsc -b`, `npx vitest run` (36/36), `npx oxlint` clean. Verified for
  real in a browser both ways: the grid no longer overflows (confirmed no
  horizontal scrollbar), and the detail panel's QR is contained and
  centered — zoomed into both to check the finder-pattern squares are
  true squares in both places.

- 2026-09-25 (same day) — **User reported the grid still didn't match the
  design after the above**, and this time I went back to the actual mock
  source (`Q Wash QR Codes.dc.html`, saved locally) instead of reasoning
  from a screenshot. The mock's own pool-card markup:
  `cardStyle` (the grid item — `padding:12; border-radius:16;
  background:#191917; display:flex; flex-direction:column; gap:10`) wraps
  a `qrBoxStyle` div (`padding:10; border-radius:12; aspect-ratio:1;
  background:#F6F5EF`) with **no width set on the QR box at all** — it's a
  block-level flex child of a `flex-direction:column` parent, so it gets
  `align-items:stretch`'s default full-width for free, and `aspect-ratio:1`
  derives the height from that. The grid item is the *card*, not the QR
  box; the two are never the same element. My previous "fixed `size={96}`
  because percentage-width broke the grid" conclusion was chasing the
  wrong culprit — I had never actually re-checked the mock's own DOM
  nesting for this specific card, only for the detail panel.

  Fixed `QrCodesPage.tsx`'s grid card to match this nesting exactly:
  `borderRadius: radius.xl` (was `radius.xxl` — mock is 16px, `xl` is the
  matching token, not `xxl`'s 18px), QR-box padding `10` (was `8`,
  matching mock), `aspectRatio: '1'` + `boxSizing: 'border-box'` on that
  box, and dropped `size={96}` from `QrCodeImage` entirely (default
  100%-fill mode now does the job, relying on the parent's flex-stretch
  exactly like the mock does).

  `npx tsc --noEmit` and `npx vitest run` (36/36) clean. Verified for real
  in the browser again at the actual dev-server viewport (not the mock's
  fixed 1440px canvas): no horizontal scrollbar, grid cards and the detail
  panel both zoomed in to confirm true squares, and card padding/radius
  now visually match the design screenshot the user sent, not just an
  aspect-ratio-correct rectangle.

- 2026-09-25 (same day) — Restyled scrollbars app-wide (`index.css`):
  thin (10px), transparent track, rounded dark thumb (`#33322C`,
  `#4E4E47` on hover) instead of the browser default. The design mock
  itself hides scrollbars entirely (`width:0`), but that's a static-canvas
  artifact, not something to replicate in a real scrollable app — kept a
  visible, themed one instead. Applies globally (`*`), not just the
  QR-codes grid, since every page in this app uses `overflowY:'auto'`
  panels the same way. Verified in the browser: thumb renders slim and
  dark instead of the default chunky gray. `npx vitest run` still 36/36
  (CSS-only change).

- 2026-09-25 (same day) — **Мойки was view-only**: rows had no way to edit
  a washing point after creation (only `NewPointDrawer`'s create flow
  existed; the row's `⋯` was a static, unwired glyph). The backend already
  supported this (`PATCH /washing-points/{id}`, `updateWashingPoint` in
  `q-wash-shared`; `OwnsWashingPoint` returns `true` unconditionally for
  `admin` — no backend change needed), it just wasn't wired up here.

  Added `EditPointDrawer.tsx`, modeled on `NewPointDrawer`: fetches the
  full record via `getWashingPoint(id)` (the list-page's `AdminWashingPoint`
  summary type lacks lat/lng/hours), prefills the same field set, and
  submits via `updateWashingPoint`. Wired both the desktop table row and
  the mobile card in `PointsPage.tsx` to open it via `onClick`. Needed a
  small addition to `q-wash-shared`'s `DataTableRow` (an optional `onClick`
  prop — see its own `PROGRESS.md`) since the shared table component didn't
  expose one.

  `npx tsc --noEmit`, `npx vitest run` (36/36) clean. Verified for real in
  the browser, not just by reading the code: opened the drawer on the one
  seeded point, confirmed every field (name, owner, address, map pin at
  its real lat/lng, boxes, hours, status) came back prefilled correctly,
  changed the name, saved, and watched the list row update to the new name
  — then reverted it back the same way to leave seed data untouched.

- 2026-09-25 (same day) — Updated the favicon (`index.html`'s inline
  `data:image/svg+xml` `<link rel="icon">`) to match the `LogoMark` fix
  (see `q-wash-shared`'s `PROGRESS.md`): dark bordered square instead of
  gold, gray/gray/gold bars instead of dark-on-gold. Verified by injecting
  the live page's own `link.href` into an `<img>` in a real browser tab —
  renders as the dark square with gray/gray/gold bars, matching `LogoMark`.
  Same change applied identically in `q-wash-cabinet`, `q-wash-worker`,
  `q-wash-display`.
