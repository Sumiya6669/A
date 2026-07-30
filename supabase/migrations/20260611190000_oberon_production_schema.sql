create extension if not exists pgcrypto;

create schema if not exists app_private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default 'null'::jsonb,
  group_name text not null default 'general',
  label text,
  is_public boolean not null default true,
  is_critical boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text,
  full_description text,
  category text,
  price_from integer,
  price_to integer,
  features jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text,
  full_description text,
  category text,
  implementation_price_from integer,
  implementation_price_to integer,
  subscription_price_from integer,
  subscription_price_to integer,
  features jsonb not null default '[]'::jsonb,
  target_audience jsonb not null default '[]'::jsonb,
  icon text not null default '⚙️',
  color text not null default '#4d7fff',
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  client_name text,
  industry text,
  description text,
  result text,
  technologies jsonb not null default '[]'::jsonb,
  image_url text,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_image_url text,
  category text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  company text,
  message text,
  source text not null default 'website',
  status text not null default 'new' check (status in ('new', 'contacted', 'in_progress', 'won', 'lost')),
  telegram text,
  whatsapp text,
  budget text,
  service text,
  product_id uuid references public.products(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_comments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  body text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.faq (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  text text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('image', 'video', 'document')),
  size_bytes bigint not null default 0,
  bucket text not null default 'site-media',
  storage_path text not null,
  public_url text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists faq_question_unique on public.faq (question);
create unique index if not exists testimonials_name_company_unique on public.testimonials (name, company);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app_private.current_role()
returns text
language sql
security definer
set search_path = public, auth, pg_temp
stable
as $$
  select p.role from public.profiles p where p.id = auth.uid()
$$;

create or replace function app_private.is_admin()
returns boolean
language sql
security definer
set search_path = public, auth, pg_temp
stable
as $$
  select coalesce(app_private.current_role() in ('owner', 'admin'), false)
$$;

create or replace function public.guard_profile_role_changes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if old.role = 'owner' and app_private.current_role() <> 'owner' then
      raise exception 'Only owner can update owner profiles';
    end if;

    if new.role is distinct from old.role and app_private.current_role() <> 'owner' then
      raise exception 'Only owner can change profile roles';
    end if;

    if old.role = 'owner' and new.role <> 'owner' and (select count(*) from public.profiles where role = 'owner') <= 1 then
      raise exception 'At least one owner profile is required';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at before update on public.services for each row execute function public.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists cases_set_updated_at on public.cases;
create trigger cases_set_updated_at before update on public.cases for each row execute function public.set_updated_at();
drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at before update on public.blog_posts for each row execute function public.set_updated_at();
drop trigger if exists faq_set_updated_at on public.faq;
create trigger faq_set_updated_at before update on public.faq for each row execute function public.set_updated_at();
drop trigger if exists testimonials_set_updated_at on public.testimonials;
create trigger testimonials_set_updated_at before update on public.testimonials for each row execute function public.set_updated_at();
drop trigger if exists profiles_guard_role_changes on public.profiles;
create trigger profiles_guard_role_changes before update on public.profiles for each row execute function public.guard_profile_role_changes();

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.services enable row level security;
alter table public.products enable row level security;
alter table public.cases enable row level security;
alter table public.blog_posts enable row level security;
alter table public.leads enable row level security;
alter table public.lead_comments enable row level security;
alter table public.faq enable row level security;
alter table public.testimonials enable row level security;
alter table public.media_assets enable row level security;
alter table public.activity_logs enable row level security;

grant usage on schema public to anon, authenticated;
grant usage on schema app_private to anon, authenticated;
grant execute on function app_private.current_role() to anon, authenticated;
grant execute on function app_private.is_admin() to anon, authenticated;

grant select on public.site_settings, public.services, public.products, public.cases, public.blog_posts, public.faq, public.testimonials to anon, authenticated;
grant insert on public.leads to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.site_settings, public.services, public.products, public.cases, public.blog_posts, public.leads, public.lead_comments, public.faq, public.testimonials, public.media_assets, public.activity_logs to authenticated;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles for select to authenticated using (id = auth.uid() or app_private.is_admin());
drop policy if exists "profiles_owner_insert" on public.profiles;
create policy "profiles_owner_insert" on public.profiles for insert to authenticated with check (app_private.current_role() = 'owner');
drop policy if exists "profiles_owner_or_self_update" on public.profiles;
create policy "profiles_owner_or_self_update" on public.profiles for update to authenticated using (id = auth.uid() or app_private.current_role() = 'owner') with check (id = auth.uid() or app_private.current_role() = 'owner');
drop policy if exists "profiles_owner_delete" on public.profiles;
create policy "profiles_owner_delete" on public.profiles for delete to authenticated using (app_private.current_role() = 'owner' and role <> 'owner');

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read" on public.site_settings for select to anon, authenticated using (is_public or app_private.is_admin());
drop policy if exists "site_settings_admin_insert" on public.site_settings;
create policy "site_settings_admin_insert" on public.site_settings for insert to authenticated with check (app_private.is_admin());
drop policy if exists "site_settings_admin_update" on public.site_settings;
create policy "site_settings_admin_update" on public.site_settings for update to authenticated using (app_private.current_role() = 'owner' or (app_private.current_role() = 'admin' and not is_critical)) with check (app_private.current_role() = 'owner' or (app_private.current_role() = 'admin' and not is_critical));
drop policy if exists "site_settings_owner_delete" on public.site_settings;
create policy "site_settings_owner_delete" on public.site_settings for delete to authenticated using (app_private.current_role() = 'owner');

drop policy if exists "services_public_read" on public.services;
create policy "services_public_read" on public.services for select to anon, authenticated using (is_active or app_private.is_admin());
drop policy if exists "services_admin_all" on public.services;
create policy "services_admin_all" on public.services for all to authenticated using (app_private.is_admin()) with check (app_private.is_admin());

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select to anon, authenticated using (is_active or app_private.is_admin());
drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products for all to authenticated using (app_private.is_admin()) with check (app_private.is_admin());

drop policy if exists "cases_public_read" on public.cases;
create policy "cases_public_read" on public.cases for select to anon, authenticated using (is_active or app_private.is_admin());
drop policy if exists "cases_admin_all" on public.cases;
create policy "cases_admin_all" on public.cases for all to authenticated using (app_private.is_admin()) with check (app_private.is_admin());

drop policy if exists "blog_public_read" on public.blog_posts;
create policy "blog_public_read" on public.blog_posts for select to anon, authenticated using (status = 'published' or app_private.is_admin());
drop policy if exists "blog_admin_all" on public.blog_posts;
create policy "blog_admin_all" on public.blog_posts for all to authenticated using (app_private.is_admin()) with check (app_private.is_admin());

drop policy if exists "leads_public_insert" on public.leads;
create policy "leads_public_insert" on public.leads for insert to anon, authenticated with check (status = 'new');
drop policy if exists "leads_admin_all" on public.leads;
create policy "leads_admin_all" on public.leads for all to authenticated using (app_private.is_admin()) with check (app_private.is_admin());

drop policy if exists "lead_comments_admin_all" on public.lead_comments;
create policy "lead_comments_admin_all" on public.lead_comments for all to authenticated using (app_private.is_admin()) with check (app_private.is_admin());

drop policy if exists "faq_public_read" on public.faq;
create policy "faq_public_read" on public.faq for select to anon, authenticated using (is_active or app_private.is_admin());
drop policy if exists "faq_admin_all" on public.faq;
create policy "faq_admin_all" on public.faq for all to authenticated using (app_private.is_admin()) with check (app_private.is_admin());

drop policy if exists "testimonials_public_read" on public.testimonials;
create policy "testimonials_public_read" on public.testimonials for select to anon, authenticated using (is_active or app_private.is_admin());
drop policy if exists "testimonials_admin_all" on public.testimonials;
create policy "testimonials_admin_all" on public.testimonials for all to authenticated using (app_private.is_admin()) with check (app_private.is_admin());

drop policy if exists "media_assets_admin_all" on public.media_assets;
create policy "media_assets_admin_all" on public.media_assets for all to authenticated using (app_private.is_admin()) with check (app_private.is_admin());
drop policy if exists "activity_logs_admin_read" on public.activity_logs;
create policy "activity_logs_admin_read" on public.activity_logs for select to authenticated using (app_private.is_admin());
drop policy if exists "activity_logs_admin_insert" on public.activity_logs;
create policy "activity_logs_admin_insert" on public.activity_logs for insert to authenticated with check (app_private.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 52428800, array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "site_media_public_read" on storage.objects;
create policy "site_media_public_read" on storage.objects for select to anon, authenticated using (bucket_id = 'site-media');
drop policy if exists "site_media_admin_insert" on storage.objects;
create policy "site_media_admin_insert" on storage.objects for insert to authenticated with check (bucket_id = 'site-media' and app_private.is_admin());
drop policy if exists "site_media_admin_update" on storage.objects;
create policy "site_media_admin_update" on storage.objects for update to authenticated using (bucket_id = 'site-media' and app_private.is_admin()) with check (bucket_id = 'site-media' and app_private.is_admin());
drop policy if exists "site_media_admin_delete" on storage.objects;
create policy "site_media_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'site-media' and app_private.is_admin());

insert into public.site_settings (key, value, group_name, label, is_public, is_critical) values
('site_name', to_jsonb('Oberon Studio'::text), 'brand', 'Site Name', true, true),
('hero_title', to_jsonb('AI и CRM решения для быстрого роста бизнеса'::text), 'brand', 'Hero Title', true, false),
('hero_subtitle', to_jsonb('Внедряем Oberon Core, готовые отраслевые CRM и AI-агентов, которые автоматизируют продажи, сервис и операции.'::text), 'brand', 'Hero Subtitle', true, false),
('hero_cta_primary', to_jsonb('Обсудить проект'::text), 'brand', 'Primary CTA', true, false),
('hero_cta_secondary', to_jsonb('Смотреть решения'::text), 'brand', 'Secondary CTA', true, false),
('telegram', to_jsonb('@oberon_studio'::text), 'contact', 'Telegram', true, false),
('telegram_url', to_jsonb('https://t.me/'::text), 'contact', 'Telegram URL', true, false),
('whatsapp', to_jsonb('+7 700 000 0000'::text), 'contact', 'WhatsApp', true, false),
('whatsapp_url', to_jsonb('https://wa.me/'::text), 'contact', 'WhatsApp URL', true, false),
('email', to_jsonb('hello@oberon.studio'::text), 'contact', 'Email', true, false),
('seo_title', to_jsonb('Oberon Studio — AI и CRM решения для бизнеса'::text), 'seo', 'SEO Title', true, false),
('seo_description', to_jsonb('Готовые AI и CRM решения для быстрого внедрения в бизнес.'::text), 'seo', 'SEO Description', true, false)
on conflict (key) do update set value = excluded.value, group_name = excluded.group_name, label = excluded.label, is_public = excluded.is_public, is_critical = excluded.is_critical;

insert into public.services (title, slug, short_description, full_description, category, price_from, price_to, features, is_featured, sort_order, is_active) values
('AI автоматизация', 'ai-automation', 'AI-агенты и автоматизация повторяющихся процессов.', 'Проектируем и внедряем AI-агентов для обработки заявок, документов, поддержки, продаж и внутренних операций.', 'AI', 500000, null, '["AI агенты", "Документы", "Поддержка", "Продажи"]'::jsonb, true, 10, true),
('CRM системы', 'crm-systems', 'Кастомные CRM и готовые Oberon CRM решения.', 'Настраиваем воронки, роли, клиентскую базу, отчеты, интеграции с мессенджерами и платежами.', 'CRM', 700000, null, '["Воронка", "Клиенты", "Задачи", "Отчеты"]'::jsonb, true, 20, true),
('Ready Solutions', 'ready-solutions', 'Готовые отраслевые продукты на Oberon Core.', 'Быстрый запуск CRM и AI решений для спорта, HoReCa, медицины, логистики, сервиса и образования.', 'Products', 500000, null, '["Oberon Core", "Быстрый старт", "Отрасли"]'::jsonb, true, 30, true),
('Интеграции', 'integrations', 'WhatsApp, Telegram, 1C, Kaspi, Halyk, iiko и API.', 'Подключаем бизнес-системы так, чтобы данные синхронизировались без ручной работы и дублей.', 'Integration', 300000, null, '["WhatsApp", "Telegram", "1C", "API"]'::jsonb, false, 40, true),
('Сайты и приложения', 'web-apps', 'Production-ready web apps, лендинги и кабинеты.', 'Разрабатываем быстрые сайты и приложения с Supabase, админ-панелями, SEO, аналитикой и формами заявок.', 'Web', 300000, null, '["React", "Supabase", "SEO", "Admin"]'::jsonb, false, 50, true)
on conflict (slug) do update set title = excluded.title, short_description = excluded.short_description, full_description = excluded.full_description, category = excluded.category, price_from = excluded.price_from, price_to = excluded.price_to, features = excluded.features, is_featured = excluded.is_featured, sort_order = excluded.sort_order, is_active = excluded.is_active;

insert into public.products (title, slug, short_description, full_description, category, implementation_price_from, subscription_price_from, features, target_audience, icon, color, is_featured, sort_order, is_active) values
('Oberon Fight CRM', 'oberon-fight-crm', 'Для спортивных клубов и секций', 'CRM для учеников, абонементов, посещаемости, расписания, склада и продаж экипировки.', 'Спорт', 500000, 30000, '["Ученики", "Абонементы", "Посещаемость", "Расписание", "Склад", "WhatsApp"]'::jsonb, '["Спортклубы", "Секции", "Фитнес"]'::jsonb, '🥊', '#4d7fff', true, 10, true),
('Oberon CRM', 'oberon-crm', 'Универсальная CRM система', 'Единая платформа для клиентов, сделок, задач и коммуникаций для любого бизнеса.', 'CRM', 700000, 50000, '["Воронка продаж", "Клиенты", "Задачи", "Интеграции", "Аналитика"]'::jsonb, '["B2B", "Услуги", "Продажи"]'::jsonb, '📊', '#10d4a8', false, 20, true),
('Oberon Hotel AI', 'oberon-hotel-ai', 'ИИ для гостиниц и баз отдыха', 'Система управления гостиницей с AI-рецепцией, автобронированием и персонализацией гостей.', 'HoReCa', 1500000, 100000, '["AI-рецепция", "Бронирование", "Номера", "Гости", "Загрузка"]'::jsonb, '["Отели", "Базы отдыха", "Апартаменты"]'::jsonb, '🏨', '#f0a020', true, 30, true),
('Oberon Restaurant AI', 'oberon-restaurant-ai', 'ИИ для ресторанов', 'AI-платформа для меню, заказов, аналитики блюд, склада и управления залом.', 'HoReCa', 1000000, 100000, '["AI-меню", "Онлайн-заказы", "Зал", "Склад", "iiko"]'::jsonb, '["Рестораны", "Кафе", "Доставка"]'::jsonb, '🍽️', '#f472b6', false, 40, true),
('Oberon AI Sales', 'oberon-ai-sales', 'ИИ отдел продаж', 'AI-агент квалифицирует лиды, ведёт переписку, готовит КП и помогает закрывать сделки.', 'AI', 500000, 50000, '["Квалификация", "Follow-up", "КП", "CRM", "WhatsApp"]'::jsonb, '["Отделы продаж", "B2B", "Услуги"]'::jsonb, '🤖', '#a855f7', true, 50, true),
('Oberon Audit AI', 'oberon-audit-ai', 'Финансовый аудит через ИИ', 'AI-анализ финансов, поиск потерь, рекомендации, P&L отчеты и KPI дашборды.', 'AI', 500000, 50000, '["P&L", "KPI", "Потери", "Рекомендации"]'::jsonb, '["Собственники", "Финансы", "Операции"]'::jsonb, '📈', '#06b6d4', false, 60, true),
('Oberon Beauty CRM', 'oberon-beauty-crm', 'Для салонов красоты', 'CRM для записи, клиентов, истории услуг, склада косметики и лояльности.', 'Услуги', 700000, null, '["Онлайн-запись", "Клиенты", "История", "Склад", "Лояльность"]'::jsonb, '["Салоны", "Косметология", "Beauty"]'::jsonb, '💅', '#f472b6', false, 70, true),
('Oberon Education CRM', 'oberon-education-crm', 'Для учебных центров', 'Управление студентами, курсами, платежами, расписанием, посещаемостью и прогрессом.', 'Образование', 500000, null, '["Студенты", "Курсы", "Оплаты", "Расписание", "Прогресс"]'::jsonb, '["Учебные центры", "Курсы", "Школы"]'::jsonb, '🎓', '#4d7fff', false, 80, true),
('Oberon Vet CRM', 'oberon-vet-crm', 'Для ветеринарных клиник', 'CRM для карт питомцев, истории лечения, вакцинаций, склада медикаментов и записи.', 'Медицина', 800000, null, '["Питомцы", "Лечение", "Вакцинации", "Склад", "Запись"]'::jsonb, '["Ветклиники", "Зоосервисы"]'::jsonb, '🐾', '#10d4a8', false, 90, true),
('Oberon Dental CRM', 'oberon-dental-crm', 'Для стоматологий', 'CRM для зубных карт, планов лечения, рентген-хранилища, финансов и записи.', 'Медицина', 1000000, null, '["Зубная карта", "Планы", "Рентген", "Финансы", "Запись"]'::jsonb, '["Стоматологии", "Клиники"]'::jsonb, '🦷', '#06b6d4', false, 100, true),
('Oberon Auto Service', 'oberon-auto-service', 'CRM для СТО', 'Управление заказ-нарядами, историей авто, складом запчастей и клиентской базой.', 'Услуги', 800000, null, '["Заказ-наряды", "Авто", "Запчасти", "Клиенты", "SMS"]'::jsonb, '["СТО", "Автосервисы"]'::jsonb, '🔧', '#f0a020', false, 110, true),
('Oberon Construction CRM', 'oberon-construction-crm', 'Для строительных компаний', 'CRM для объектов, смет, подрядчиков, материалов, этапов работ и финансов.', 'Услуги', 1000000, null, '["Объекты", "Сметы", "Материалы", "Этапы", "Финансы"]'::jsonb, '["Строительство", "Подрядчики"]'::jsonb, '🏗️', '#a855f7', false, 120, true),
('Oberon HR AI', 'oberon-hr-ai', 'ИИ для найма персонала', 'AI-рекрутинг: скоринг кандидатов, автоинтервью, база резюме и онбординг.', 'AI', 500000, null, '["Скоринг", "Интервью", "Резюме", "Онбординг", "KPI"]'::jsonb, '["HR", "Рекрутинг", "Команды"]'::jsonb, '👥', '#4d7fff', false, 130, true),
('Oberon Legal AI', 'oberon-legal-ai', 'ИИ для юристов', 'AI-ассистент для анализа документов, генерации договоров и ведения дел.', 'AI', 700000, null, '["Документы", "Договоры", "Дела", "Дедлайны", "Поиск"]'::jsonb, '["Юристы", "Legal", "Комплаенс"]'::jsonb, '⚖️', '#10d4a8', false, 140, true),
('Oberon Property CRM', 'oberon-property-crm', 'CRM для недвижимости', 'Платформа для объектов, клиентов, сделок, показов, документов и финансов.', 'Недвижимость', 1000000, null, '["Объекты", "Клиенты", "Сделки", "Показы", "Документы"]'::jsonb, '["Агентства", "Девелоперы"]'::jsonb, '🏡', '#f0a020', false, 150, true),
('Oberon Car Rent', 'oberon-car-rent', 'CRM для автопроката', 'Управление автопарком, бронированиями, договорами, залогами и техобслуживанием.', 'Логистика', 800000, null, '["Автопарк", "Бронирования", "Договоры", "Залоги", "ТО"]'::jsonb, '["Прокат авто", "Fleet"]'::jsonb, '🚗', '#f472b6', false, 160, true),
('Oberon Logistics', 'oberon-logistics', 'CRM для логистики и перевозок', 'Платформа для рейсов, водителей, грузов, маршрутов, трекинга и финансов.', 'Логистика', 1000000, null, '["Рейсы", "Водители", "Грузы", "Маршруты", "Финансы"]'::jsonb, '["Логистика", "Перевозки"]'::jsonb, '🚚', '#a855f7', false, 170, true),
('Oberon Warehouse', 'oberon-warehouse', 'Система управления складом', 'WMS для приемки, размещения, отгрузки, инвентаризации и аналитики остатков.', 'Логистика', 700000, null, '["Приемка", "Ячейки", "Отгрузка", "Инвентаризация", "Штрихкоды"]'::jsonb, '["Склады", "Дистрибуция"]'::jsonb, '📦', '#06b6d4', false, 180, true),
('Oberon Franchise', 'oberon-franchise', 'Управление франчайзинговой сетью', 'Контроль точек, стандартов, финансов, обучения, аудита и аналитики сети.', 'Услуги', 2000000, null, '["Точки", "Стандарты", "Роялти", "Обучение", "Аудит"]'::jsonb, '["Франшизы", "Сети"]'::jsonb, '🏢', '#4d7fff', false, 190, true),
('Oberon Lead Factory', 'oberon-lead-factory', 'Авто-генерация клиентов через ИИ', 'AI-система для поиска лидов, сбора контактов, генерации КП и рассылок.', 'AI', 500000, 50000, '["Поиск лидов", "Контакты", "КП", "Рассылки", "Аналитика"]'::jsonb, '["Продажи", "Маркетинг", "B2B"]'::jsonb, '⚡', '#f0a020', true, 200, true)
on conflict (slug) do update set title = excluded.title, short_description = excluded.short_description, full_description = excluded.full_description, category = excluded.category, implementation_price_from = excluded.implementation_price_from, subscription_price_from = excluded.subscription_price_from, features = excluded.features, target_audience = excluded.target_audience, icon = excluded.icon, color = excluded.color, is_featured = excluded.is_featured, sort_order = excluded.sort_order, is_active = excluded.is_active;

insert into public.cases (title, slug, client_name, industry, description, result, technologies, is_featured, sort_order, is_active) values
('AI CRM для спортсекции', 'ai-crm-sport-section', 'Fight Club', 'Спорт', 'Запустили CRM для абонементов, расписания, посещаемости и WhatsApp-напоминаний.', 'Администратор тратит на рутину на 60% меньше времени.', '["React", "Supabase", "WhatsApp", "Analytics"]'::jsonb, true, 10, true),
('Hotel Smart Booking', 'hotel-smart-booking', 'Atlas Hotel', 'HoReCa', 'AI-рецепция обрабатывает обращения, помогает с бронированием и передает данные в CRM.', 'Заявки больше не теряются вне рабочего времени.', '["AI Agent", "Supabase", "Telegram", "Booking"]'::jsonb, true, 20, true),
('B2B CRM для опта', 'b2b-wholesale-crm', 'TechnoProm', 'B2B', 'Настроили воронку, счета, задачи менеджеров и интеграцию с 1C.', 'Команда видит статусы сделок и KPI в одном кабинете.', '["CRM", "1C", "PostgreSQL", "Reports"]'::jsonb, false, 30, true)
on conflict (slug) do update set title = excluded.title, client_name = excluded.client_name, industry = excluded.industry, description = excluded.description, result = excluded.result, technologies = excluded.technologies, is_featured = excluded.is_featured, sort_order = excluded.sort_order, is_active = excluded.is_active;

insert into public.blog_posts (title, slug, excerpt, content, category, status, published_at) values
('Как выбрать CRM для малого бизнеса', 'how-to-choose-crm', 'Короткий чеклист по выбору CRM, которая не превратится в дорогую таблицу.', 'Начните с воронки продаж, ролей, источников лидов и отчетов. Затем проверьте интеграции с мессенджерами, платежами и текущими системами.', 'CRM', 'published', now() - interval '7 days'),
('Где AI-агент даёт быстрый ROI', 'ai-agent-roi', 'Пять процессов, где AI окупается быстрее всего.', 'Самые быстрые сценарии: квалификация лидов, ответы поддержки, обработка документов, подготовка КП и follow-up после консультаций.', 'AI', 'published', now() - interval '3 days'),
('Oberon Core: одна платформа для разных отраслей', 'oberon-core-platform', 'Почему единая архитектура ускоряет запуск отраслевых решений.', 'Oberon Core переиспользует модули CRM, финансов, склада, клиентов, аналитики и AI-агентов. Поэтому новые решения запускаются быстрее и стабильнее.', 'Oberon Core', 'published', now() - interval '1 day')
on conflict (slug) do update set title = excluded.title, excerpt = excluded.excerpt, content = excluded.content, category = excluded.category, status = excluded.status, published_at = excluded.published_at;

insert into public.faq (question, answer, category, sort_order, is_active) values
('Сколько занимает внедрение готового решения?', 'Типовое внедрение занимает 8–13 дней после согласования требований и доступа к интеграциям.', 'delivery', 10, true),
('Можно ли адаптировать продукт под мою нишу?', 'Да. Oberon Core построен модульно: CRM, клиенты, финансы, склад, бронирования, AI-агент и отчеты комбинируются под процесс.', 'product', 20, true),
('Где хранятся заявки с сайта?', 'Все заявки попадают в таблицу leads и доступны в админ-панели с фильтрами, статусами и комментариями.', 'crm', 30, true),
('Кто может редактировать контент?', 'Редактировать данные могут только пользователи с ролью owner или admin. RLS включён на всех публичных таблицах.', 'security', 40, true),
('Можно ли подключить WhatsApp и Telegram?', 'Да. Эти каналы можно подключить к CRM, AI-агенту, уведомлениям и обработке заявок.', 'integrations', 50, true),
('Что входит в поддержку?', 'Мониторинг, исправления, обновления, развитие функций и помощь команде после запуска.', 'support', 60, true)
on conflict (question) do update set answer = excluded.answer, category = excluded.category, sort_order = excluded.sort_order, is_active = excluded.is_active;

insert into public.testimonials (name, company, text, rating, sort_order, is_active) values
('Алексей К.', 'CEO, TechnoProm', 'Взяли AI-систему под автоматизацию заявок. Менеджеры теперь занимаются продажами, а не ручным вводом данных.', 5, 10, true),
('Динара М.', 'Владелец ресторанной сети', 'Telegram-бот и интеграции навели порядок в заказах. Команда видит всё в реальном времени.', 5, 20, true),
('Руслан Т.', 'CTO, Digital Agency', 'Прототип показали быстро, архитектура понятная, код готов к дальнейшему развитию.', 5, 30, true),
('Айгуль С.', 'Управляющая, Atlas Hotel', 'Бронирования больше не теряются, а гости получают подтверждения автоматически.', 5, 40, true)
on conflict (name, company) do update set text = excluded.text, rating = excluded.rating, sort_order = excluded.sort_order, is_active = excluded.is_active;
