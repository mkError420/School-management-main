# MK School Management

The application includes a public school website and a role-based school management dashboard.

## Run locally

```bash
npm install
npm run dev
```

The public school homepage is served at `/`. The management dashboard is available at `/dashboard`, with sign-in at `/sign-in`.

## Manage the public website

Sign in as a **super admin** and open **Website content** from the dashboard sidebar (or visit `/website-content`). The editor manages the school identity, homepage banner and introduction, school facts, notice board, quick links, and contact details. Changes are stored in the backend `site_settings` table and appear on the public homepage.

Website content is read publicly through `GET /backend/api/settings`. Updates use the authenticated settings endpoint and are restricted by the backend to the `super_admin` role. The `site_settings.setting_value` column uses `LONGTEXT` so it can store the website content JSON; the schema and settings migration include this column type.

## Backend

The PHP API uses MySQL. Configure database access in `backend/config/config.php` (or the local config file) and apply `backend/database/schema.sql` when setting up a database.
