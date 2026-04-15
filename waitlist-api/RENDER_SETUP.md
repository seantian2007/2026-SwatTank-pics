# Render setup (PostgreSQL + Web Service)

## 1) Create the PostgreSQL database on Render
1. In Render Dashboard, click **New +** → **PostgreSQL**.
2. Pick a name like `patina-waitlist-db`.
3. Create it, then open the database details page.
4. Copy the connection string you’ll use for the web service:
   - `DATABASE_URL`: use the database’s connection string (Render shows it in the database page).

## 2) Create the `waitlist_emails` table
Run the SQL from `schema.sql`:

- `waitlist-api/schema.sql`

You can do this by connecting with a DB client (TablePlus/DBeaver/psql) using the credentials shown in Render.

## 3) Deploy the web service
1. Push `waitlist-api/` to a Git repo (GitHub/GitLab).
2. In Render Dashboard, click **New +** → **Web Service**.
3. Connect your repo and select the `waitlist-api` directory (root directory = `waitlist-api`).
4. Configure:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add environment variables:
   - `DATABASE_URL` = (from step 1)
   - `NODE_ENV` = `production`
   - `ALLOWED_ORIGINS` = a comma-separated allowlist of your static site origins, e.g.
     - `https://yourdomain.com,https://www.yourdomain.com`

After deploy, you’ll get a service URL like:
- `https://<your-service>.onrender.com`

Your endpoint will be:
- `https://<your-service>.onrender.com/api/subscribe`

## 4) Wire the static site
In `index (1).html`, set:
- `WAITLIST_ENDPOINT = 'https://<your-service>.onrender.com/api/subscribe'`

## 5) Quick verification checklist
- Visit `GET https://<your-service>.onrender.com/healthz` → should return `{ ok: true }`.
- Submit an email from your deployed static site:
  - Expect 200 (first time) or 409 (second time).
- Confirm a row exists in `waitlist_emails`.

