create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.guard_profile_role_changes()
returns trigger
language plpgsql
set search_path = public, app_private, pg_temp
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

create index if not exists leads_product_id_idx on public.leads (product_id);
create index if not exists lead_comments_lead_id_idx on public.lead_comments (lead_id);
create index if not exists lead_comments_created_by_idx on public.lead_comments (created_by);
create index if not exists media_assets_created_by_idx on public.media_assets (created_by);
create index if not exists activity_logs_created_by_idx on public.activity_logs (created_by);

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles for select to authenticated using (id = (select auth.uid()) or app_private.is_admin());

drop policy if exists "profiles_owner_or_self_update" on public.profiles;
create policy "profiles_owner_or_self_update" on public.profiles for update to authenticated using (id = (select auth.uid()) or app_private.current_role() = 'owner') with check (id = (select auth.uid()) or app_private.current_role() = 'owner');

drop policy if exists "services_admin_all" on public.services;
drop policy if exists "services_admin_insert" on public.services;
create policy "services_admin_insert" on public.services for insert to authenticated with check (app_private.is_admin());
drop policy if exists "services_admin_update" on public.services;
create policy "services_admin_update" on public.services for update to authenticated using (app_private.is_admin()) with check (app_private.is_admin());
drop policy if exists "services_admin_delete" on public.services;
create policy "services_admin_delete" on public.services for delete to authenticated using (app_private.is_admin());

drop policy if exists "products_admin_all" on public.products;
drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert" on public.products for insert to authenticated with check (app_private.is_admin());
drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products for update to authenticated using (app_private.is_admin()) with check (app_private.is_admin());
drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete" on public.products for delete to authenticated using (app_private.is_admin());

drop policy if exists "cases_admin_all" on public.cases;
drop policy if exists "cases_admin_insert" on public.cases;
create policy "cases_admin_insert" on public.cases for insert to authenticated with check (app_private.is_admin());
drop policy if exists "cases_admin_update" on public.cases;
create policy "cases_admin_update" on public.cases for update to authenticated using (app_private.is_admin()) with check (app_private.is_admin());
drop policy if exists "cases_admin_delete" on public.cases;
create policy "cases_admin_delete" on public.cases for delete to authenticated using (app_private.is_admin());

drop policy if exists "blog_admin_all" on public.blog_posts;
drop policy if exists "blog_admin_insert" on public.blog_posts;
create policy "blog_admin_insert" on public.blog_posts for insert to authenticated with check (app_private.is_admin());
drop policy if exists "blog_admin_update" on public.blog_posts;
create policy "blog_admin_update" on public.blog_posts for update to authenticated using (app_private.is_admin()) with check (app_private.is_admin());
drop policy if exists "blog_admin_delete" on public.blog_posts;
create policy "blog_admin_delete" on public.blog_posts for delete to authenticated using (app_private.is_admin());

drop policy if exists "leads_public_insert" on public.leads;
create policy "leads_public_insert" on public.leads for insert to anon with check (status = 'new');
drop policy if exists "leads_admin_all" on public.leads;
drop policy if exists "leads_admin_select" on public.leads;
create policy "leads_admin_select" on public.leads for select to authenticated using (app_private.is_admin());
drop policy if exists "leads_admin_insert" on public.leads;
create policy "leads_admin_insert" on public.leads for insert to authenticated with check (app_private.is_admin());
drop policy if exists "leads_admin_update" on public.leads;
create policy "leads_admin_update" on public.leads for update to authenticated using (app_private.is_admin()) with check (app_private.is_admin());
drop policy if exists "leads_admin_delete" on public.leads;
create policy "leads_admin_delete" on public.leads for delete to authenticated using (app_private.is_admin());

drop policy if exists "faq_admin_all" on public.faq;
drop policy if exists "faq_admin_insert" on public.faq;
create policy "faq_admin_insert" on public.faq for insert to authenticated with check (app_private.is_admin());
drop policy if exists "faq_admin_update" on public.faq;
create policy "faq_admin_update" on public.faq for update to authenticated using (app_private.is_admin()) with check (app_private.is_admin());
drop policy if exists "faq_admin_delete" on public.faq;
create policy "faq_admin_delete" on public.faq for delete to authenticated using (app_private.is_admin());

drop policy if exists "testimonials_admin_all" on public.testimonials;
drop policy if exists "testimonials_admin_insert" on public.testimonials;
create policy "testimonials_admin_insert" on public.testimonials for insert to authenticated with check (app_private.is_admin());
drop policy if exists "testimonials_admin_update" on public.testimonials;
create policy "testimonials_admin_update" on public.testimonials for update to authenticated using (app_private.is_admin()) with check (app_private.is_admin());
drop policy if exists "testimonials_admin_delete" on public.testimonials;
create policy "testimonials_admin_delete" on public.testimonials for delete to authenticated using (app_private.is_admin());

drop policy if exists "site_media_public_read" on storage.objects;
drop policy if exists "site_media_admin_select" on storage.objects;
create policy "site_media_admin_select" on storage.objects for select to authenticated using (bucket_id = 'site-media' and app_private.is_admin());
