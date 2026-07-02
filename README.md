# Chat App

A real-time chat application built with React and Node.js, organized as an npm workspaces monorepo.

## Prerequisites

- **Node.js** >= 18 (see `.nvmrc`)
- **npm** >= 9 (ships with Node 18+)
- **Docker** (required only for integration tests)

## Install

```bash
npm install
```

This installs dependencies for all workspaces (`apps/web` and `apps/api`).

## Development

### Run both apps concurrently

```bash
npm run dev
```

This starts the frontend dev server (Vite, default port 5173) and the backend API server (default port 3001) together.

### Run individually

```bash
# Frontend only
npm run dev -w apps/web

# Backend only
npm run dev -w apps/api
```

## Build

```bash
npm run build
```

Builds both workspaces. The frontend produces static assets via Vite; the backend compiles TypeScript to `apps/api/dist/`.

## Lint

```bash
npm run lint
```

Runs ESLint across all workspaces.

## Test

```bash
npm run test
```

Runs unit tests across all workspaces (no Docker or MongoDB required).

## MongoDB for Local Development

The API connects to MongoDB on startup. For local development, run MongoDB via Docker:

```bash
docker run --rm -p 27017:27017 mongo:7
```

Or copy `.env.example` to `.env` and set `MONGODB_URI` to point to your MongoDB instance.

## Integration Tests

Integration tests require a running MongoDB instance. Use Docker Compose:

```bash
npm run test:integration
```

This starts a MongoDB container, runs the API integration tests, and tears down the container automatically.

## Environment Variables

See `.env.example` for all configurable environment variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT_API` | API server port | `3001` |
| `PORT_WEB` | Web dev server port | `5173` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/chat-app` |

## Project Structure

```
/
├── apps/
│   ├── web/          # React SPA (Vite + TypeScript)
│   └── api/          # Express API (TypeScript)
├── package.json      # Root workspace config + scripts
├── tsconfig.base.json # Shared TypeScript settings
├── .env.example      # Environment variable documentation
├── docker-compose.test.yml  # MongoDB for integration tests
└── README.md
```

## Agent Validation

To verify the monorepo is correctly set up, run the following commands from the repository root:

```bash
npm install
npm run lint
npm run build
npm run test
```

All commands must exit with code 0. Integration tests (`npm run test:integration`) additionally require Docker to be available.
