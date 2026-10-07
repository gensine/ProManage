# Project Management System (Web + Mobile) — Full Plan

One backend + one database, serving a **web app** and an **Android app**. A user registers/logs in on either, and sees the same projects and tasks.

Legend: **[MUST]** = required by the task · **[BONUS]** = optional, scores extra · **[RECOMMENDED]** = my suggestion, not required

---

## 1. Final Deliverables Checklist

- [ ] Public GitHub repo (viewable without login) — monorepo or 3 repos (backend / web / mobile)
- [ ] Database schema or ER diagram (image or in README)
- [ ] API documentation (README section, Postman collection, or Swagger)
- [ ] README (setup, env vars, DB setup, API docs, running mobile against deployed backend)
- [ ] Deployed web app URL
- [ ] Deployed backend URL
- [ ] Android APK **or** Expo / Firebase App Distribution link
- [ ] 5-minute screen recording (see §12)

---

## 2. Recommended Tech Stack

The task lets you choose one option per layer. Suggested picks (all common, well documented, easy to explain in review):

| Layer | Choose one (task) | [RECOMMENDED] |
|---|---|---|
| Web | React **or** Next.js | React + Vite + React Router (or Next.js if you prefer) |
| Mobile | React Native (Expo/bare) **or** Flutter | React Native with Expo (reuses React/TS skills, easy APK via EAS) |
| Backend | Node + Express **or** NestJS | Node + Express + TypeScript |
| Database | PostgreSQL **or** MySQL | PostgreSQL |
| ORM | — | Prisma (parameterized queries by default → SQL injection safe) |
| Validation | — | Zod (shared schemas across backend/web/mobile = bonus) |
| Auth | JWT + bcrypt | `jsonwebtoken` + `bcrypt` |
| Logging | — | `pino` / `winston` + `morgan` |
| Rate limiting | — | `express-rate-limit` |
| Security headers | — | `helmet` |
| Mobile token storage | Keystore/Keychain | `expo-secure-store` |
| Mobile network check | — | `@react-native-community/netinfo` |
| Hosting | — | Backend: Render/Railway · DB: Neon/Supabase/Railway · Web: Vercel/Netlify |

---

## 3. Suggested Repository Structure

```
project-management-system/
├── README.md
├── docker-compose.yml            [BONUS]
├── packages/
│   └── shared/                   [BONUS] shared Zod schemas + TS types
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── app.ts                # express app, middleware wiring
│   │   ├── server.ts             # listen()
│   │   ├── config/               # env loading + validation
│   │   ├── routes/               # auth, projects, tasks, dashboard
│   │   ├── controllers/
│   │   ├── services/             # business logic + DB access
│   │   ├── middleware/           # auth, validate, errorHandler, rateLimiter, logger
│   │   ├── validators/           # zod schemas
│   │   └── utils/                # ApiError, jwt helpers
│   ├── tests/                    [BONUS]
│   └── .env.example
├── web/
│   ├── src/
│   │   ├── api/                  # axios client + interceptors
│   │   ├── components/
│   │   ├── pages/                # Login, Register, Dashboard, Projects, ProjectDetail
│   │   ├── context/              # AuthContext
│   │   ├── hooks/
│   │   └── utils/
│   └── .env.example
└── mobile/
    ├── app/ or src/              # screens, navigation
    ├── api/                      # axios client + interceptors
    ├── components/
    ├── storage/                  # secure-store wrapper
    └── .env.example
```

---

## 4. Database Design  **[MUST: relational, FKs, normalized]**

### Tables

**users**
| Column | Type | Constraints |
|---|---|---|
| id | UUID / SERIAL | PK |
| full_name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | NOT NULL, **UNIQUE** (store lowercase) |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | default now() |

**projects**
| Column | Type | Constraints |
|---|---|---|
| id | PK | |
| owner_id | FK → users.id | NOT NULL, ON DELETE CASCADE |
| name | VARCHAR(150) | NOT NULL |
| description | TEXT | nullable |
| status | ENUM(`NOT_STARTED`,`IN_PROGRESS`,`COMPLETED`) | default `NOT_STARTED` |
| start_date | DATE | nullable |
| end_date | DATE | nullable, CHECK end_date >= start_date |
| created_at | TIMESTAMP | default now() |

**tasks**
| Column | Type | Constraints |
|---|---|---|
| id | PK | |
| project_id | FK → projects.id | NOT NULL, ON DELETE CASCADE |
| name | VARCHAR(150) | NOT NULL |
| description | TEXT | nullable |
| priority | ENUM(`LOW`,`MEDIUM`,`HIGH`) | default `MEDIUM` |
| status | ENUM(`PENDING`,`IN_PROGRESS`,`COMPLETED`) | default `PENDING` |
| due_date | DATE | nullable |
| created_at | TIMESTAMP | default now() |

**Indexes:** `projects(owner_id)`, `projects(owner_id, status)`, `tasks(project_id)`, `tasks(project_id, status)`, `users(email)` unique.

**Ownership rule:** tasks have no owner column — ownership is derived via `tasks → projects.owner_id`. Every task query must join/filter through the project's owner (keeps schema normalized).

**Optional tables:** `refresh_tokens` [BONUS], `audit_logs` [BONUS], `device_tokens` for push [BONUS].

> Produce an ER diagram (dbdiagram.io / draw.io / Mermaid) and put it in `/docs` + README.

---

## 5. API Specification  **[MUST: all endpoints below, used by both web and mobile]**

Base: `/api` · JSON only · Auth header: `Authorization: Bearer <jwt>`

### 5.1 Auth

| Method | Route | Auth | Body | Success |
|---|---|---|---|---|
| POST | `/api/auth/register` | No | `fullName, email, password` | 201 `{ user, token }` |
| POST | `/api/auth/login` | No | `email, password` | 200 `{ user, token }` |
| POST | `/api/auth/logout` | Yes | — | 200 `{ message }` |
| GET | `/api/auth/me` | Yes | — | 200 `{ user }` |

Notes:
- Register: email unique → **409** if exists. Password min length (e.g., 8) + basic strength rule.
- Login: same generic message for wrong email/password (**401 "Invalid credentials"**) — don't reveal which one is wrong.
- Logout: JWT is stateless, so either (a) client deletes the token and server returns 200, or (b) keep a token denylist / refresh-token revocation for real invalidation. Be ready to explain the tradeoff.
- Never return `password_hash`.
- Token expiry e.g. 1h–1d. Expired/invalid → **401** with a clear code like `TOKEN_EXPIRED` so clients can show the right message.

### 5.2 Projects

| Method | Route | Notes |
|---|---|---|
| GET | `/api/projects` | Only the caller's projects. Query: `search` (name), `status`, [BONUS] `page`, `limit`, `sortBy`, `order` |
| GET | `/api/projects/:id` | 404 if not found **or not owned** (don't leak existence) |
| POST | `/api/projects` | `name` (required), `description`, `status`, `startDate`, `endDate` |
| PUT | `/api/projects/:id` | Owner only |
| DELETE | `/api/projects/:id` | Owner only; cascades tasks |

### 5.3 Tasks

| Method | Route | Notes |
|---|---|---|
| GET | `/api/tasks` | Query: `projectId`, `search` (name), `status`, `priority`, [BONUS] pagination/sort. Scoped to caller's projects only |
| GET | `/api/tasks/:id` | Ownership via project |
| POST | `/api/tasks` | Body includes `projectId`; verify caller owns that project |
| PUT | `/api/tasks/:id` | Used for edit, status change, priority change, mark complete |
| DELETE | `/api/tasks/:id` | Ownership via project |

"Mark as completed" = `PUT` with `status: "COMPLETED"` (or an optional `PATCH`).

### 5.4 Dashboard

`GET /api/dashboard` →
```json
{
  "totalProjects": 0,
  "totalTasks": 0,
  "completedTasks": 0,
  "pendingTasks": 0,
  "projectsInProgress": 0
}
```
All counts computed only for the authenticated user. Decide and document what "pending" means (suggest: tasks not `COMPLETED`, or strictly `PENDING` — pick one and state it in the README).

### 5.5 Standard response / error format

```json
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [{ "field": "email", "message": "Invalid email" }] } }
```

| Status | When |
|---|---|
| 400 | Validation failure |
| 401 | Missing/invalid/expired token, bad credentials |
| 403 | Authenticated but not allowed (if you choose 403 over 404) |
| 404 | Not found (or not yours) |
| 409 | Duplicate email |
| 429 | Rate limit hit |
| 500 | Unexpected — generic message, log the real error server-side |

---

## 6. Backend Requirements  **[MUST]**

- [ ] REST architecture with routes organized per resource
- [ ] Layered structure: routes → controllers → services (clean separation)
- [ ] Middleware: auth (JWT verify), request validation, error handler, request logger, rate limiter, CORS, helmet
- [ ] Central error handler + custom `ApiError` class; no stack traces leaked in production
- [ ] Logging of requests and errors (no passwords/tokens in logs)
- [ ] CORS limited to the **web app's domain** (env-driven allowlist). Note: native mobile apps aren't subject to CORS, so this doesn't block them
- [ ] Env validation at startup (fail fast if `JWT_SECRET`/`DATABASE_URL` missing)
- [ ] Health check route (`GET /health`) for deployment
- [ ] DB migrations + seed script with **test data only**

---

## 7. Security Checklist  **[MUST — heavily evaluated]**

**Authentication**
- [ ] bcrypt hashing (cost ≥ 10)
- [ ] No plaintext passwords anywhere (DB, logs, responses)
- [ ] JWT signed with strong secret from env; includes `sub` (user id) and `exp`
- [ ] Auth middleware on every non-public route

**Authorization (most commonly failed)**
- [ ] Project queries always filter by `owner_id = req.user.id`
- [ ] Task queries/mutations always verify the parent project belongs to the user
- [ ] On task create, verify `projectId` belongs to user (else someone can add tasks to another user's project)
- [ ] On task update, don't allow changing `projectId` to a project the user doesn't own
- [ ] Test manually with two accounts: user B must get 404/403 on user A's IDs (GET, PUT, DELETE)

**Input validation (backend, for every request)**
- [ ] Required fields, empty/whitespace-only strings trimmed and rejected
- [ ] Email format; password rules
- [ ] Valid dates; `endDate >= startDate`
- [ ] Enum values (status, priority) strictly validated
- [ ] ID params validated (UUID/int format)
- [ ] Max lengths; reject unknown fields (strip or error)

**API / data exposure**
- [ ] Never return `password_hash` or internal fields (use explicit DTO/select)
- [ ] Generic auth error messages
- [ ] `helmet` headers

**SQL injection**
- [ ] Use ORM (Prisma) or parameterized queries only — no string-concatenated SQL
- [ ] Search inputs go through ORM `contains` / bound parameters

**Rate limiting**
- [ ] On `/api/auth/login` and `/api/auth/register`: e.g., 5–10 attempts / 15 min per IP
- [ ] Return 429 with a clear message
- [ ] Set `trust proxy` correctly when deployed behind a proxy, or all users share one IP

---

## 8. Web App Requirements  **[MUST]**

**Pages / routes**
- [ ] `/register`, `/login`
- [ ] `/dashboard` — 5 stat cards (Total Projects, Total Tasks, Completed Tasks, Pending Tasks, Projects In Progress)
- [ ] `/projects` — list, search by name, filter by status, create button
- [ ] `/projects/:id` — project details, edit/delete, task list with create/edit/delete/complete
- [ ] Task search by name; filter by status and priority

**Quality requirements**
- [ ] Responsive layout (desktop + tablet + phone widths)
- [ ] Proper component structure (reusable `Button`, `Input`, `Modal`, `ProjectCard`, `TaskItem`, `StatCard`, etc.)
- [ ] Form validation (client-side, mirrors backend rules) with inline error messages
- [ ] Loading indicators (spinners/skeletons) on every fetch/submit
- [ ] Error handling: toast/banner for API errors; empty states ("No projects yet")
- [ ] Protected routes → redirect to login when unauthenticated
- [ ] Axios/fetch interceptor: on 401 → clear auth, redirect to login with a message
- [ ] Token persistence so user stays logged in until logout/expiry (localStorage is fine on web, or httpOnly cookie if you want to go further and can explain it)
- [ ] Confirm dialog before deleting
- [ ] Debounced search inputs

---

## 9. Mobile App Requirements (Android required, iOS optional)  **[MUST]**

**Screens / navigation**
- [ ] Auth stack: Login, Register
- [ ] Main (tabs or drawer): Dashboard, Projects
- [ ] Project detail → tasks list
- [ ] Task create/edit screen (or modal)
- [ ] Stack/tab navigation (React Navigation or Expo Router)

**Features**
- [ ] Register / login / logout with the same account as web
- [ ] Dashboard view
- [ ] View all projects + tasks under each
- [ ] Create, edit, delete tasks
- [ ] Mark complete; change status and priority
- [ ] Search tasks; filter by status and priority

**Hard requirements**
- [ ] **Token in secure storage** (Android Keystore via `expo-secure-store`) — **not** AsyncStorage
- [ ] **Pull-to-refresh** on dashboard, project list, task list (`RefreshControl`)
- [ ] Loading indicators on fetches/submits
- [ ] Form validation with clear messages
- [ ] **Expired token** → on 401, wipe token, navigate to Login, show a clear message ("Session expired, please log in again")
- [ ] **No network** → friendly message/banner + retry button; no crash or blank screen (NetInfo + axios error handling for `ERR_NETWORK`/timeouts)
- [ ] Clean phone UI: touch-friendly targets, keyboard avoiding views, safe areas
- [ ] API base URL via env/config (`EXPO_PUBLIC_API_URL`) pointing to the **deployed backend** (not `localhost`; Android emulator uses `10.0.2.2`, real devices need LAN IP or the deployed URL)
- [ ] Use HTTPS in the deployed build (Android blocks cleartext HTTP in release builds by default)

**Build**
- [ ] Generate APK: `eas build -p android --profile preview` (set `buildType: "apk"` in `eas.json`) — or Expo/Firebase distribution link
- [ ] Install and test the APK on a real device/emulator against the deployed backend before submitting

---

## 10. Documentation Requirements  **[MUST]**

README should contain:

1. **Overview** + features + tech stack
2. **Architecture** (one diagram: Web + Mobile → API → DB)
3. **Prerequisites** (Node version, Postgres, etc.)
4. **Database setup** — create DB, run migrations, seed command
5. **Backend setup** — install, `.env`, run dev/prod
6. **Web setup** — install, `.env`, run, build
7. **Mobile setup** — install, `.env`, run on emulator/device, **how to point the app at the deployed backend**, how the APK was built
8. **Environment variable table** (name, description, example, required?) for backend, web, mobile
9. **API documentation** — all endpoints with request/response examples (README, Postman collection, or Swagger/OpenAPI)
10. **ER diagram / schema**
11. **Deployment links** (web, backend, APK)
12. **Test credentials** (test user only)
13. **Design decisions & security notes** (short)
14. **Known limitations**

**Env variable reference (suggested)**

| App | Variable | Purpose |
|---|---|---|
| Backend | `PORT` | Server port |
| Backend | `NODE_ENV` | development / production |
| Backend | `DATABASE_URL` | DB connection string |
| Backend | `JWT_SECRET` | Token signing secret |
| Backend | `JWT_EXPIRES_IN` | e.g. `1d` |
| Backend | `BCRYPT_SALT_ROUNDS` | e.g. `10` |
| Backend | `CORS_ORIGIN` | Web app URL(s) |
| Backend | `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | Auth limiter |
| Web | `VITE_API_URL` | Backend base URL |
| Mobile | `EXPO_PUBLIC_API_URL` | Backend base URL |

Commit `.env.example` files; **never commit real `.env`**.

---

## 11. Bonus Features  **[BONUS — pick a few, do them well]**

Priority order by effort vs. payoff:

1. **Pagination + sorting** on `/projects` and `/tasks` (easy, visible)
2. **Docker support** — `docker-compose.yml` for backend + Postgres (easy, strong "easy to run" signal)
3. **Unit/integration tests** — Jest + Supertest: auth flow, validation errors, **cross-user access denied**
4. **CI/CD** — GitHub Actions: lint + test on PR
5. **Shared validation/types** — Zod package used by backend, web, mobile
6. **Refresh tokens** — short-lived access token + rotating refresh token; makes real logout possible
7. **Offline viewing on mobile** — cache last-fetched tasks (e.g., AsyncStorage/SQLite/React Query persist)
8. **Audit logs** — table recording create/update/delete actions
9. **RBAC** — roles (user/admin)
10. **Push notifications for tasks due tomorrow** — Expo Notifications + scheduled job (cron) on backend (hardest)

---

## 12. Screen Recording Script (5 min max)  **[MUST]**

1. (0:00) Show deployed web URL + backend health + APK on device
2. (0:30) Register account on **web**
3. (1:00) Log in with the **same account** on mobile
4. (1:30) Create a project + task on web → pull-to-refresh on mobile → it appears
5. (2:30) Create/edit a task on mobile → refresh web → it appears
6. (3:15) Show dashboard, search, filters on both
7. (4:00) Show error handling: no-network message on mobile; expired token → login screen
8. (4:30) Quick look at code structure / security (hashing, auth middleware, ownership checks)
9. (5:00) End

Rehearse once; keep under 5:00.

---

## 13. Suggested Build Order (Phases)

**Phase 1 — Foundation**
- [ ] Choose stack, init repo, `.gitignore`, `.env.example`
- [ ] Design schema, create migrations, seed script
- [ ] Draw ER diagram

**Phase 2 — Backend core**
- [ ] Express setup, config, logger, error handler, CORS, helmet
- [ ] Auth: register/login/me/logout + bcrypt + JWT + rate limiter
- [ ] Projects CRUD (with ownership + validation + search/filter)
- [ ] Tasks CRUD (with ownership via project + validation + search/filter)
- [ ] Dashboard endpoint
- [ ] Test everything in Postman/Thunder Client incl. two-user isolation tests
- [ ] Write API docs as you go

**Phase 3 — Deploy backend early**
- [ ] Deploy DB + backend; run migrations; verify with Postman against live URL (do this before building clients — it saves pain later)

**Phase 4 — Web**
- [ ] Auth pages + AuthContext + protected routes + API client w/ interceptors
- [ ] Dashboard, projects list, project detail + tasks
- [ ] Search/filter, validation, loading, error states, responsiveness
- [ ] Deploy web; set backend `CORS_ORIGIN`

**Phase 5 — Mobile**
- [ ] Expo project, navigation, API client, secure-store token wrapper
- [ ] Auth screens, dashboard, projects, tasks CRUD
- [ ] Pull-to-refresh, loading, validation
- [ ] 401 handling + no-network handling
- [ ] Build APK; test on device against deployed backend

**Phase 6 — Polish & submit**
- [ ] Bonus items
- [ ] README, env docs, API docs, ER diagram
- [ ] Clean code/lint, remove dead code and secrets
- [ ] Final cross-platform test pass (§14)
- [ ] Record video, submit all 7 items

---

## 14. Final QA Test Matrix

| Test | Expected |
|---|---|
| Register duplicate email | 409, clear message |
| Register invalid email / short password | 400 with field errors |
| Login wrong password | 401 generic message |
| 6+ rapid failed logins | 429 |
| Call protected API without token | 401 |
| Expired/tampered token | 401; web & mobile redirect to login with message |
| User B GET/PUT/DELETE user A's project | 404/403 |
| User B GET/PUT/DELETE user A's task | 404/403 |
| User B creates task in user A's project | 404/403 |
| Invalid enum (`status: "foo"`) | 400 |
| Empty-string name, invalid date, end < start | 400 |
| Response bodies | No `password_hash` anywhere |
| Create on web → refresh mobile | Appears |
| Create on mobile → refresh web | Appears |
| Dashboard counts | Match actual data for that user only |
| Mobile offline | Friendly message, no crash |
| Delete project | Its tasks are removed |
| SQL injection strings in search (`' OR 1=1 --`) | Treated as plain text |
| Token storage on Android | In SecureStore, not AsyncStorage |

---

## 15. Review Session Prep (be ready to explain)

- Why this stack? Why Prisma/ORM and how it prevents SQL injection
- How JWT works here; where tokens are stored on web vs mobile and why
- How logout works with stateless JWT (and tradeoffs / refresh tokens)
- How ownership is enforced for tasks (join via project)
- Why 404 vs 403 for others' resources
- How validation is shared/duplicated across layers; why backend validation is mandatory
- How rate limiting works and its limits (per-IP, proxies)
- What "pending" means on dashboard
- How CORS works and why it doesn't apply to the native app
- DB normalization and index choices
- What you'd improve with more time

---

## 16. Common Pitfalls

- Forgetting ownership checks on **tasks** (only checking projects)
- Mobile app still pointing at `localhost`
- Cleartext HTTP backend breaking the release APK
- Rate limiter blocking everyone behind a proxy (missing `trust proxy`)
- CORS blocking the deployed web app (wrong origin string, trailing slash)
- Committing `.env` / secrets
- Using AsyncStorage for the JWT on mobile
- Returning raw DB errors to clients
- Only validating on the frontend
- Leaving Prisma migrations unrun on the deployed DB
- Free-tier backend cold starts → show a loading state and mention it in the README
- Using real personal data (use test data only)
