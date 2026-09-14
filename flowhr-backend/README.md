# 🧩 FlowHR Backend

![Node](https://img.shields.io/badge/Node-20-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Postgres](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)
![Tests](https://img.shields.io/badge/tests-16%20passing-brightgreen)

A real Express + TypeScript + PostgreSQL API for the [FlowHR](https://flow-hr-one.vercel.app/) workflow designer — swaps its MSW-mocked API for one that actually persists and audits every run.

No login wall, no setup ceremony: clone it, point it at a database, and it's a working API.

## 🧱 Stack

| | |
| --- | --- |
| 🟢 **Runtime** | Node.js 20 + Express |
| 🔷 **Language** | TypeScript, strict mode |
| 🐘 **Database** | PostgreSQL via **Prisma** |
| ✅ **Validation** | Zod on every request body |
| 📧 **Email** | Resend, gated behind an env flag |
| 📝 **Logging** | pino — JSON in prod, pretty in dev |

<sup>Express over Fastify: the value here is the domain logic and REST surface, not raw throughput — ecosystem familiarity wins for a v1 at this scale.</sup>

## 🚀 Quick start (local)

```bash
npm install
cp .env.example .env        # edit DATABASE_URL, CORS_ORIGIN
npm run db:migrate:dev      # applies prisma/migrations
npm run db:seed             # creates a sample workflow
npm run dev                 # → http://localhost:4000
```

Need a free Postgres? [Neon](https://neon.tech) · [Supabase](https://supabase.com) · Render's own free tier.

## 🐳 Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

Spins up Postgres + the API together and runs migrations automatically. Seed once if you want demo data:

```bash
docker compose exec api npm run db:seed
```

## 🌱 Environment variables

| Variable | Required | Description |
| --- | :---: | --- |
| `NODE_ENV` | ➖ | `development` \| `test` \| `production` (default `development`) |
| `PORT` | ➖ | HTTP port (default `4000`) |
| `DATABASE_URL` | ✅ | Postgres connection string |
| `CORS_ORIGIN` | ✅ | Comma-separated allowed origins |
| `RESEND_API_KEY` | ➖ | Leave blank to simulate email sending |
| `EMAIL_FROM` | ➖ | From address for real sends |
| `EMAIL_SENDING_ENABLED` | ➖ | Must be `true` for `send_email` to actually call Resend |
| `RUN_RATE_LIMIT_MAX` | ➖ | Max `/run` calls per minute per IP (default `10`) |

Validated with Zod at boot (`src/config/env.ts`) — a bad config exits immediately instead of running broken.

## ☁️ Deploying to Render

1. Point Render at this `flowhr-backend/` folder as the service root.
2. New **Web Service** → environment **Docker** (picks up the `Dockerfile` automatically).
3. Attach a Render Postgres instance → copy its connection string into `DATABASE_URL`.
4. Set the rest of the env vars from the table above.
5. Deploy — `prisma migrate deploy` runs on every release automatically.
6. Point the frontend's API base URL at the new Render URL.

## 🔌 API surface

All routes live under `/api`. Success → `{ data }`. Errors → `{ error: { code, message } }`. 🔓 **No authentication** — everything is open, and workflows are global records.

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/automations` | `[{ id, label, params }]` |
| `GET` | `/api/workflows` | List all workflows |
| `POST` | `/api/workflows` | `{ name, definition }` |
| `GET` | `/api/workflows/:id` | |
| `PUT` | `/api/workflows/:id` | Partial update |
| `DELETE` | `/api/workflows/:id` | |
| `POST` | `/api/workflows/:id/run` | Validates → executes → persists a `WorkflowRun` |
| `GET` | `/api/workflows/:id/runs` | Run history |

## 🏗️ Architecture decisions

<details>
<summary><b>Why JSONB, not normalized graph tables</b></summary>

`Workflow.definition` stores the whole `{ version, name, nodes, edges }` document as `JSONB`.

- The node shape is heterogeneous and frontend-owned — normalizing means a wide, mostly-null table or one table per node kind, for zero query benefit.
- Nothing ever queries *into* the graph — it's always read/written as one whole document.
- JSONB isn't a compromise: GIN indexing and JSON path queries stay available if that ever changes.

The same reasoning applies to `WorkflowRun.resultLog` — an immutable audit record, read whole.
</details>

<details>
<summary><b>Why the server re-validates every graph, always</b></summary>

The frontend already validates client-side for a snappy UX, but `src/domain/graph/validate.ts` re-derives every check server-side before `/run` executes. A client-computed "valid" flag isn't a trust boundary — a stale client, a modified request, or an editor bug could otherwise submit a broken graph the server would run anyway.
</details>

<details>
<summary><b>Real execution vs. honest simulation</b></summary>

`POST /workflows/:id/run` walks the graph exactly like the old client-only "simulate" did, but automated steps are real: each `actionId` resolves to an executor, and `send_email` actually calls Resend when enabled. Task/approval steps are never faked as "completed" — a human hasn't acted, so they're logged as routed, not resolved. The honest middle ground between "fully fake" and "full workflow engine."

The engine and validator are pure functions with zero Express/Prisma imports — unit-tested in isolation the same way the frontend keeps `core/` framework-free.
</details>

<details>
<summary><b>Why responses are wrapped in <code>{ data }</code></b></summary>

The original MSW mocks returned bare payloads. This backend wraps every success in `{ data: ... }` for consistency with the `{ error }` envelope — a deliberate small deviation from exact mock parity, once real error handling was in play.
</details>

## 🔗 Frontend integration notes

The frontend currently has no backend URL wired up (MSW intercepts `/automations` and `/simulate` same-origin). To point it here:

1. Prefix a base URL (`VITE_API_URL`) onto every request in `src/api/client.ts`, namespaced under `/api`.
2. Update `useAutomations()` / `useSimulate()` to unwrap `{ data }`.
3. Disable or remove MSW once the real API is wired up.

*(These are frontend-side changes — not made by this repo.)*

## 🧪 Testing

```bash
npm test
```

Covers `src/domain/graph/validate.ts` and `src/domain/execution/engine.ts` — pure functions, no server or database needed to run them.

## 🚧 What's stubbed (v1 scope)

A scoped v1, not an enterprise system — called out on purpose rather than half-built:

- ⏳ **No job queue** — `/run` executes synchronously; a slow real integration would need a background worker.
- 👤 **No real approval flow** — approvals auto-resolve by threshold, no actual notify-and-click loop for a human.
- 🔓 **No authentication** — every route is open; multi-tenant use would need auth back plus an ownership column.
- 🔌 **Only `send_email` is real** — `generate_doc`, `create_ticket`, `slack_notify` are logged as simulated.
- 🧮 **Single-instance rate limiting** — in-memory store, wouldn't share state across scaled instances.
- 📄 **No pagination** — `GET /workflows` and `.../runs` return everything, fine at demo scale.
