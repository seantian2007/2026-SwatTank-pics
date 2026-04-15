# Patina Waitlist API (Render)

## What this is
- A small Node.js + Express API for collecting waitlist emails from your static `index (1).html`.
- Stores emails in **Render PostgreSQL**.

## Endpoints
- `GET /healthz` → `{ ok: true }`
- `POST /api/subscribe` with JSON `{ "email": "user@example.com" }`
  - `200` inserted
  - `409` already exists (treated as success on the frontend)
  - `400` invalid email

## Environment variables
- `DATABASE_URL` (required): Postgres connection string from Render
- `ALLOWED_ORIGINS` (required for browsers): comma-separated origins, e.g. `https://your-site.com,https://www.your-site.com`
- `NODE_ENV`: `production`
- `PORT`: provided by Render automatically

## One-time DB setup
Run the SQL in `schema.sql` on your Render Postgres database:

- `waitlist-api/schema.sql`

## Render settings (typical)
- **Build command**: `npm install`
- **Start command**: `node server.js`

