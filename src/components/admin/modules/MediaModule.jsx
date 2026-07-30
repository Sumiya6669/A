import React, { useEffect, useMemo, useState } from 'react';
import { Upload, Search, Image, Video, FileText, Trash2, Copy, Check, Grid, List } from 'lucide-react';
import SectionHeader from '../SectionHeader';
import { deleteRow, listRows, TABLES, uploadFile } from '@/lib/api';

const TYPE_FILTERS = ['all', 'image', 'video', 'document'];
const TYPE_ICONS = { image: Image, video: Video, document: FileText };
const TYPE_COLORS = { image: 'text-primary', video: 'text-violet-400', document: 'text-amber-400' };

function formatSize(bytes) {
  if (!bytes) return '0 MB';
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MediaModule() {
  const [media, setMedia] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setMedia(await listRows(TABLES.mediaAssets, { orderBy: '-created_at' }));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => media.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    return matchSearch && matchType;
  }), [media, search, typeFilter]);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        await uploadFile(file);
      }
      await load();
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const copyUrl = (id, url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const deleteMedia = async (id) => {
    if (!confirm('Delete this media record? The storage object will remain unless removed in Supabase Storage.')) return;
    await deleteRow(TABLES.mediaAssets, id);
    setMedia(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div>
      <SectionHeader
        title="Media Library"
        subtitle={`${media.length} files · ${media.filter(m => m.type === 'image').length} images`}
        action={
          <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${uploading ? 'bg-primary/30 text-white/50' : 'bg-primary text-white hover:bg-primary/80'}`}>
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Files'}
            <input type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files..."
            className="w-full bg-surface-2 border border-line rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-primary/40" />
        </div>
        <div className="flex gap-2">
          {TYPE_FILTERS.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border capitalize ${typeFilter === t ? 'bg-primary/10 text-primary border-primary/25' : 'text-white/30 border-line hover:text-white/60 bg-surface-2'}`}>
              {t}
            </button>
          ))}
          <div className="flex border border-line rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-white/30 hover:text-white/60'}`}><Grid className="w-3.5 h-3.5" /></button>
            <button onClick={() => setViewMode('list')} className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-white/30 hover:text-white/60'}`}><List className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/20 text-sm">Loading...</div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <label className="rounded-2xl border-2 border-dashed border-line hover:border-primary/30 flex flex-col items-center justify-center py-8 gap-2 cursor-pointer transition-colors group aspect-square">
            <Upload className="w-5 h-5 text-white/15 group-hover:text-primary/40 transition-colors" />
            <span className="text-[10px] text-white/20 group-hover:text-white/40 transition-colors text-center">Upload</span>
            <input type="file" multiple className="hidden" onChange={handleUpload} />
          </label>

          {filtered.map(m => {
            const Icon = TYPE_ICONS[m.type] || FileText;
            const url = m.public_url;
            return (
              <div key={m.id} className="group relative rounded-2xl border border-line bg-surface-2 overflow-hidden hover:border-white/15 transition-colors aspect-square">
                {m.type === 'image' && url ? (
                  <img src={url} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <Icon className={`w-8 h-8 ${TYPE_COLORS[m.type]} opacity-40`} />
                    <span className="text-[9px] text-white/20 px-2 text-center truncate w-full">{m.name}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  <p className="text-[9px] text-white/70 text-center truncate w-full">{m.name}</p>
                  <p className="text-[8px] text-white/30">{formatSize(m.size_bytes)}</p>
                  <div className="flex gap-1.5">
                    {url && (
                      <button onClick={() => copyUrl(m.id, url)} className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white transition-colors">
                        {copied === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                    <button onClick={() => deleteMedia(m.id)} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-line overflow-hidden bg-surface-2">
          <div className="divide-y divide-line">
            {filtered.map(m => {
              const Icon = TYPE_ICONS[m.type] || FileText;
              const url = m.public_url;
              return (
                <div key={m.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {m.type === 'image' && url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <Icon className={`w-4 h-4 ${TYPE_COLORS[m.type]}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/70 truncate">{m.name}</p>
                    <p className="text-[10px] text-white/25">{formatSize(m.size_bytes)} · {m.created_at ? new Date(m.created_at).toLocaleDateString() : ''}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-white/30 capitalize">{m.type}</span>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {url && (
                      <button onClick={() => copyUrl(m.id, url)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/70 transition-colors">
                        {copied === m.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button onClick={() => deleteMedia(m.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
