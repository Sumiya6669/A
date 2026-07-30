# Oberon Studio

Production-ready React/Vite site for Oberon Studio with Supabase Auth, editable content, CRM leads, and an owner/admin panel.

## Stack

- React + Vite
- Tailwind CSS
- Supabase Auth, Database, Storage, RLS
- TanStack Query
- Framer Motion

## Run Locally

```bash
npm install
npm run dev
```

Required env:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only and must not be referenced by frontend code.

## Supabase

Apply:

```text
supabase/migrations/20260611190000_oberon_production_schema.sql
```

Detailed setup:

```text
docs/supabase-setup.md
```

## First Owner

After applying the Supabase migration, set these local-only values in `.env.local`:

```env
SUPABASE_OWNER_EMAIL=owner@example.com
SUPABASE_OWNER_PASSWORD=change-me-to-a-strong-password
SUPABASE_OWNER_NAME=Oberon Owner
SUPABASE_BOOTSTRAP_ROLE=owner
```

Then run:

```bash
npm run supabase:bootstrap-owner
```

This creates or updates the Supabase Auth user and matching `profiles` row.

Manual SQL alternative:

```sql
insert into public.profiles (id, email, full_name, role)
values ('USER_UUID_HERE', 'owner@example.com', 'Owner Name', 'owner');
```

## Admin Panel

Open:

```text
/login
/admin
```

Admin sections:

- Dashboard
- Leads
- Services
- Ready Solutions
- Cases
- Blog
- FAQ
- Testimonials
- Media Library
- Site Settings
- Security

## Quality Commands

```bash
npm run lint
npm run build
```

## Deploy to Vercel

1. Import the repository in Vercel.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Do not add `SUPABASE_SERVICE_ROLE_KEY` unless you create server-only Vercel Functions later.
4. Build command: `npm run build`
5. Output directory: `dist`

## Project Structure

```text
src/lib/supabase.ts       Supabase browser client
src/lib/auth.ts           Auth/session/profile helpers
src/lib/api.ts            CRUD, Storage, leads, settings helpers
src/pages/Login.jsx       Admin login
src/pages/Admin.jsx       Admin panel composition
src/components/admin      Admin shell and modules
src/components/sections   Public site sections
supabase/migrations       SQL schema, RLS, seed data
docs                      Setup documentation
```
