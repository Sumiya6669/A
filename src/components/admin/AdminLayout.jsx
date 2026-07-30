import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Briefcase, Star,
  Image, Settings, Shield, ChevronRight, Menu, Activity,
  LogOut, Package, HelpCircle, Files
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { key: 'leads', label: 'CRM / Leads', icon: Users, group: 'main', badge: null },
  { key: 'services', label: 'Services', icon: Briefcase, group: 'content' },
  { key: 'products', label: 'Ready Solutions', icon: Package, group: 'content' },
  { key: 'cases', label: 'Cases', icon: Files, group: 'content' },
  { key: 'faq', label: 'FAQ', icon: HelpCircle, group: 'content' },
  { key: 'testimonials', label: 'Testimonials', icon: Star, group: 'content' },
  { key: 'media', label: 'Media Library', icon: Image, group: 'insights' },
  { key: 'settings', label: 'Site Settings', icon: Settings, group: 'system' },
  { key: 'security', label: 'Security', icon: Shield, group: 'system' },
];

const GROUPS = [
  { key: 'main', label: 'Management' },
  { key: 'content', label: 'Content' },
  { key: 'insights', label: 'Insights' },
  { key: 'system', label: 'System' },
];

export default function AdminLayout({ activeTab, onTabChange, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-line">
        <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-black text-primary">OS</span>
        </div>
        <div>
          <p className="text-sm font-bold text-white/90 leading-tight">Admin Panel</p>
          <p className="text-[10px] text-white/25">oberon.studio</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {GROUPS.map(group => {
          const items = NAV_ITEMS.filter(i => i.group === group.key);
          return (
            <div key={group.key} className="mb-5">
              <p className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.2em] px-3 mb-1.5">{group.label}</p>
              {items.map(item => {
                const Icon = item.icon;
                const active = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => { onTabChange(item.key); setMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group mb-0.5 ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-white/35 hover:text-white/65 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {item.beta && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/20">BETA</span>
                    )}
                    {active && <ChevronRight className="w-3 h-3 opacity-60" />}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-line space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-white/25">Supabase online · {profile?.role || 'admin'}</span>
        </div>
        <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/25 hover:text-white/50 hover:bg-white/[0.03] transition-all duration-150">
          <Activity className="w-4 h-4" />
          <span>View Site</span>
        </a>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/25 hover:text-red-300 hover:bg-red-500/[0.06] transition-all duration-150">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-inter flex">
      {/* Desktop sidebar */}
      <aside className="w-56 border-r border-line flex-shrink-0 hidden lg:block fixed top-0 left-0 bottom-0 z-30 bg-background">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-background border-r border-line z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 border-b border-line flex items-center gap-4 px-5 flex-shrink-0 bg-background/80 backdrop-blur-xl sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-white/40 hover:text-white/70">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white/70 capitalize">
              {NAV_ITEMS.find(i => i.key === activeTab)?.label || 'Dashboard'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] text-white/20 hidden sm:block">Live</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="p-5 lg:p-7 max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
