import { getSupabase, isSupabaseConfigured } from './supabase';

export const ADMIN_ROLES = ['owner', 'admin'];

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

export async function signInWithPassword(email, password) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUserProfile() {
  if (!isSupabaseConfigured) return { user: null, profile: null };

  const { data: userData, error: userError } = await getSupabase().auth.getUser();
  if (userError) throw userError;
  const user = userData.user;
  if (!user) return { user: null, profile: null };

  const { data: profile, error: profileError } = await getSupabase()
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile || !isAdminRole(profile.role)) {
    const error = new Error('У пользователя нет доступа к админ-панели.') as Error & { code?: string };
    error.code = 'profile_access_denied';
    throw error;
  }

  return { user, profile };
}

export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured) {
    return { unsubscribe() {} };
  }

  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return data.subscription;
}
