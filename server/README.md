# GORAS Backend (Express + SQLite)

This is a minimal backend for authentication using SQLite (via `better-sqlite3`). It provides:

- Signup (`POST /api/auth/signup`)
- Login (`POST /api/auth/login`) — returns JWT
- Admin list users (`GET /api/admin/users`) — protected route, requires admin JWT

Features:
- Passwords hashed with `bcrypt`
- JWT-based authentication
- Admin seeding via env vars
- Basic security with `helmet` and `express-rate-limit`

Quick start

1. Copy `.env.example` to `.env` in `server/` and set values.
2. Install dependencies:

```powershell
cd server
npm install
```

3. Start in development (requires `nodemon`):

```powershell
npm run dev
```

Or start in production:

```powershell
npm start
```

Environment variables (see `.env.example`)

Integration with CRA frontend

- If your CRA frontend runs on port 3000, set `CLIENT_URL=http://localhost:3000` in the server `.env`.
- To avoid CORS during development you can also set `proxy` in your frontend `package.json` to `"http://localhost:5000"`.

Security & deployment notes

- Set a strong `JWT_SECRET` in production and keep it in your deployment environment (never commit it).
- For larger deployments consider Postgres or other managed DBs; the code uses SQLite for simplicity and local/low-traffic deployments.

