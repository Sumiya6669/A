import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Globe, Search, BarChart3, Phone } from 'lucide-react';
import SectionHeader from '../SectionHeader';
import { getSiteSettings, upsertSetting } from '@/lib/api';

const SETTING_GROUPS = [
  {
    key: 'brand',
    label: 'Brand & Hero',
    icon: Globe,
    fields: [
      { key: 'site_name', label: 'Site Name', placeholder: 'Oberon Studio' },
      { key: 'hero_title', label: 'Hero Title', placeholder: 'AI и CRM решения для роста бизнеса' },
      { key: 'hero_subtitle', label: 'Hero Subtitle', placeholder: 'Автоматизируем процессы, продажи и клиентский сервис.', textarea: true },
      { key: 'hero_cta_primary', label: 'Primary CTA', placeholder: 'Обсудить проект' },
      { key: 'hero_cta_secondary', label: 'Secondary CTA', placeholder: 'Смотреть решения' },
    ],
  },
  {
    key: 'contact',
    label: 'Contact Information',
    icon: Phone,
    fields: [
      { key: 'telegram', label: 'Telegram', placeholder: '@oberon_studio' },
      { key: 'telegram_url', label: 'Telegram URL', placeholder: 'https://t.me/oberon_studio' },
      { key: 'whatsapp', label: 'WhatsApp', placeholder: '+7 700 000 0000' },
      { key: 'whatsapp_url', label: 'WhatsApp URL', placeholder: 'https://wa.me/77000000000' },
      { key: 'email', label: 'Email', placeholder: 'hello@oberon.studio' },
      { key: 'instagram_url', label: 'Instagram URL', placeholder: 'https://instagram.com/oberon.studio' },
    ],
  },
  {
    key: 'seo',
    label: 'SEO Settings',
    icon: Search,
    fields: [
      { key: 'seo_title', label: 'SEO Title', placeholder: 'Oberon Studio — AI и CRM решения' },
      { key: 'seo_description', label: 'SEO Description', placeholder: 'Готовые AI и CRM решения для быстрого внедрения в бизнес.', textarea: true },
      { key: 'og_title', label: 'OG Title', placeholder: 'Oberon Studio' },
      { key: 'og_description', label: 'OG Description', placeholder: 'AI, CRM и автоматизация бизнеса.', textarea: true },
      { key: 'og_image', label: 'OG Image URL', placeholder: 'https://...' },
      { key: 'canonical_url', label: 'Canonical URL', placeholder: 'https://oberon.studio' },
    ],
  },
  {
    key: 'analytics',
    label: 'Analytics Integrations',
    icon: BarChart3,
    fields: [
      { key: 'google_analytics_id', label: 'Google Analytics ID', placeholder: 'G-XXXXXXXXXX' },
      { key: 'yandex_metrika_id', label: 'Yandex Metrica ID', placeholder: '12345678' },
      { key: 'facebook_pixel_id', label: 'Facebook Pixel ID', placeholder: '1234567890' },
      { key: 'hotjar_id', label: 'Hotjar Site ID', placeholder: '1234567' },
    ],
  },
];

export default function SettingsModule() {
  const [settings, setSettings] = useState({});
  const [activeGroup, setActiveGroup] = useState('brand');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setSettings(await getSiteSettings());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleChange = (key, value) => setSettings(p => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const group = SETTING_GROUPS.find(g => g.key === activeGroup);
    for (const field of group.fields) {
      const value = settings[field.key] || '';
      await upsertSetting(field.key, value, { group_name: activeGroup, label: field.label, is_public: true });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const group = SETTING_GROUPS.find(g => g.key === activeGroup);

  return (
    <div>
      <SectionHeader
        title="Site Settings"
        subtitle="Contact info, SEO, social links, and analytics integrations"
        action={
          <button onClick={handleSave} disabled={saving}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-primary text-white hover:bg-primary/80'}`}>
            {saved ? <><RefreshCw className="w-4 h-4" /> Saved!</> : saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        }
      />

      <div className="grid lg:grid-cols-[220px_1fr] gap-5">
        {/* Group nav */}
        <div className="space-y-1">
          {SETTING_GROUPS.map(g => {
            const Icon = g.icon;
            return (
              <button key={g.key} onClick={() => setActiveGroup(g.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeGroup === g.key ? 'bg-primary/10 text-primary' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left font-medium">{g.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings form */}
        <div className="rounded-2xl border border-line bg-surface-2 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-line">
            {group && <group.icon className="w-4 h-4 text-primary" />}
            <p className="font-semibold text-white/70">{group?.label}</p>
          </div>
          <div className="p-5 space-y-4">
            {loading ? (
              <p className="text-sm text-white/20">Loading settings...</p>
            ) : group?.fields.map(field => (
              <div key={field.key}>
                <label className="text-[10px] text-white/30 uppercase tracking-wide font-medium block mb-1.5">{field.label}</label>
                {field.textarea ? (
                  <textarea
                    value={settings[field.key] || ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    rows={3}
                    className="w-full bg-surface-3 border border-line rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-primary/40 transition-colors resize-none"
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    value={settings[field.key] || ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    className="w-full bg-surface-3 border border-line rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-primary/40 transition-colors"
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
