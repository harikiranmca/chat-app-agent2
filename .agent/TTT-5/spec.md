# Specification for TTT-5: Build the React Chat SPA and Connect It to the API

## Summary

Build a React single-page chat application in `apps/web` that connects to the existing backend API (`apps/api`). The UI allows users to view existing messages, enter a sender name and message content, and send messages to the backend. The app uses the already-scaffolded Vite + React 18 + TypeScript setup and keeps all state local (no global state management, routing, auth, or design system).

## Goals

- Provide a functional, responsive chat interface that loads and displays messages from the backend API.
- Allow users to compose and send messages (sender name + content) via the backend `POST /messages` endpoint.
- Show loading and error states so users have clear feedback at all times.
- Make the API base URL configurable through a Vite environment variable (`VITE_API_URL`).

## Non-Goals

- No client-side routing (single page only).
- No authentication or authorization.
- No global state management library (Redux, Zustand, etc.) -- use local React state only.
- No design system or component library (e.g., Material UI, Chakra).
- No functional/integration test setup (unit tests for utilities are acceptable but not required).
- No real-time updates (WebSocket, polling) -- messages refresh only on initial load and after a successful send.
- No pagination or infinite scroll for messages.

## User Flow

1. User opens the app in a browser.
2. The app fetches existing messages from `GET /messages` and displays them in chronological order (oldest first).
3. While messages are loading, a loading indicator is shown.
4. If the fetch fails, an error message is displayed to the user.
5. User enters their name in the "sender" input field.
6. User enters a message in the "content" input field.
7. User clicks the "Send" button (or presses Enter).
8. If either field is empty/whitespace-only, the form is not submitted and the user is informed.
9. On submit, the app calls `POST /messages` with `{ sender, content }`.
10. While sending, the send button shows a loading/disabled state to prevent double-submit.
11. On success (201), the app re-fetches all messages from `GET /messages` to refresh the list.
12. On failure, an error message is displayed to the user (the form remains populated so they can retry).

## Functional Requirements

### FR-1: Message List Component

- Displays all messages returned by `GET /messages`.
- Each message shows: sender name, message content, and timestamp (formatted for readability).
- Messages are displayed in chronological order (API already returns them sorted by `createdAt` ascending).
- If there are no messages, display a placeholder (e.g., "No messages yet").

### FR-2: Message Input Form

- A text input for "sender" (the user's display name).
  - The sender value persists across sends within the same session (user does not have to re-type their name).
- A text input (or textarea) for "content" (the message body).
  - The content field is cleared after a successful send.
- A "Send" button that submits the form.
- Form submission also triggers on pressing Enter in the content field.
- Client-side validation: both `sender` and `content` must be non-empty (trimmed) before submission is allowed.
  - The Send button is disabled when either field is empty.
  - Optionally, a subtle inline hint can indicate required fields.

### FR-3: Loading State

- On initial page load, while `GET /messages` is in flight, display a loading indicator (e.g., "Loading messages...").
- While `POST /messages` is in flight, the Send button is disabled and shows a sending state (e.g., "Sending...").

### FR-4: Error State

- If `GET /messages` fails (network error, non-2xx response), display a user-facing error message (e.g., "Failed to load messages. Please try again.").
- If `POST /messages` fails, display a user-facing error message near the form (e.g., "Failed to send message. Please try again.").
- Error messages are dismissible or auto-clear on the next successful action.

### FR-5: API Integration

- **Base URL:** Read from `import.meta.env.VITE_API_URL`. Default to `http://localhost:3001` if not set.
- **GET /messages:**
  - Method: GET
  - URL: `${VITE_API_URL}/messages`
  - Response (200): `Array<{ id: string; sender: string; content: string; createdAt: string }>`
- **POST /messages:**
  - Method: POST
  - URL: `${VITE_API_URL}/messages`
  - Headers: `Content-Type: application/json`
  - Body: `{ "sender": "<trimmed>", "content": "<trimmed>" }`
  - Success response (201): `{ id: string; sender: string; content: string; createdAt: string }`
  - Error response (400): `{ error: string }` -- validation failure
  - Error response (5xx): `{ error: string }` -- server error
- Use the native `fetch` API (no axios or other HTTP library needed).

### FR-6: Environment Configuration

- The Vite environment variable `VITE_API_URL` configures the API base URL at build time.
- Add `VITE_API_URL=http://localhost:3001` to the root `.env.example` file.
- Document usage in a comment or the existing README if applicable.

### FR-7: Responsive Design

- The UI adapts to different screen widths (mobile, tablet, desktop).
- Use plain CSS (or a CSS file imported into the component) -- no CSS-in-JS library or design system.
- Minimum viable responsive layout: the message list and form stack vertically and scale to the viewport width.
- Use sensible max-width for the chat container on wide screens.

### FR-8: Refresh After Successful Send

- After a successful `POST /messages`, immediately call `GET /messages` to refresh the full message list.
- This ensures the UI reflects the server-authoritative state (including messages from other users if any).

## Acceptance Criteria

1. App loads existing messages from the backend on startup.
2. User can enter a sender name and a message.
3. The Send button posts the message to the backend via `POST /messages`.
4. Newly sent messages appear in the list after a successful send (via re-fetch).
5. Empty or whitespace-only messages cannot be submitted (client-side validation prevents it).
6. API errors (network failures, non-2xx responses) are shown to the user.
7. API base URL is configurable through `VITE_API_URL` environment variable.
8. UI is simple and responsive (works on mobile and desktop viewports).
9. No functional test setup is required for the UI (existing placeholder test may be updated but no integration/E2E tests needed).

## Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Backend is unreachable on page load | Show error message; form is still visible so user can retry (or a retry button is available). |
| Backend returns empty message array | Show "No messages yet" placeholder. |
| User submits while a send is already in flight | Send button is disabled during send; prevents double-submit. |
| User enters only whitespace in sender or content | Treated as empty; form does not submit. |
| API returns 400 (validation error) | Display the error from the response body to the user. |
| API returns 500 (server error) | Display a generic error message to the user. |
| Network timeout or connection refused on POST | Display error; form retains user input for retry. |
| Very long message or sender name | Allow submission (backend does not enforce a max length currently); UI should handle overflow gracefully (word-wrap). |
| VITE_API_URL not set | Default to `http://localhost:3001`. |
| VITE_API_URL set with trailing slash | Handle gracefully (strip or tolerate trailing slash in URL construction). |

## Dependencies

- **Backend API (TTT-4):** `apps/api` must be running and accessible at the configured `VITE_API_URL`. The API provides `GET /messages` and `POST /messages`.
- **MongoDB:** Required by the backend API (not a direct dependency of the frontend).
- **Existing scaffold:** `apps/web` already has Vite, React 18, TypeScript, ESLint, vitest, and @testing-library/react configured (`apps/web/package.json`, `apps/web/vite.config.ts`).

## Open Decisions

None -- all requirements are sufficiently specified by the story and the existing codebase conventions.

## Implementation Notes

- **Source of truth for the API contract:** `apps/api/src/messages.ts` -- the router defines the exact request/response shapes.
- **TypeScript strict mode** is enforced via `tsconfig.base.json` (`"strict": true`). All new code must type-check cleanly.
- **ESLint** is configured in `apps/web/.eslintrc.cjs` with `--max-warnings 0`; code must pass lint with zero warnings.
- **Existing test:** `apps/web/src/App.test.tsx` tests that the heading renders. This test should be updated to remain passing after the App component is rewritten.
- **CSS approach:** Use a simple CSS file (e.g., `src/App.css` or `src/index.css`) imported into the component tree. No CSS modules or styled-components needed given the small scope.
- **File structure suggestion (non-binding):**
  - `src/api.ts` -- fetch wrapper functions (`getMessages`, `sendMessage`)
  - `src/types.ts` -- shared TypeScript interfaces (`Message`)
  - `src/App.tsx` -- main app component orchestrating state and layout
  - `src/components/MessageList.tsx` -- renders the list of messages
  - `src/components/MessageForm.tsx` -- sender input, content input, send button
  - `src/App.css` -- styles
- **Vite env var usage:** Access via `import.meta.env.VITE_API_URL` (Vite exposes only `VITE_`-prefixed env vars to client code at build time).
- **No CORS concern in dev:** If the Vite dev server and API are on different ports, Vite's proxy config or the backend's CORS headers will be needed. The backend currently does not set CORS headers, so a Vite proxy (`vite.config.ts` > `server.proxy`) pointing `/api` to the backend is a practical approach, OR add `cors` middleware to the API. Implementation plan should address this.
