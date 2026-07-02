# Implementation Plan for TTT-3: Create the Node.js Monorepo Foundation

## Summary

Set up a greenfield npm-workspaces monorepo with a Vite+React TypeScript frontend (`apps/web`) and an Express TypeScript backend (`apps/api`). Provide root scripts for dev, build, lint, and test; document environment variables and local setup; include Docker Compose for integration-test MongoDB.

## Files to Change

| Path | Action |
|------|--------|
| `README.md` | Rewrite — full local-setup guide per FR-7 |

## New Files

| Path | Purpose |
|------|---------|
| `package.json` | Root workspace config + scripts (npm workspaces) |
| `tsconfig.base.json` | Shared TypeScript compiler options |
| `.env.example` | Documented env vars (FR-6) |
| `.gitignore` | Standard Node ignores (node_modules, dist, .env) |
| `.nvmrc` | Pin Node.js version (18) |
| `docker-compose.test.yml` | MongoDB service for integration tests (FR-8) |
| `apps/web/package.json` | Frontend workspace package manifest |
| `apps/web/tsconfig.json` | Frontend TS config extending base |
| `apps/web/vite.config.ts` | Vite configuration |
| `apps/web/index.html` | Vite entry HTML |
| `apps/web/src/main.tsx` | React app entry point |
| `apps/web/src/App.tsx` | Minimal placeholder component |
| `apps/web/src/App.test.tsx` | Unit test for App component |
| `apps/web/.eslintrc.cjs` | ESLint config for frontend |
| `apps/api/package.json` | Backend workspace package manifest |
| `apps/api/tsconfig.json` | Backend TS config extending base |
| `apps/api/src/index.ts` | Express server entry (health endpoint, MongoDB connect) |
| `apps/api/src/index.test.ts` | Unit test (health endpoint, no DB required) |
| `apps/api/src/integration.test.ts` | Integration test (requires Docker MongoDB) |
| `apps/api/.eslintrc.cjs` | ESLint config for backend |

## Detailed Steps

### Step 1 — Root workspace scaffolding

1. Create root `package.json` with:
   - `"workspaces": ["apps/*"]`
   - `"private": true`
   - `"engines": { "node": ">=18" }`
   - Scripts:
     - `"dev": "concurrently --names web,api -c cyan,green \"npm run dev -w apps/web\" \"npm run dev -w apps/api\""`
     - `"build": "npm run build --workspaces"`
     - `"lint": "npm run lint --workspaces"`
     - `"test": "npm run test --workspaces"`
     - `"test:integration": "docker compose -f docker-compose.test.yml up -d && npm run test:integration -w apps/api; docker compose -f docker-compose.test.yml down"`
   - Dev dependency: `concurrently`
2. Create `tsconfig.base.json` with common strict TypeScript settings.
3. Create `.nvmrc` containing `18`.
4. Create `.gitignore` with standard Node/TS entries.
5. Create `.env.example` documenting `PORT_API`, `PORT_WEB`, `MONGODB_URI`.

### Step 2 — Frontend app (`apps/web`)

1. Create `apps/web/package.json` with:
   - `"name": "@chat-app/web"`
   - Dependencies: `react`, `react-dom`
   - Dev dependencies: `@vitejs/plugin-react`, `vite`, `typescript`, `@types/react`, `@types/react-dom`, `eslint`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
   - Scripts: `dev`, `build`, `preview`, `lint`, `test`
2. Create `apps/web/tsconfig.json` extending `../../tsconfig.base.json`.
3. Create `apps/web/vite.config.ts` with React plugin; configure dev server port from env (`PORT_WEB`, default 5173).
4. Create `apps/web/index.html` (standard Vite React template).
5. Create `apps/web/src/main.tsx` rendering `<App />`.
6. Create `apps/web/src/App.tsx` — minimal component ("Chat App" heading).
7. Create `apps/web/src/App.test.tsx` — renders without crashing.
8. Create `apps/web/.eslintrc.cjs` for React+TypeScript.

### Step 3 — Backend app (`apps/api`)

1. Create `apps/api/package.json` with:
   - `"name": "@chat-app/api"`
   - Dependencies: `express`, `mongodb` (native driver)
   - Dev dependencies: `typescript`, `tsx`, `@types/express`, `@types/node`, `eslint`, `vitest`, `supertest`, `@types/supertest`
   - Scripts: `dev` (`tsx watch src/index.ts`), `build` (`tsc`), `start` (`node dist/index.js`), `lint`, `test`, `test:integration`
2. Create `apps/api/tsconfig.json` extending `../../tsconfig.base.json`; set `outDir: "dist"`.
3. Create `apps/api/src/index.ts`:
   - Read `PORT_API` env var (default 3001) and `MONGODB_URI`.
   - Export an `app` (Express instance) with `GET /health` → `{ "status": "ok" }`.
   - On startup: connect to MongoDB (graceful failure logged, server still starts for health check).
   - Listen only when file is main entry (allow importing `app` for tests).
4. Create `apps/api/src/index.test.ts` — unit test hitting `/health` via supertest (no MongoDB required).
5. Create `apps/api/src/integration.test.ts` — connects to MongoDB (uses `MONGODB_URI` env), verifies DB ping; test file is separate so unit tests can run without Docker.
6. Create `apps/api/.eslintrc.cjs` for Node+TypeScript.

### Step 4 — Docker Compose for integration tests

1. Create `docker-compose.test.yml`:
   - Service `mongodb`: image `mongo:7`, port `27017:27017`, no auth, tmpfs for speed.
2. The root `test:integration` script starts Docker Compose, runs `apps/api` integration tests, then tears down.

### Step 5 — README

1. Rewrite `README.md` per FR-7:
   - Prerequisites (Node >= 18, npm >= 9, Docker for integration tests).
   - Install: `npm install`.
   - Dev: `npm run dev` (both) or per-workspace.
   - Build / Lint / Test commands.
   - MongoDB: `docker run --rm -p 27017:27017 mongo:7` for local dev.
   - Integration tests: `npm run test:integration`.
   - Agent validation section (the exact command sequence to verify everything works).

### Step 6 — Install and validate

1. Run `npm install` at root — must succeed with no errors.
2. Run `npm run lint` — must pass (0 errors).
3. Run `npm run build` — must succeed (both workspaces produce output).
4. Run `npm run test` — unit tests pass (no Docker/MongoDB needed).
5. Optionally verify `npm run dev` starts without crash (quick smoke, ctrl-c).

## Test Plan

| Level | Scope | Runner | Docker required? |
|-------|-------|--------|-----------------|
| Unit | `apps/web` — App renders | `vitest` | No |
| Unit | `apps/api` — GET /health returns 200 + `{"status":"ok"}` | `vitest` + `supertest` | No |
| Integration | `apps/api` — MongoDB connection + ping | `vitest` | Yes (docker-compose.test.yml) |

## Validation Commands

```bash
# Full validation sequence (run from repo root):
npm install
npm run lint
npm run build
npm run test

# Integration tests (requires Docker):
npm run test:integration
```

## Risks

| Risk | Mitigation |
|------|-----------|
| npm workspace hoisting conflicts | Keep dependencies explicit in each workspace; use `"engines"` to enforce Node >= 18 |
| MongoDB connection failure crashes API | Wrap connect in try/catch; log warning but don't exit — health check still works |
| Port conflicts in CI | Use env vars for all ports; document in `.env.example` |

## Rollback Plan

This is a greenfield story on a feature branch. Rollback = do not merge the PR; no production impact.

## PR Notes

- Title: `feat: scaffold Node.js monorepo with React frontend and Express API`
- Body should list acceptance criteria as a checklist and link to TTT-3.
- Reviewer should verify: `npm install && npm run lint && npm run build && npm run test` all pass from a clean clone.
