import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, HelpCircle, MessageSquare, Package, Star, Users, Zap } from 'lucide-react';
import StatCard from '../StatCard';
import SectionHeader from '../SectionHeader';
import { getDashboardStats, listRows, TABLES } from '@/lib/api';

const STATUS_CONFIG = {
  new: { label: 'New', color: 'text-emerald-400 bg-emerald-400/10' },
  contacted: { label: 'Contacted', color: 'text-primary bg-primary/10' },
  in_progress: { label: 'In Progress', color: 'text-cyan-400 bg-cyan-400/10' },
  won: { label: 'Won', color: 'text-emerald-400 bg-emerald-400/20' },
  lost: { label: 'Lost', color: 'text-red-400 bg-red-400/10' },
};

const CustomTooltip = ({ active = false, payload = [], label = '' } = {}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-line rounded-xl px-3 py-2.5">
      <p className="text-[10px] text-white/40 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function DashboardModule({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      getDashboardStats(),
      listRows(TABLES.leads, { orderBy: '-created_at', limit: 200 }),
    ])
      .then(([nextStats, allLeads]) => {
        if (!alive) return;
        setStats(nextStats);
        setLeads(allLeads);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const statusChart = useMemo(() => Object.keys(STATUS_CONFIG).map(status => ({
    status: STATUS_CONFIG[status].label,
    leads: leads.filter(lead => lead.status === status).length,
  })), [leads]);

  const recentLeads = stats?.recentLeads || [];

  return (
    <div>
      <SectionHeader title="Dashboard" subtitle="Live Oberon Studio backend overview" />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <StatCard label="Leads" value={loading ? '...' : stats?.leads || 0} icon={MessageSquare} color="text-amber-400" />
        <StatCard label="Services" value={loading ? '...' : stats?.services || 0} icon={Briefcase} color="text-primary" />
        <StatCard label="Ready Solutions" value={loading ? '...' : stats?.products || 0} icon={Package} color="text-emerald-400" />
        <StatCard label="Cases" value={loading ? '...' : stats?.cases || 0} icon={Users} color="text-violet-400" />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mb-8">
        <StatCard label="FAQ Items" value={loading ? '...' : stats?.faq || 0} icon={HelpCircle} color="text-gold" />
        <StatCard label="Testimonials" value={loading ? '...' : stats?.testimonials || 0} icon={Star} color="text-amber-400" />
        <StatCard label="Open Pipeline" value={leads.filter(l => !['won', 'lost'].includes(l.status)).length} icon={Zap} color="text-primary" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 rounded-2xl bg-surface-2 border border-line p-5">
          <p className="text-sm font-semibold text-white/70 mb-4">Lead Pipeline</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusChart}>
              <XAxis dataKey="status" tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="leads" name="Leads" fill="#4d7fff" radius={[6, 6, 0, 0]} opacity={0.75} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl bg-surface-2 border border-line p-5">
          <p className="text-sm font-semibold text-white/70 mb-4">Quick Actions</p>
          <div className="space-y-2">
            {[
              ['leads', 'Open leads'],
              ['products', 'Manage ready solutions'],
              ['services', 'Edit services'],
              ['settings', 'Update site settings'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => onNavigate?.(key)}
                className="w-full text-left px-4 py-3 rounded-xl border border-line bg-background/40 text-sm text-white/45 hover:text-white hover:border-white/15 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-2 border border-line overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <p className="text-sm font-semibold text-white/70">Recent Leads</p>
          <button onClick={() => onNavigate?.('leads')} className="text-xs text-primary hover:underline">View all</button>
        </div>
        <div className="divide-y divide-line">
          {recentLeads.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-white/20">No leads yet</div>
          ) : recentLeads.map(lead => (
            <div key={lead.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-primary">{lead.name?.[0] || '?'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/70 truncate">{lead.name}</p>
                <p className="text-[10px] text-white/25 truncate">{lead.company || lead.service || lead.email || lead.phone}</p>
              </div>
              <span className={`text-[9px] font-medium px-2 py-1 rounded-full ${STATUS_CONFIG[lead.status]?.color || 'bg-white/5 text-white/30'}`}>
                {STATUS_CONFIG[lead.status]?.label || lead.status}
              </span>
              <span className="text-[10px] text-white/20 hidden sm:block">
                {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
