import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionHeader from '../SectionHeader';
import { createRow, deleteRow, listRows, TABLES, updateRow } from '@/lib/api';

const EMPTY = { name: '', company: '', text: '', rating: 5, image_url: '', is_active: true, sort_order: 0 };

function TestimonialModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || EMPTY);
  const [saving, setSaving] = useState(false);

  const field = (key, label, textarea = false, placeholder = '') => (
    <div className={textarea ? 'sm:col-span-2' : ''}>
      <label className="text-[10px] text-white/30 uppercase tracking-wide font-medium block mb-1.5">{label}</label>
      {textarea ? (
        <textarea value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} rows={4}
          className="w-full bg-surface-3 border border-line rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-primary/40 resize-none transition-colors"
          placeholder={placeholder} />
      ) : (
        <input value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          className="w-full bg-surface-3 border border-line rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-primary/40 transition-colors"
          placeholder={placeholder} />
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h3 className="font-bold text-white">{item?.id ? 'Edit Testimonial' : 'New Testimonial'}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/70">x</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {field('name', 'Name', false, 'Алексей К.')}
            {field('company', 'Company / Role', false, 'CEO, TechnoProm')}
            {field('image_url', 'Image URL', false, 'https://...')}
            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-wide font-medium block mb-2">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setForm(p => ({ ...p, rating: n }))}>
                    <Star className={`w-5 h-5 transition-colors ${n <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-white/15'}`} />
                  </button>
                ))}
              </div>
            </div>
            {field('text', 'Text', true, 'Client testimonial...')}
            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-wide font-medium block mb-1.5">Sort Order</label>
              <input type="number" value={form.sort_order || 0} onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))}
                className="w-full bg-surface-3 border border-line rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-primary/40 transition-colors" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <button onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-primary' : 'bg-white/10'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
              </button>
              <label className="text-sm text-white/50">Visible on site</label>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors">Cancel</button>
          <button onClick={async () => { setSaving(true); await onSave(form); setSaving(false); onClose(); }}
            disabled={saving || !form.name || !form.text}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-40">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function TestimonialsModule() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await listRows(TABLES.testimonials, { orderBy: 'sort_order' });
    setItems(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    if (form.id) await updateRow(TABLES.testimonials, form.id, form);
    else await createRow(TABLES.testimonials, form);
    await load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete testimonial?')) return;
    await deleteRow(TABLES.testimonials, id);
    setItems(p => p.filter(i => i.id !== id));
  };

  const toggleVisible = async (item) => {
    await updateRow(TABLES.testimonials, item.id, { is_active: !item.is_active });
    setItems(p => p.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
  };

  return (
    <div>
      <SectionHeader
        title="Testimonials"
        subtitle={`${items.length} testimonials · ${items.filter(i => i.is_active).length} visible`}
        action={
          <button onClick={() => { setModal(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/80 transition-colors">
            <Plus className="w-4 h-4" /> New Testimonial
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/20 text-sm">Loading...</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-line">
          <p className="text-white/20 text-sm">No testimonials yet</p>
          <button onClick={() => { setModal(null); setShowModal(true); }} className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm border border-primary/20 hover:bg-primary/20 transition-colors">Add First Testimonial</button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className={`group rounded-2xl border p-5 transition-colors ${item.is_active ? 'border-line bg-surface-2 hover:border-white/10' : 'border-line bg-surface-2/50 opacity-60'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-primary">{item.name?.[0] || '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-white/80">{item.name}</p>
                      <span className="text-[10px] text-white/30">{item.company}</span>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[1,2,3,4,5].map(n => <Star key={n} className={`w-3 h-3 ${n <= (item.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`} />)}
                    </div>
                    <p className="text-xs text-white/40 line-clamp-2">{item.text}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => toggleVisible(item)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/70 transition-colors">
                    {item.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
                  </button>
                  <button onClick={() => { setModal(item); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/70 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && <TestimonialModal item={modal} onClose={() => { setShowModal(false); setModal(null); }} onSave={handleSave} />}
      </AnimatePresence>
    </div>
  );
}
