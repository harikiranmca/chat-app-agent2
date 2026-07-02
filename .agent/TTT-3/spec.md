# Specification for TTT-3: Create the Node.js Monorepo Foundation

## Summary

Set up a monorepo containing a React SPA (`apps/web`) and a Node.js backend microservice (`apps/api`) using a standard workspace tool. The repo is currently empty (greenfield).

## Goals

- Establish a clear, conventional monorepo structure (`apps/web`, `apps/api`).
- Configure workspace-level package management (npm or pnpm workspaces).
- Provide root-level scripts: `install`, `dev`, `build`, `lint`, `test`.
- Allow each app to be started independently.
- Provide a single root `dev` command that runs both apps concurrently.
- Document environment variables, local setup, MongoDB dependency, Docker-based API integration tests, and how agents should run validation.

## Non-Goals

- Implementing application features (auth, chat, etc.) — this story is infrastructure only.
- CI/CD pipeline setup (separate story).
- Production deployment configuration.
- Adding a shared packages/libraries workspace (can be added later if needed).

## User Flow

Developers (and agents) clone the repo and run:

1. `npm install` (or `pnpm install`) at root — installs all workspace dependencies.
2. `npm run dev` — starts both frontend and backend concurrently.
3. Alternatively, `npm run dev --workspace=apps/web` or `npm run dev --workspace=apps/api` to start one app.
4. `npm run build` — builds all workspaces.
5. `npm run lint` — lints all workspaces.
6. `npm run test` — runs unit tests across workspaces.

## Functional Requirements

### FR-1: Repository structure

```
/
├── apps/
│   ├── web/          # React SPA
│   │   ├── package.json
│   │   └── src/
│   └── api/          # Node.js backend microservice
│       ├── package.json
│       └── src/
├── package.json      # root workspace config + scripts
├── .env.example      # documented environment variables
└── README.md         # local setup guide
```

### FR-2: Workspace configuration

- Use **npm workspaces** (simplest, no extra tooling) with the `workspaces` field in root `package.json`.
- Each app has its own `package.json` with app-specific dependencies and scripts.

### FR-3: Root scripts

| Script | Behavior |
|--------|----------|
| `install` | Handled by `npm install` at root (workspace-aware). |
| `dev` | Runs `apps/web` and `apps/api` dev servers concurrently (e.g., via `concurrently` or `npm-run-all2`). |
| `build` | Builds both workspaces (`npm run build --workspaces`). |
| `lint` | Lints both workspaces (`npm run lint --workspaces`). |
| `test` | Runs unit tests in both workspaces (`npm run test --workspaces`). |

### FR-4: Frontend app (`apps/web`)

- Bootstrapped with Vite + React (TypeScript).
- Dev server starts independently via `npm run dev` within `apps/web`.
- Minimal placeholder page (e.g., "Hello World") to prove the app runs.

### FR-5: Backend app (`apps/api`)

- Node.js + Express (TypeScript) microservice.
- Dev server starts independently via `npm run dev` within `apps/api` (e.g., using `tsx --watch` or `nodemon`).
- Health-check endpoint (`GET /health`) returning `{ "status": "ok" }`.
- Connects to MongoDB (connection string from environment variable).

### FR-6: Environment variables

Document in `.env.example`:

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT_API` | API server port | `3001` |
| `PORT_WEB` | Web dev server port | `5173` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/chat-app` |

### FR-7: README documentation

The root `README.md` must explain:

- Local setup prerequisites (Node.js version, npm version).
- How to install dependencies.
- How to start development (all together and individually).
- MongoDB dependency and how to run it locally (Docker one-liner).
- How to run Docker-based API integration tests.
- How agents should run validation (the sequence of commands to verify everything works).

### FR-8: Docker-based API integration tests

- A `docker-compose.test.yml` (or similar) that spins up MongoDB for integration tests.
- A test script in `apps/api` that runs integration tests against the Dockerized MongoDB.
- Root-level script or documentation to invoke this.

## Acceptance Criteria

1. Repository uses `apps/web` and `apps/api` structure.
2. npm workspaces configured at root.
3. Root scripts exist: `dev`, `build`, `lint`, `test`.
4. Frontend starts independently (`cd apps/web && npm run dev`).
5. Backend starts independently (`cd apps/api && npm run dev`).
6. Root `npm run dev` runs both apps together.
7. `.env.example` documents all environment variables.
8. `README.md` explains local setup, MongoDB dependency, Docker-based integration tests, and agent validation steps.

## Edge Cases

- `npm install` at root must not fail if MongoDB is not running (install is dependency-only, not runtime).
- `npm run build` must succeed without a running backend or database.
- `npm run test` for unit tests must not require Docker or MongoDB (integration tests are separate).

## Dependencies

- **Node.js** >= 18 (LTS).
- **npm** >= 9 (ships with Node 18+; supports workspaces natively).
- **MongoDB** — required at runtime for the API; provided via Docker for integration tests.
- **Docker** — required only for integration tests, not for local dev unit testing.

## Open Decisions

None — the Jira story and agent notes provide sufficient direction. npm workspaces chosen per the "simple conventional setup" guidance.

## Implementation Notes

- Use `concurrently` package at root for the combined `dev` script (lightweight, widely used).
- TypeScript in both apps for type safety; shared `tsconfig` base is optional but not required for this story.
- ESLint for linting in both apps.
- Vitest or Jest for unit tests (Vitest preferred for Vite-based frontend; Jest acceptable for API).
- Integration test setup: `docker compose -f docker-compose.test.yml up -d` before running API integration tests.
