# Implementation Plan for TTT-5: Build the React Chat SPA and Connect It to the API

## Summary

Implement a React single-page chat UI in `apps/web` that connects to the existing `apps/api` backend. The implementation adds: a typed API client, a `MessageList` component, a `MessageForm` component, loading/error states, responsive CSS, a Vite dev proxy for CORS, and updates the existing test. All state is local React state; no external libraries are added beyond what is already in `package.json`.

## Files to Change

| File | Purpose |
|------|---------|
| `apps/web/vite.config.ts` | Add dev server proxy `/api` -> `http://localhost:3001` to solve CORS |
| `apps/web/src/App.tsx` | Rewrite to orchestrate state, fetch lifecycle, and compose child components |
| `apps/web/src/App.test.tsx` | Update to validate the rewritten App renders correctly (mocked fetch) |
| `apps/web/src/main.tsx` | Import `App.css` at entry point (no other changes needed) |
| `.env.example` | Add `VITE_API_URL=http://localhost:3001` |

## New Files

| File | Purpose |
|------|---------|
| `apps/web/src/types.ts` | Shared `Message` interface |
| `apps/web/src/api.ts` | `getMessages()` and `sendMessage()` functions wrapping native fetch |
| `apps/web/src/components/MessageList.tsx` | Presentational component: renders message array or "No messages yet" |
| `apps/web/src/components/MessageForm.tsx` | Controlled form: sender input, content input, Send button, validation |
| `apps/web/src/App.css` | All styles: responsive layout, message bubbles, form, loading/error states |
| `apps/web/src/vite-env.d.ts` | Vite client types reference (`/// <reference types="vite/client" />`) |

## Detailed Steps

### Step 1: Add Vite environment type declaration

Create `apps/web/src/vite-env.d.ts` with the standard Vite client types triple-slash reference. This ensures `import.meta.env.VITE_API_URL` is recognized by TypeScript.

```typescript
/// <reference types="vite/client" />
```

### Step 2: Define the Message type

Create `apps/web/src/types.ts`:

```typescript
export interface Message {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
}
```

This matches the shape returned by `GET /messages` in `apps/api/src/messages.ts` (lines 38-43).

### Step 3: Implement the API client

Create `apps/web/src/api.ts` with two exported functions:

- `getMessages(): Promise<Message[]>` -- calls `GET ${API_URL}/messages`, throws on non-ok response.
- `sendMessage(sender: string, content: string): Promise<Message>` -- calls `POST ${API_URL}/messages` with JSON body, throws with error message from body on non-ok response.

The base URL is resolved from `import.meta.env.VITE_API_URL` with a fallback to `http://localhost:3001`. Handle trailing slash by stripping it if present.

### Step 4: Configure Vite dev proxy for CORS

Modify `apps/web/vite.config.ts` to add a `server.proxy` entry. This avoids needing to add `cors` middleware to the API (keeping the backend unchanged for this story). The proxy forwards requests from the Vite dev server to the backend API on port 3001:

```typescript
server: {
  port: parseInt(process.env.PORT_WEB || '5173', 10),
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
},
```

Note: The `api.ts` client will use `VITE_API_URL` directly (defaulting to `http://localhost:3001`). The proxy is an alternative for development when the client uses a relative URL. For maximum flexibility, document both approaches; the primary approach will be direct URL via `VITE_API_URL` (the proxy is optional and included for convenience).

**Decision:** Use direct fetch to the `VITE_API_URL` (absolute URL) as the primary approach. Add `cors` package to the API as a dev dependency to enable cross-origin requests during development. This is simpler and more transparent than a proxy rewrite. The Vite proxy will NOT be used because it introduces a path mapping that diverges from production behavior.

**Revised approach for CORS:** Add the `cors` npm package to `apps/api` and enable it in `apps/api/src/index.ts`. This is the simplest, most production-representative solution.

### Step 4 (revised): Add CORS support to the backend API

Add `cors` package to `apps/api`:

1. In `apps/api/package.json`, add `"cors": "^2.8.5"` to dependencies and `"@types/cors": "^2.8.17"` to devDependencies.
2. In `apps/api/src/index.ts`, import `cors` and add `app.use(cors())` before the JSON body parser.

This is a minimal, low-risk change that correctly represents production behavior (the API should serve any origin for a public chat app).

### Step 5: Implement the MessageList component

Create `apps/web/src/components/MessageList.tsx`:

- Props: `messages: Message[]`
- Renders each message as a `<div>` or `<article>` showing sender (bold), content, and formatted timestamp.
- If `messages.length === 0`, renders a "No messages yet" placeholder.
- Timestamps formatted using `new Date(createdAt).toLocaleString()` for readability.

### Step 6: Implement the MessageForm component

Create `apps/web/src/components/MessageForm.tsx`:

- Props: `onSend: (sender: string, content: string) => Promise<void>`, `isSending: boolean`
- Local state: `sender` (persists across sends), `content` (cleared on success).
- The Send button is disabled when:
  - `sender.trim()` is empty OR `content.trim()` is empty, OR
  - `isSending` is true.
- On submit (button click or Enter in content field): calls `onSend(sender.trim(), content.trim())`, clears content on success.
- Enter key in the content field submits the form; Enter in sender field does NOT submit (moves focus to content).

### Step 7: Rewrite App.tsx to orchestrate state and layout

Rewrite `apps/web/src/App.tsx`:

- Local state:
  - `messages: Message[]` (initially empty)
  - `loading: boolean` (true during initial GET)
  - `sending: boolean` (true during POST)
  - `error: string | null` (set on GET or POST failure; cleared on next success)
- `useEffect` on mount: call `getMessages()`, set `messages` on success, set `error` on failure, set `loading = false`.
- `handleSend` async function: set `sending = true`, call `sendMessage(sender, content)`, on success re-fetch via `getMessages()` and update `messages`, on failure set `error`, finally set `sending = false`.
- Render structure:
  ```
  <div className="app">
    <h1>Chat App</h1>
    {error && <div className="error" role="alert">{error} <button onClick={dismiss}>x</button></div>}
    {loading ? <p className="loading">Loading messages...</p> : <MessageList messages={messages} />}
    <MessageForm onSend={handleSend} isSending={sending} />
  </div>
  ```
- The error is dismissible (clicking "x" sets error to null). Error also auto-clears on next successful action (fetch or send).

### Step 8: Create responsive CSS

Create `apps/web/src/App.css`:

- `.app` container: `max-width: 640px`, `margin: 0 auto`, `padding: 1rem`.
- Message list: vertical stack, each message with subtle border/separator.
- Message item: sender bold, timestamp muted/small, content normal.
- Form: stacked on mobile, sender/content inputs full-width, send button below.
- `.loading` and `.error` styles: centered, error with red background/border, dismiss button.
- Media queries for tablet/desktop adjustments (e.g., form fields inline on wide screens).
- Word-wrap for long messages: `overflow-wrap: break-word`.

Import this CSS in `apps/web/src/main.tsx` (or in `App.tsx`).

### Step 9: Update the existing test

Rewrite `apps/web/src/App.test.tsx`:

- Mock `global.fetch` (or mock `./api.ts` module) to return an empty messages array for the initial GET.
- Assert the heading "Chat App" still renders.
- Optionally assert "No messages yet" placeholder appears after loading completes.
- Use `@testing-library/react` and `vitest` as already configured.

### Step 10: Update .env.example

Add `VITE_API_URL=http://localhost:3001` to the root `.env.example` file.

### Step 11: Install cors dependency in apps/api

Run `npm install cors` and `npm install -D @types/cors` in the `apps/api` workspace (or manually add to `package.json` and run `npm install` from root).

## Test Plan

- **Unit test (apps/web):** `apps/web/src/App.test.tsx` verifies App renders heading and message list with mocked fetch. Run via `npm run test -w apps/web`.
- **Type checking:** `npx tsc --noEmit` in `apps/web` ensures all new code passes strict TypeScript checks.
- **Lint:** `npm run lint -w apps/web` passes with zero warnings.
- **Build:** `npm run build -w apps/web` succeeds (Vite production build).
- **API lint/type-check:** `npm run lint -w apps/api` and `npx tsc --noEmit` in `apps/api` still pass after adding cors.
- **Manual verification:** Not automated, but the implementation agent should confirm that `npm run dev` starts without errors (build compiles).

## Validation Commands

```bash
# From repository root /work/TTT-5

# Install dependencies (needed after adding cors)
npm install

# Type-check web app
cd apps/web && npx tsc --noEmit

# Lint web app
npm run lint -w apps/web

# Run web tests
npm run test -w apps/web

# Build web app (production Vite build)
npm run build -w apps/web

# Type-check API (after cors addition)
cd apps/api && npx tsc --noEmit

# Lint API
npm run lint -w apps/api

# Run API unit tests (exclude integration)
npm run test -w apps/api
```

## Risks

| Risk | Mitigation |
|------|------------|
| Adding `cors` to the API is a cross-cutting change outside TTT-5 scope | The change is minimal (2 lines + 1 dependency) and is required by the spec's "CORS consideration". It does not break existing API behavior. |
| `import.meta.env.VITE_API_URL` undefined in tests | The api.ts module defaults to `http://localhost:3001`; tests mock fetch so the URL is irrelevant. |
| Existing `App.test.tsx` breaks after rewrite | The plan explicitly updates the test in Step 9 to match the new rendering. |
| `@testing-library/jest-dom` matchers not configured | The test file currently uses `toBeDefined()` (native vitest matcher), not jest-dom matchers. The updated test will continue using vitest-native assertions or add a setup file if needed. |

## Rollback Plan

All changes are confined to:
- `apps/web/src/` (new and modified files)
- `apps/web/vite.config.ts` (unchanged if proxy approach is not used)
- `apps/api/package.json` and `apps/api/src/index.ts` (cors addition)
- `.env.example` (one line added)

To rollback: revert the commit on `agent/TTT-5`. The API continues to function without cors (just cannot be called cross-origin from a browser). The web app returns to its placeholder state.

## PR Notes

- **Title:** feat(web): implement React chat SPA with API integration
- **Summary:** Implements the full chat UI in `apps/web` per TTT-5 spec: message list, message form with sender persistence, loading/error states, responsive CSS, and API integration via native fetch. Adds `cors` middleware to `apps/api` to enable cross-origin requests.
- **Testing:** Unit tests pass, lint clean, TypeScript strict mode satisfied, production build succeeds.
- **CORS approach:** Added `cors` package to the API rather than a Vite proxy, as it better represents production behavior and keeps the frontend simple (direct fetch to `VITE_API_URL`).
