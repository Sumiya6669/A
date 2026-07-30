import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLang } from '@/lib/i18n/LangContext';
import { SITE_ROUTES, CONTACT_PATH } from '@/lib/routes';
import LangSwitcher from './LangSwitcher';

export default function SiteNav() {
  const { t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const links = SITE_ROUTES.map(route => ({
    label: t.nav[route.navKey],
    to: route.path,
  }));

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Закрываем мобильное меню при смене страницы.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-700 ${scrolled ? 'py-3' : 'py-5'}`}
      >
        <div className="max-w-7xl mx-auto px-5">
          <div className={`flex items-center justify-between rounded-2xl px-5 py-3 transition-all duration-700 ${scrolled ? 'glass-strong' : ''}`}>
            {/* Logo */}
            <Link to="/" className="group flex items-center gap-3">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-lg bg-primary opacity-20 group-hover:opacity-40 transition-opacity blur-sm" />
                <div className="relative w-8 h-8 rounded-lg bg-surface-2 border border-line flex items-center justify-center">
                  <span className="text-xs font-black text-gradient-blue">OS</span>
                </div>
              </div>
              <span className="text-sm font-semibold text-white/80 hidden sm:block tracking-tight">Oberon Studio</span>
            </Link>

            {/* Desktop links */}
            <nav className="hidden lg:flex items-center gap-1">
              {links.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `relative px-3.5 py-2 text-sm transition-colors duration-300 group ${
                      isActive ? 'text-white' : 'text-white/40 hover:text-white/80'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {l.label}
                      <span
                        className={`absolute bottom-1 left-3.5 right-3.5 h-px bg-primary transition-transform duration-300 origin-left ${
                          isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* CTA + Lang */}
            <div className="flex items-center gap-2">
              <LangSwitcher />
              <Link
                to={CONTACT_PATH}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20
                  text-sm font-medium text-primary hover:bg-primary/20 hover:border-primary/40 transition-all duration-300"
              >
                {t.nav.cta}
              </Link>
              <button
                onClick={() => setOpen(!open)}
                className="lg:hidden flex flex-col gap-1.5 p-2"
                aria-label="menu"
                aria-expanded={open}
              >
                <span className={`block w-5 h-px bg-white/60 transition-all duration-300 ${open ? 'rotate-45 translate-y-[5px]' : ''}`} />
                <span className={`block w-5 h-px bg-white/60 transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-px bg-white/60 transition-all duration-300 ${open ? '-rotate-45 -translate-y-[5px]' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-30 bg-background/95 backdrop-blur-2xl flex flex-col pt-28 px-8 overflow-y-auto pb-10"
          >
            {links.map((l, i) => (
              <motion.div
                key={l.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <NavLink
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block py-4 text-2xl font-light border-b border-line transition-colors ${
                      isActive ? 'text-white' : 'text-white/70 hover:text-white'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-6 mb-4"
            >
              <LangSwitcher />
            </motion.div>
            <Link
              to={CONTACT_PATH}
              onClick={() => setOpen(false)}
              className="py-4 px-6 rounded-2xl bg-primary text-white text-center font-semibold text-lg"
            >
              {t.nav.cta}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
