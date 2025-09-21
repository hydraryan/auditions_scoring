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

## Deploy (Render + Vercel)

### Backend (Render)
1. Push repo to GitHub (already done).
2. In Render → New → Blueprint → select this repo. It will read `render.yaml`.
3. Set environment variables on the service created:
	- `MONGODB_URI` = MongoDB Atlas connection string (or another reachable MongoDB)
	- `JWT_SECRET` = same secret you use locally (long random string)
	- `ARYAN_PASSWORD`, `KUNAL_PASSWORD` = initial passwords (used only if users missing)
4. Deploy. Health check path: `/api/debug/collections`. Take note of the public URL.

### Frontend (Vercel)
1. In Vercel → New Project → import this GitHub repo.
2. Project Settings:
	- Root Directory: `client`
	- Build Command: `npm run build`
	- Output Directory: `dist`
3. Environment Variables:
	- `VITE_API_BASE` = your backend public origin (e.g., `https://auditions-scoring.onrender.com`)
	  - Do NOT include `/api` — the client adds it automatically.
4. Deploy. The SPA routing is configured via `client/vercel.json`.

### Custom Domain (Vercel)
- Add your domain in Project → Settings → Domains.
- Either:
  - Use Vercel nameservers, or
  - Keep current DNS and add:
	 - Apex (yourdomain.com) A → `76.76.21.21`
	 - www CNAME → `cname.vercel-dns.com`

### Optional: API subdomain
- Create `api.yourdomain.com` as a CNAME to your backend host (Render hostname).
- Update Vercel `VITE_API_BASE` to `https://api.yourdomain.com` and redeploy.

### Smoke Test
- Open your deployed site → Login as `Aryan / aryan123` (or updated).
- Verify Students, Rounds, and Final Scores load and save.

## Monorepo Scripts
- `npm run dev` — runs both client and server concurrently
- `npm run build` — builds both
- `npm run lint` — lints both
- `npm run typecheck` — type checks both

## Notes
- First run will create required collections; ensure MongoDB service is running locally.
- Default users: Aryan and Kunal (passwords from env).
