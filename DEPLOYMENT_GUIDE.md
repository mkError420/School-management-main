# cPanel Deployment Guide

## 1. Build the frontend

Run locally from the project directory:

```bash
npm install
npm run build
```

Upload the **contents** of the generated `dist/` directory into the domain's document root, usually `public_html/`. The upload must include `index.html`, `assets/`, and the generated `.htaccess` file. Do not upload the project source, `node_modules/`, or SQL dumps into the public document root.

For File Manager uploads, use `frontend-dist-cpanel.zip` and extract it directly into the document root. Upload `backend-cpanel.zip` to the same document root and extract it there; it contains the `backend/` folder. These archives must be regenerated after source changes with the current `dist/` build.

## 2. Create and import the database

1. In cPanel, open **MySQL Databases** and create a database and database user.
2. Assign the user to the database with all required privileges. cPanel usually prefixes both names with your account username.
3. Open **phpMyAdmin**, select the new database, and import `backend/database/schema.sql` from your local project.
4. Import `backend/database/seed.sql` only if you want the sample records. Change all seeded/default passwords before opening the site to users.

For an existing installation being upgraded to Messages, import the updated `backend/database/schema.sql` once in phpMyAdmin to create the `messages` table. Existing tables are declared with `IF NOT EXISTS`; this adds the new table without replacing current records.

Message attachments support up to five files per message, 10 MB each (PDF, Office documents, TXT, PNG, or JPG). If uploads are rejected by PHP before reaching the API, set cPanel's `upload_max_filesize` to at least `10M` and `post_max_size` to at least `55M`. Attachment files are stored under `backend/storage/message-attachments/` and must remain inaccessible as direct public downloads; the API checks conversation membership before serving a file.

The seed creates these initial logins: admin `admin` / `admin123`, teacher `johndoe` / `teacher123`, student `johnconnor` / `student123`, and parent `sarahconnor` / `parent123`. These are public sample credentials; change them immediately after setup and before making the site available.

## 3. Upload and configure the PHP API

Upload the project's `backend/` directory to `public_html/backend/` (or the matching domain document root). Keep its `.htaccess`, `config/`, `api/`, `database/`, `models/`, and `utils/` directories in place.

Edit `backend/config/config.php` on the server with the database host, database name, database user, and password created above. Replace `JWT_SECRET` with a unique, randomly generated secret of at least 32 bytes. Alternatively, configure the corresponding `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, and `JWT_SECRET` environment variables in cPanel. Set `APP_URL` and `CORS_ALLOWED_ORIGINS` only if the API must be called from a different origin; same-origin requests need no CORS allowlist.

The checked-in config uses placeholders and will not connect until configured. The database password previously committed to this project should be changed at its provider, and the new cPanel credentials should not be committed.

## 4. Enable HTTPS and verify

Enable an SSL certificate for the domain in cPanel, then use cPanel's **Force HTTPS Redirect** if available. Visit these URLs to verify routing:

- `https://your-domain/` should show the sign-in page.
- `https://your-domain/sign-in` should still work after a page refresh.
- `https://your-domain/backend/api` should return the API status JSON.
- `https://your-domain/backend/database/schema.sql` should be denied (403).

If the API returns a server error, check cPanel's PHP error log and verify the PHP version, database credentials, imported tables, and file permissions. Use `644` for files and `755` for directories unless your host specifies otherwise.

## Deployment notes

- Frontend API requests use `/backend/api` on the current origin; set `VITE_API_URL` at build time only when the API is hosted elsewhere.
- Upload only the contents of `dist/` to the web root, not the `dist/` directory itself.
- The included SQL dumps contain sample account data. Do not use the sample passwords for a live deployment.
- Back up the database and keep production credentials outside source control.
