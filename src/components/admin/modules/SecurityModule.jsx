import React, { useEffect, useState } from 'react';
import { Shield, Activity, Clock, User, AlertTriangle, CheckCircle } from 'lucide-react';
import SectionHeader from '../SectionHeader';
import { listRows, TABLES } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

const ROLES = [
  { key: 'owner', label: 'Owner', desc: 'Full access to content, users, security, and critical settings', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', perms: ['All permissions', 'Manage owner/admin profiles', 'Critical settings'] },
  { key: 'admin', label: 'Administrator', desc: 'Can manage content and leads, but cannot change owner or critical settings', color: 'text-primary bg-primary/10 border-primary/20', perms: ['Leads', 'Services', 'Products', 'Cases', 'FAQ', 'Media'] },
];

const ACTION_COLORS = { create: 'text-emerald-400', update: 'text-primary', delete: 'text-red-400', auth: 'text-amber-400', comment: 'text-violet-400' };
const ACTION_ICONS = { create: CheckCircle, update: Activity, delete: AlertTriangle, auth: User, comment: Activity };

export default function SecurityModule() {
  const { profile, user, session } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roles');

  useEffect(() => {
    listRows(TABLES.activityLogs, { orderBy: '-created_at', limit: 50 })
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <SectionHeader title="Security & Access" subtitle="Supabase Auth roles, RLS-backed permissions, and audit trail" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Current Role', value: profile?.role || '—', color: profile?.role === 'owner' ? 'text-amber-400' : 'text-primary', icon: Shield },
          { label: 'Active Session', value: session ? '1' : '0', color: 'text-primary', icon: User },
          { label: 'Auth Provider', value: user?.app_metadata?.provider || 'email', color: 'text-white/50', icon: CheckCircle },
          { label: 'Last Activity', value: logs[0]?.created_at ? new Date(logs[0].created_at).toLocaleDateString() : '—', color: 'text-white/50', icon: Clock },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl bg-surface-2 border border-line p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mb-5">
        {['roles', 'logs', 'sessions'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border capitalize ${activeTab === t ? 'bg-primary/10 text-primary border-primary/25' : 'text-white/30 border-line hover:text-white/60 bg-surface-2'}`}>
            {t === 'roles' ? 'Roles & Permissions' : t === 'logs' ? 'Activity Logs' : 'Sessions'}
          </button>
        ))}
      </div>

      {activeTab === 'roles' && (
        <div className="space-y-4">
          {ROLES.map(role => (
            <div key={role.key} className="rounded-2xl border border-line bg-surface-2 p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${role.color}`}>{role.label}</span>
                  <p className="text-sm text-white/40">{role.desc}</p>
                </div>
                <Shield className="w-4 h-4 text-white/15 flex-shrink-0" />
              </div>
              <div className="flex flex-wrap gap-2">
                {role.perms.map(p => (
                  <span key={p} className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/35">{p}</span>
                ))}
              </div>
            </div>
          ))}
          <div className="rounded-2xl border border-dashed border-line p-5 text-center">
            <p className="text-sm text-white/25">Create users in Supabase Auth, then add a matching row in `profiles` with role `owner` or `admin`.</p>
            <p className="text-xs text-white/15 mt-1">RLS policies enforce these roles on every admin table.</p>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="rounded-2xl border border-line bg-surface-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <p className="text-sm font-semibold text-white/60">Recent Activity</p>
            <span className="text-xs text-white/20">{logs.length} events</span>
          </div>
          <div className="divide-y divide-line">
            {loading ? (
              <div className="px-5 py-10 text-center text-sm text-white/20">Loading logs...</div>
            ) : logs.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-white/20">No activity yet</div>
            ) : logs.map(log => {
              const Icon = ACTION_ICONS[log.action] || Activity;
              return (
                <div key={log.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-3.5 h-3.5 ${ACTION_COLORS[log.action] || 'text-white/30'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/70">{log.action}</p>
                    <p className="text-[10px] text-white/25">{log.entity_type || '—'} · {log.entity_id || 'no entity id'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-white/30">{log.created_by || 'system'}</p>
                    <p className="text-[10px] text-white/20">{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="rounded-2xl border border-line bg-surface-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <p className="text-sm font-semibold text-white/60">Active Session</p>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white/70 truncate">{user?.email || 'Current user'}</p>
                <p className="text-[10px] text-white/30">Supabase session · expires {session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'automatically'}</p>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">Current</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
