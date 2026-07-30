import { getSupabase } from './supabase';

type QueryFilters = Record<string, unknown>;

type ListOptions = {
  select?: string;
  filters?: QueryFilters;
  orderBy?: string;
  limit?: number;
  range?: [number, number];
};

type SettingMetadata = {
  group_name?: string;
  group?: string;
  label?: string;
  is_public?: boolean;
  is_critical?: boolean;
};

type UploadOptions = {
  bucket?: string;
  folder?: string;
};

export const TABLES = {
  profiles: 'profiles',
  siteSettings: 'site_settings',
  services: 'services',
  products: 'products',
  cases: 'cases',
  leads: 'leads',
  faq: 'faq',
  testimonials: 'testimonials',
  mediaAssets: 'media_assets',
  activityLogs: 'activity_logs',
};

const DEFAULT_ORDER = {
  site_settings: 'key',
  services: 'sort_order',
  products: 'sort_order',
  cases: 'sort_order',
  leads: '-created_at',
  faq: 'sort_order',
  testimonials: 'sort_order',
  media_assets: '-created_at',
  activity_logs: '-created_at',
  profiles: 'created_at',
};

function normalizeRow(row: any) {
  if (!row || typeof row !== 'object') return row;
  return {
    ...row,
    created_date: row.created_date || row.created_at,
    updated_date: row.updated_date || row.updated_at,
    visible: row.visible ?? row.is_active,
  };
}

function normalizeRows(rows: any[]) {
  return Array.isArray(rows) ? rows.map(normalizeRow) : rows;
}

function applyOrder(query: any, orderBy?: string) {
  if (!orderBy) return query;
  const descending = orderBy.startsWith('-');
  const column = descending ? orderBy.slice(1) : orderBy;
  return query.order(column, { ascending: !descending, nullsFirst: false });
}

function applyFilters(query: any, filters: QueryFilters = {}) {
  return Object.entries(filters).reduce((nextQuery, [key, value]) => {
    if (value === undefined || value === null || value === 'all') return nextQuery;
    return nextQuery.eq(key, value);
  }, query);
}

export async function listRows(table: string, options: ListOptions = {}) {
  const {
    select = '*',
    filters = {},
    orderBy = DEFAULT_ORDER[table],
    limit,
    range,
  } = options;

  let query = getSupabase().from(table).select(select);
  query = applyFilters(query, filters);
  query = applyOrder(query, orderBy);
  if (limit) query = query.limit(limit);
  if (range) query = query.range(range[0], range[1]);

  const { data, error } = await query;
  if (error) throw error;
  return normalizeRows(data || []);
}

export async function countRows(table: string, filters: QueryFilters = {}) {
  let query = getSupabase().from(table).select('id', { count: 'exact', head: true });
  query = applyFilters(query, filters);

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

export async function createRow(table: string, values: Record<string, unknown>) {
  const { data, error } = await getSupabase()
    .from(table)
    .insert(values)
    .select()
    .single();

  if (error) throw error;
  await createActivityLog('create', table, data?.id, values);
  return normalizeRow(data);
}

export async function updateRow(table: string, id: string, values: Record<string, unknown>) {
  const { data, error } = await getSupabase()
    .from(table)
    .update(values)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  await createActivityLog('update', table, id, values);
  return normalizeRow(data);
}

export async function deleteRow(table: string, id: string) {
  const { error } = await getSupabase().from(table).delete().eq('id', id);
  if (error) throw error;
  await createActivityLog('delete', table, id);
}

export async function upsertSetting(key: string, value: unknown, metadata: SettingMetadata = {}) {
  const payload = {
    key,
    value,
    group_name: metadata.group_name || metadata.group || 'general',
    label: metadata.label || key,
    is_public: metadata.is_public ?? true,
    is_critical: metadata.is_critical ?? false,
  };

  const { data, error } = await getSupabase()
    .from(TABLES.siteSettings)
    .upsert(payload, { onConflict: 'key' })
    .select()
    .single();

  if (error) throw error;
  await createActivityLog('update', TABLES.siteSettings, data?.id, payload);
  return normalizeRow(data);
}

export async function getSiteSettings() {
  const rows = await listRows(TABLES.siteSettings, {
    filters: { is_public: true },
    orderBy: 'key',
  });

  return rows.reduce((settings, row) => {
    settings[row.key] = row.value;
    return settings;
  }, {});
}

export async function getPublicRows(table: string, options: ListOptions = {}) {
  const filters = { ...(options.filters || {}) };
  if (['services', 'products', 'cases', 'faq', 'testimonials'].includes(table)) {
    filters.is_active = true;
  }
  return listRows(table, { ...options, filters });
}

export async function submitLead(values: Record<string, any>) {
  const payload = {
    name: values.name?.trim(),
    phone: values.phone?.trim() || null,
    email: values.email?.trim() || null,
    company: values.company?.trim() || null,
    message: values.message?.trim() || null,
    source: values.source || 'website',
    status: 'new',
    service: values.service || null,
    product_id: values.product_id || null,
    notes: values.notes || null,
  };

  const { error } = await getSupabase()
    .from(TABLES.leads)
    .insert(payload);

  if (error) throw error;
  return normalizeRow(payload);
}

export async function createLeadComment(leadId: string, body: string) {
  const { data, error } = await getSupabase()
    .from('lead_comments')
    .insert({ lead_id: leadId, body })
    .select()
    .single();

  if (error) throw error;
  await createActivityLog('comment', TABLES.leads, leadId, { body });
  return normalizeRow(data);
}

export async function uploadFile(file: File, options: UploadOptions = {}) {
  const bucket = options.bucket || 'site-media';
  const folder = options.folder || 'uploads';
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
  const path = `${folder}/${crypto.randomUUID()}-${cleanName}`;

  const { error: uploadError } = await getSupabase()
    .storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = getSupabase().storage.from(bucket).getPublicUrl(path);
  const asset = await createRow(TABLES.mediaAssets, {
    name: file.name,
    type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
    size_bytes: file.size,
    bucket,
    storage_path: path,
    public_url: data.publicUrl,
  });

  return { file_url: data.publicUrl, asset };
}

export async function getDashboardStats() {
  const [
    leads,
    services,
    products,
    casesCount,
    faq,
    testimonials,
    recentLeads,
  ] = await Promise.all([
    countRows(TABLES.leads),
    countRows(TABLES.services, { is_active: true }),
    countRows(TABLES.products, { is_active: true }),
    countRows(TABLES.cases, { is_active: true }),
    countRows(TABLES.faq, { is_active: true }),
    countRows(TABLES.testimonials, { is_active: true }),
    listRows(TABLES.leads, { orderBy: '-created_at', limit: 6 }),
  ]);

  return { leads, services, products, cases: casesCount, faq, testimonials, recentLeads };
}

export async function createActivityLog(action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) {
  try {
    const client = getSupabase();
    const { data: auth } = await client.auth.getUser();
    if (!auth?.user) return;

    await client.from(TABLES.activityLogs).insert({
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      metadata,
      created_by: auth.user.id,
    });
  } catch {
    // Activity logs should never break a primary admin action.
  }
}
