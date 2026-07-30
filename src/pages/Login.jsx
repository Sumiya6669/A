import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';

function getRedirect(search) {
  const params = new URLSearchParams(search);
  return params.get('redirect') || '/admin';
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getRedirect(location.search);
  const { isAuthenticated, isLoadingAuth, login, authError, clearAuthError } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  if (!isLoadingAuth && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Не удалось войти.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-white overflow-hidden relative flex items-center justify-center px-5">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(220_100%_60%/0.12),transparent_60%)]" />
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md rounded-3xl border border-line bg-surface/95 backdrop-blur-2xl p-7 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">Oberon Studio</h1>
            <p className="text-xs text-white/30">Admin access</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-white/25 block mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-surface-2 border border-line rounded-2xl pl-10 pr-4 py-3 text-sm text-white/80 outline-none focus:border-primary/40 transition-colors"
                placeholder="owner@oberon.studio"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-white/25 block mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-surface-2 border border-line rounded-2xl pl-10 pr-4 py-3 text-sm text-white/80 outline-none focus:border-primary/40 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
        </div>

        {(error || authError) && (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error || authError}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-7 w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-white hover:bg-primary/85 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Войти в панель
        </button>
      </motion.form>
    </main>
  );
}
