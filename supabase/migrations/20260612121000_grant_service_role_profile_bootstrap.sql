grant usage on schema app_private to service_role;
grant execute on function app_private.current_role() to service_role;
grant execute on function app_private.is_admin() to service_role;
grant usage on schema public to service_role;
grant select, insert, update, delete on public.profiles, public.site_settings, public.services, public.products, public.cases, public.blog_posts, public.leads, public.lead_comments, public.faq, public.testimonials, public.media_assets, public.activity_logs to service_role;
