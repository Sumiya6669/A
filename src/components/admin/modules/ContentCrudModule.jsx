import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit2, Eye, EyeOff, Plus, Search, Star, Trash2 } from 'lucide-react';
import SectionHeader from '../SectionHeader';
import { createRow, deleteRow, listRows, updateRow } from '@/lib/api';

function valueToInput(value, field) {
  if (field.type === 'list') return Array.isArray(value) ? value.join('\n') : '';
  if (field.type === 'checkbox') return Boolean(value);
  return value ?? '';
}

function inputToValue(value, field) {
  if (field.type === 'number') return value === '' ? null : Number(value);
  if (field.type === 'checkbox') return Boolean(value);
  if (field.type === 'list') {
    return String(value || '')
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean);
  }
  if (field.type === 'date') return value || null;
  return value;
}

function buildInitial(config, item) {
  const source = item || config.empty || {};
  return config.fields.reduce((acc, field) => {
    acc[field.key] = valueToInput(source[field.key], field);
    return acc;
  }, item?.id ? { id: item.id } : {});
}

function Field({ field, value, onChange }) {
  const label = (
    <label className="text-[10px] text-white/30 uppercase tracking-wide font-medium block mb-1.5">
      {field.label}
    </label>
  );

  if (field.type === 'textarea' || field.type === 'list') {
    return (
      <div className={field.wide ? 'sm:col-span-2' : ''}>
        {label}
        <textarea
          rows={field.type === 'list' ? 4 : field.rows || 3}
          value={value || ''}
          onChange={event => onChange(field.key, event.target.value)}
          className="w-full bg-surface-3 border border-line rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-primary/40 transition-colors resize-none"
          placeholder={field.placeholder}
        />
        {field.type === 'list' && <p className="text-[10px] text-white/18 mt-1">Один пункт на строку</p>}
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className={field.wide ? 'sm:col-span-2' : ''}>
        {label}
        <select
          value={value || ''}
          onChange={event => onChange(field.key, event.target.value)}
          className="w-full bg-surface-3 border border-line rounded-xl px-3 py-2.5 text-sm text-white/70 outline-none focus:border-primary/40 transition-colors"
        >
          {(field.options || []).map(option => (
            <option key={option} value={option} className="bg-surface-3">{option}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <div className="flex items-center gap-3 pt-6">
        <button
          type="button"
          onClick={() => onChange(field.key, !value)}
          className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-white/10'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? 'left-5' : 'left-0.5'}`} />
        </button>
        <span className="text-sm text-white/50">{field.label}</span>
      </div>
    );
  }

  return (
    <div className={field.wide ? 'sm:col-span-2' : ''}>
      {label}
      <input
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'datetime-local' : 'text'}
        value={value || ''}
        onChange={event => onChange(field.key, event.target.value)}
        className="w-full bg-surface-3 border border-line rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-primary/40 transition-colors"
        placeholder={field.placeholder}
      />
    </div>
  );
}

function ContentModal({ config, item, onClose, onSave }) {
  const [form, setForm] = useState(() => buildInitial(config, item));
  const [saving, setSaving] = useState(false);

  const change = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const submit = async () => {
    setSaving(true);
    const payload = config.fields.reduce((acc, field) => {
      acc[field.key] = inputToValue(form[field.key], field);
      return acc;
    }, {});
    await onSave({ ...payload, id: form.id });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-3xl bg-surface-2 border border-line rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-line flex-shrink-0">
          <h3 className="font-bold text-white">{item?.id ? config.editTitle : config.createTitle}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/70">x</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {config.fields.map(field => (
              <Field
                key={field.key}
                field={field}
                value={form[field.key]}
                onChange={change}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors">Cancel</button>
          <button
            onClick={submit}
            disabled={saving || !form[config.requiredKey || config.titleKey]}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ContentCrudModule({ config }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalItem, setModalItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await listRows(config.table, { orderBy: config.orderBy });
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [config.table]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => config.searchKeys.some(key => String(item[key] || '').toLowerCase().includes(q)));
  }, [config.searchKeys, items, search]);

  const handleSave = async (form) => {
    if (form.id) await updateRow(config.table, form.id, form);
    else await createRow(config.table, form);
    await load();
  };

  const handleDelete = async (id) => {
    if (!confirm(config.deleteConfirm || 'Delete this item?')) return;
    await deleteRow(config.table, id);
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const toggleField = async (item, field) => {
    const next = !item[field];
    await updateRow(config.table, item.id, { [field]: next });
    setItems(prev => prev.map(row => row.id === item.id ? { ...row, [field]: next } : row));
  };

  return (
    <div>
      <SectionHeader
        title={config.title}
        subtitle={`${items.length} total${config.activeField ? ` · ${items.filter(item => item[config.activeField]).length} active` : ''}`}
        action={
          <button
            onClick={() => { setModalItem(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/80 transition-colors"
          >
            <Plus className="w-4 h-4" /> {config.addLabel}
          </button>
        }
      />

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder={config.searchPlaceholder || 'Search...'}
          className="w-full bg-surface-2 border border-line rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-primary/40 transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/20 text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-line">
          <p className="text-white/20 text-sm">{config.emptyText}</p>
          <button
            onClick={() => { setModalItem(null); setShowModal(true); }}
            className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            {config.addLabel}
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className={`group rounded-2xl border bg-surface-2 overflow-hidden transition-colors ${config.activeField && !item[config.activeField] ? 'border-line opacity-60' : 'border-line hover:border-white/12'}`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white/85 leading-tight">{item[config.titleKey]}</p>
                    {config.metaKey && <p className="text-[10px] text-white/25 mt-1">{item[config.metaKey]}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {config.featuredField && (
                      <button onClick={() => toggleField(item, config.featuredField)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-amber-400 transition-colors">
                        <Star className={`w-3.5 h-3.5 ${item[config.featuredField] ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    )}
                    {config.activeField && (
                      <button onClick={() => toggleField(item, config.activeField)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/70 transition-colors">
                        {item[config.activeField] ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
                      </button>
                    )}
                    <button onClick={() => { setModalItem(item); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/70 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {item[config.descriptionKey] && <p className="text-xs text-white/38 leading-relaxed line-clamp-3 mb-4">{item[config.descriptionKey]}</p>}
                <div className="flex flex-wrap gap-2">
                  {config.badges.map(badge => {
                    const value = typeof badge.value === 'function' ? badge.value(item) : item[badge.key];
                    if (value === undefined || value === null || value === '') return null;
                    return (
                      <span key={badge.key || badge.label} className={`text-[10px] px-2 py-0.5 rounded-full border ${badge.className || 'bg-white/[0.04] border-white/[0.08] text-white/30'}`}>
                        {badge.label ? `${badge.label}: ` : ''}{String(value)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <ContentModal
            config={config}
            item={modalItem}
            onClose={() => { setShowModal(false); setModalItem(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
