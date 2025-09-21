# The Draft – Auditions Hub

Full-stack web app for managing auditions scoring with a cinematic Netflix-style UI.

## Stack
- Client: Vite + React + TypeScript + Tailwind CSS
- Server: Node.js + Express + TypeScript + Mongoose (MongoDB)
- Database: MongoDB (local)

## Quick Start (Windows PowerShell)

1. Create a `.env` from `.env.example` at the project root and fill values.
2. Install all dependencies:

```powershell
npm install
```

3. Start client and server together:

```powershell
npm run dev
```

- Client runs on http://localhost:5173
- Server runs on http://localhost:4001

## Environment
Create an `.env` file in the project root:

```
# Server
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/auditions_scoring
JWT_SECRET=please-change-me
ARYAN_PASSWORD=replace-with-secure
KUNAL_PASSWORD=replace-with-secure

# Client
VITE_API_BASE=http://localhost:4001
```

## Monorepo Scripts
- `npm run dev` — runs both client and server concurrently
- `npm run build` — builds both
- `npm run lint` — lints both
- `npm run typecheck` — type checks both

## Notes
- First run will create required collections; ensure MongoDB service is running locally.
- Default users: Aryan and Kunal (passwords from env).
