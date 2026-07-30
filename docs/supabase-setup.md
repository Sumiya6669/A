# Supabase Setup

## 1. Create or Open a Supabase Project

Use the project that matches `VITE_SUPABASE_URL` in `.env.local`, or create a new Supabase project and copy its URL and publishable/anon key.

Frontend variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_or_anon_key
```

Server-only variable:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Do not use `SUPABASE_SERVICE_ROLE_KEY` in frontend code.

## 2. Apply the Schema

Open Supabase SQL Editor and run:

```sql
-- paste the contents of:
-- supabase/migrations/20260611190000_oberon_production_schema.sql
```

The migration creates:

- Public content tables: `services`, `products`, `cases`, `blog_posts`, `faq`, `testimonials`, `site_settings`
- CRM tables: `leads`, `lead_comments`
- Admin tables: `profiles`, `media_assets`, `activity_logs`
- RLS policies and Data API grants
- `site-media` Storage bucket policies
- Seed content for the public site

## 3. Create the First Owner

Recommended local bootstrap:

```env
SUPABASE_OWNER_EMAIL=owner@example.com
SUPABASE_OWNER_PASSWORD=change-me-to-a-strong-password
SUPABASE_OWNER_NAME=Oberon Owner
SUPABASE_BOOTSTRAP_ROLE=owner
```

```bash
npm run supabase:bootstrap-owner
```

The script uses `SUPABASE_SERVICE_ROLE_KEY`, creates or updates the Supabase Auth user, confirms the email, and upserts the matching `profiles` row with role `owner`.

Manual Dashboard alternative:

1. In Supabase Dashboard, create a user in Authentication.
2. Copy the user UUID.
3. Run this SQL with that UUID:

```sql
insert into public.profiles (id, email, full_name, role)
values ('USER_UUID_HERE', 'owner@example.com', 'Owner Name', 'owner')
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    role = 'owner';
```

After this, sign in at `/login`.

## 4. Security Model

RLS is enabled on every public table.

- Public visitors can read active public content.
- Public visitors can insert new `leads`.
- Only `owner` and `admin` can manage content.
- Only `owner` can change owner profiles or critical settings.
- Admins cannot change owner roles.
- Storage uploads are limited to authenticated owner/admin users.

## 5. Local Verification

```bash
npm install
npm run lint
npm run build
```

Then run:

```bash
npm run dev
```

Open the site, submit a lead from the contact form, and confirm the row appears in `leads`.
