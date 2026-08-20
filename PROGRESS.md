# Progress

See `PLAN.md` for the full plan and build order.

- [x] Phase A — Scaffold
- [x] Phase B — Auth
- [x] Phase C — Мойки screen, wired to real q-wash-api (merged with E)
- [x] Phase D — "+ Новая мойка" wizard, step 1 (UI only)
- [ ] Phase E — Wire the wizard to real creation
- [ ] Phase F — Owners screen
- [ ] Phase G — Connection requests screen
- [ ] Phase H — Bookings screen
- [ ] Phase I — Analytics screen
- [ ] Phase J — Settings screen
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
