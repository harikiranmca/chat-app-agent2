# Implementation Plan for TTT-4: Build the Backend Chat API with MongoDB and Docker Integration Tests

## Summary

Extend the existing Express API (`apps/api`) with `POST /messages` and `GET /messages` endpoints backed by MongoDB. Refactor `index.ts` to expose a shared `MongoClient`/`Db` instance, add JSON body parsing middleware, register a messages router, and add error-handling middleware. Rewrite the integration test file to exercise the full HTTP-to-database path against the Docker MongoDB container.

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/index.ts` | Modify | Add `express.json()`, refactor MongoClient into an exported `connectDb`/`getDb` pattern, register messages router, add error-handling middleware |
| `apps/api/src/integration.test.ts` | Rewrite | Full integration test suite for POST/GET /messages and error cases |

## New Files

| File | Purpose |
|------|---------|
| `apps/api/src/messages.ts` | Express Router with POST /messages and GET /messages handlers, including inline validation |
| `apps/api/src/db.ts` | Module exporting `connectDb(uri)`, `getDb()`, `getClient()`, and `closeDb()` for shared MongoDB access |

## Detailed Steps

### Step 1: Create the database module (`apps/api/src/db.ts`)

Create a module that manages a singleton MongoClient and exposes helpers for the rest of the app.

**Contents:**
- `let client: MongoClient | null` and `let db: Db | null` module-level variables.
- `connectDb(uri: string): Promise<Db>` — creates a MongoClient, connects, extracts the database from the URI, assigns both module vars, returns the Db.
- `getDb(): Db` — returns the cached Db or throws if not connected.
- `getClient(): MongoClient` — returns the cached client or throws.
- `closeDb(): Promise<void>` — closes the client and nulls out both vars.

**Key decisions:**
- Database name is derived from the URI (the `mongodb` driver does this via `client.db()`  when no arg is passed, using the dbName from the connection string — default `chat-app`).
- Types imported from `mongodb`: `MongoClient`, `Db`.

**Acceptance check:** File compiles (`npx tsc --noEmit` from `apps/api`).

---

### Step 2: Create the messages router (`apps/api/src/messages.ts`)

Create an Express Router with two routes.

**POST /messages:**
1. Extract `sender` and `content` from `req.body`.
2. Validate: both must be strings that are non-empty after `.trim()`. If invalid, respond `400 { error: "<description>" }`.
3. Create a document `{ sender: sender.trim(), content: content.trim(), createdAt: new Date() }`.
4. Insert into `getDb().collection('messages')`.
5. Respond `201` with `{ id: insertedId.toHexString(), sender, content, createdAt: createdAt.toISOString() }`.

**GET /messages:**
1. Query `getDb().collection('messages').find().sort({ createdAt: 1 }).toArray()`.
2. Map each doc to `{ id: doc._id.toHexString(), sender: doc.sender, content: doc.content, createdAt: doc.createdAt.toISOString() }`.
3. Respond `200` with the array (empty array if no docs).

**Wrap each handler body in try/catch:** on unexpected error, call `next(err)` to forward to the error-handling middleware.

**Exports:** `messagesRouter` (the Router instance).

**Import pattern:** `import { getDb } from './db.js';` (ESM `.js` extension required by this project's moduleResolution bundler convention observed in `index.test.ts`).

**Acceptance check:** File compiles.

---

### Step 3: Refactor `apps/api/src/index.ts`

Modify the existing file to wire everything together.

**Changes:**
1. Add `import { connectDb, closeDb } from './db.js';`
2. Add `import { messagesRouter } from './messages.js';`
3. Add `app.use(express.json());` before route registrations.
4. Register: `app.use('/messages', messagesRouter);` after the `/health` route.
5. Add a JSON-parse error-handling middleware (Express error handler with 4 params) **after** all routes:
   ```typescript
   app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
     if (err.type === 'entity.parse.failed' || err.status === 400) {
       return res.status(400).json({ error: 'Invalid JSON' });
     }
     console.error('Unexpected error:', err);
     res.status(500).json({ error: 'Internal server error' });
   });
   ```
   (Use type assertion or interface augmentation for `err.type` / `err.status` since Express typing is loose here.)
6. Refactor the `start()` function: replace inline `new MongoClient(...)` with `await connectDb(MONGODB_URI);`.
7. Keep the existing `export { app };` — also add `export { connectDb, closeDb }` re-exports so integration tests can manage the connection lifecycle without importing `db.js` separately (optional convenience; tests can also import from `./db.js` directly).

**Preserve:**
- `GET /health` route (unchanged).
- The `isMainModule` guard and `start()` call.
- The `PORT` and `MONGODB_URI` constants.

**Acceptance check:** `npx tsc --noEmit` passes; existing unit test (`index.test.ts`) still passes (`npm test -w apps/api`).

---

### Step 4: Update the unit test (`apps/api/src/index.test.ts`) if needed

The existing test imports `app` and tests `GET /health`. Since we added `express.json()` middleware and the error handler, verify the test still passes without modification. No changes expected — the health route does not use JSON parsing. If the test breaks due to the MongoDB connection attempt at import time, confirm it does not (the `start()` function is guarded by `isMainModule` check and `VITEST` env var).

**Acceptance check:** `npm test -w apps/api` passes (unit tests only).

---

### Step 5: Rewrite integration tests (`apps/api/src/integration.test.ts`)

Replace the existing ping-only test with a full suite.

**Structure:**
```typescript
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { MongoClient, Db } from 'mongodb';
import { app } from './index.js';
import { connectDb, closeDb } from './db.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';
let db: Db;

beforeAll(async () => {
  db = await connectDb(MONGODB_URI);
});

beforeEach(async () => {
  await db.collection('messages').deleteMany({});
});

afterAll(async () => {
  await closeDb();
});
```

**Test cases to include:**

1. **POST /messages - success:** Send valid body, assert 201, assert response shape (`id` is 24-char hex, `sender`, `content`, `createdAt` is ISO string). Verify document exists in DB.
2. **POST /messages - missing sender:** Send `{ content: "hi" }`, assert 400, assert `error` field in response.
3. **POST /messages - empty sender after trim:** Send `{ sender: "  ", content: "hi" }`, assert 400.
4. **POST /messages - missing content:** Send `{ sender: "Alice" }`, assert 400.
5. **POST /messages - empty content after trim:** Send `{ sender: "Alice", content: "   " }`, assert 400.
6. **POST /messages - malformed JSON:** Send raw string with Content-Type application/json, assert 400 with `error` field.
7. **GET /messages - empty collection:** Assert 200 with `[]`.
8. **GET /messages - returns messages in chronological order:** Insert 2-3 messages via POST, then GET and verify order by `createdAt`.
9. **GET /messages - response shape:** Verify each element has `id`, `sender`, `content`, `createdAt` and no `_id`.
10. **POST /messages - extra fields ignored:** Send `{ sender: "A", content: "B", extra: "C" }`, assert 201, verify response does not include `extra`.

**Acceptance check:** `npm run test:integration -w apps/api` passes (requires Docker MongoDB running).

---

### Step 6: Verify the full pipeline

Run all verification commands end-to-end.

## Test Plan

- **Unit tests** (`npm test -w apps/api`): Existing health check test must continue passing. No new unit tests needed (the messages logic is covered by integration tests against real MongoDB).
- **Integration tests** (`npm run test:integration` from repo root, or `npm run test:integration -w apps/api` with Docker MongoDB running): 10+ test cases covering success paths, validation errors, malformed JSON, empty state, and chronological ordering.
- **Type checking** (`npx tsc --noEmit` from `apps/api`): All new files must compile under strict mode.
- **Linting** (`npm run lint -w apps/api`): No lint errors or warnings (`--max-warnings 0`).

## Validation Commands

Run from the repository root (`/work/TTT-4`):

```bash
# Type-check the API workspace
npx tsc --noEmit -p apps/api/tsconfig.json

# Lint the API workspace
npm run lint -w apps/api

# Unit tests (no Docker needed)
npm test -w apps/api

# Integration tests (Docker MongoDB must be running)
docker compose -f docker-compose.test.yml up -d
npm run test:integration -w apps/api
docker compose -f docker-compose.test.yml down
```

Or use the root-level convenience script which handles Docker lifecycle:
```bash
npm run test:integration
```

## Risks

| Risk | Mitigation |
|------|------------|
| `connectDb` called in integration tests before `start()` — potential double-connection | The `db.ts` module guards with a singleton pattern; `connectDb` is idempotent if client is already connected, or tests manage the lifecycle exclusively |
| ESM import path errors (`.js` extension) | Follow the established pattern from `index.test.ts` — always use `.js` suffix |
| Express error-handler typing issues (`err.type`) | Use a type assertion `(err as any).type` or define a local interface; eslint rule `@typescript-eslint/no-explicit-any` is not enabled in the current config |
| MongoDB not available when running unit tests | Unit test script (`npm test`) excludes `integration.test.ts` via `--exclude` flag (already configured) |
| `app` exported without middleware if imported before `connectDb` is called | Middleware is registered at module load time (synchronous); only the DB connection is async and managed by tests via `beforeAll` |

## Rollback Plan

All changes are additive (new files) or backward-compatible modifications to `index.ts`. To rollback:
1. Revert the commit on the `agent/TTT-4` branch.
2. The existing `GET /health` endpoint and unit test remain unchanged in the base branch.

## PR Notes

- This PR adds `POST /messages` and `GET /messages` endpoints to the Express API.
- MongoDB integration uses the native driver (already a dependency).
- Integration tests require Docker (mongo:7) and are run via `npm run test:integration`.
- The `db.ts` module provides a clean separation for database lifecycle management, making it easy to test and extend.
- No new dependencies are introduced.
