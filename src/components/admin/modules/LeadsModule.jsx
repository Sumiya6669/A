import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionHeader from '../SectionHeader';
import { createRow, deleteRow, listRows, TABLES, updateRow } from '@/lib/api';

const STATUS_CONFIG = {
  new: { label: 'New', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  contacted: { label: 'Contacted', color: 'text-primary bg-primary/10 border-primary/20' },
  in_progress: { label: 'In Progress', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
  won: { label: 'Won ✓', color: 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30' },
  lost: { label: 'Lost', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
};

const EMPTY_LEAD = { name: '', company: '', phone: '', email: '', telegram: '', whatsapp: '', budget: '', service: '', status: 'new', source: '', message: '', notes: '' };

function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState(lead || EMPTY_LEAD);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="text-[10px] text-white/30 font-medium uppercase tracking-wide block mb-1.5">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={form[key] || ''}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          rows={3}
          className="w-full bg-surface-3 border border-line rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-primary/40 transition-colors resize-none"
          placeholder={placeholder}
        />
      ) : type === 'select' ? null : (
        <input
          type={type}
          value={form[key] || ''}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          className="w-full bg-surface-3 border border-line rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-primary/40 transition-colors"
          placeholder={placeholder}
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl bg-surface-2 border border-line rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-line flex-shrink-0">
          <h3 className="font-bold text-white">{lead?.id ? 'Edit Lead' : 'New Lead'}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {field('name', 'Full Name', 'text', 'John Doe')}
            {field('company', 'Company', 'text', 'ТОО «Company»')}
            {field('phone', 'Phone', 'text', '+7 700 000 0000')}
            {field('email', 'Email', 'email', 'email@example.com')}
            {field('telegram', 'Telegram', 'text', '@username')}
            {field('whatsapp', 'WhatsApp', 'text', '+7 700 000 0000')}
            {field('budget', 'Budget', 'text', 'от 500 000 ₸')}
            {field('service', 'Service Requested', 'text', 'AI Automation')}
            <div>
              <label className="text-[10px] text-white/30 font-medium uppercase tracking-wide block mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full bg-surface-3 border border-line rounded-xl px-3 py-2.5 text-sm text-white/70 outline-none focus:border-primary/40 transition-colors"
              >
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k} className="bg-surface-3">{v.label}</option>
                ))}
              </select>
            </div>
            {field('source', 'Source', 'text', 'Website / Telegram / Referral')}
          </div>
          <div className="mt-4">
            {field('message', 'Client Message', 'textarea', 'What does the client need?')}
          </div>
          <div className="mt-4">
            {field('notes', 'Internal Notes / Comments', 'textarea', 'Internal comments about this lead...')}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save Lead'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function LeadsModule() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalLead, setModalLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const load = async () => {
    setLoading(true);
    const data = await listRows(TABLES.leads, { orderBy: '-created_at', limit: 100 });
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = leads.filter(l => {
    const matchSearch = !search || [l.name, l.company, l.email, l.phone, l.service].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = async (form) => {
    if (form.id) {
      await updateRow(TABLES.leads, form.id, form);
    } else {
      await createRow(TABLES.leads, form);
    }
    await load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    await deleteRow(TABLES.leads, id);
    setLeads(p => p.filter(l => l.id !== id));
  };

  const handleStatusChange = async (id, status) => {
    await updateRow(TABLES.leads, id, { status });
    setLeads(p => p.map(l => l.id === id ? { ...l, status } : l));
  };

  const toggleSelect = (id) => setSelected(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, k) => {
    acc[k] = leads.filter(l => l.status === k).length;
    return acc;
  }, {});

  return (
    <div>
      <SectionHeader
        title="CRM / Lead Management"
        subtitle={`${leads.length} total leads`}
        action={
          <button
            onClick={() => { setModalLead(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/80 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Lead
          </button>
        }
      />

      {/* Status pipeline */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {[{ k: 'all', label: 'All', count: leads.length }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ k, label: v.label, count: statusCounts[k] || 0 }))].map(({ k, label, count }) => (
          <button
            key={k}
            onClick={() => setStatusFilter(k)}
            className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 border ${
              statusFilter === k ? 'bg-primary/10 text-primary border-primary/25' : 'text-white/30 border-line hover:text-white/60 hover:border-white/15 bg-surface-2'
            }`}
          >
            {label}
            <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${statusFilter === k ? 'bg-primary/20' : 'bg-white/[0.06]'}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Search + bulk */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, company, email..."
            className="w-full bg-surface-2 border border-line rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-primary/40 transition-colors"
          />
        </div>
        {selected.size > 0 && (
          <button
            onClick={async () => { for (const id of selected) await deleteRow(TABLES.leads, id); setSelected(new Set()); load(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete {selected.size}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-line overflow-hidden bg-surface-2">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="w-10 p-4"><input type="checkbox" className="opacity-30 accent-primary" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(l => l.id)) : new Set())} /></th>
                <th className="text-left py-3 px-4 text-[10px] font-semibold text-white/25 uppercase tracking-wider">Contact</th>
                <th className="text-left py-3 px-4 text-[10px] font-semibold text-white/25 uppercase tracking-wider hidden sm:table-cell">Service</th>
                <th className="text-left py-3 px-4 text-[10px] font-semibold text-white/25 uppercase tracking-wider hidden md:table-cell">Budget</th>
                <th className="text-left py-3 px-4 text-[10px] font-semibold text-white/25 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-[10px] font-semibold text-white/25 uppercase tracking-wider hidden lg:table-cell">Source</th>
                <th className="text-left py-3 px-4 text-[10px] font-semibold text-white/25 uppercase tracking-wider hidden lg:table-cell">Date</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-white/20">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-white/20">No leads found</td></tr>
              ) : filtered.map(lead => (
                <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4"><input type="checkbox" className="accent-primary opacity-50" checked={selected.has(lead.id)} onChange={() => toggleSelect(lead.id)} /></td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-primary">{lead.name?.[0] || '?'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/70">{lead.name}</p>
                        <p className="text-[10px] text-white/25">{lead.company || lead.email || lead.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 hidden sm:table-cell">
                    <p className="text-xs text-white/50">{lead.service || '—'}</p>
                  </td>
                  <td className="py-3.5 px-4 hidden md:table-cell">
                    <p className="text-xs text-white/50">{lead.budget || '—'}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={lead.status}
                      onChange={e => handleStatusChange(lead.id, e.target.value)}
                      className={`text-[10px] font-medium px-2.5 py-1 rounded-full border bg-transparent outline-none cursor-pointer ${STATUS_CONFIG[lead.status]?.color || 'text-white/30 border-line'}`}
                    >
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k} className="bg-surface-3 text-white">{v.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3.5 px-4 hidden lg:table-cell text-xs text-white/30">{lead.source || '—'}</td>
                  <td className="py-3.5 px-4 hidden lg:table-cell text-[10px] text-white/20">{new Date(lead.created_date).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setModalLead(lead); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/70 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(lead.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <LeadModal lead={modalLead} onClose={() => { setShowModal(false); setModalLead(null); }} onSave={handleSave} />
        )}
      </AnimatePresence>
    </div>
  );
}
