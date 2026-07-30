import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Reveal from '../core/Reveal';
import { useLang } from '@/lib/i18n/LangContext';
import { SITE_ROUTES } from '@/lib/routes';

/** Блок навигации по разделам на главной: каждый раздел — отдельная страница. */
export default function SectionsGrid() {
  const { t } = useLang();
  const ht = t.home;

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-surface/30 to-background" />
      <div className="relative z-10 max-w-7xl mx-auto px-5">
        <Reveal>
          <div className="mb-10">
            <p className="text-xs tracking-[0.3em] text-white/20 uppercase mb-4">{ht.exploreLabel}</p>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2 className="text-[clamp(2rem,5vw,4rem)] font-black tracking-[-0.03em] text-white">{ht.exploreTitle}</h2>
              <p className="text-sm text-white/30 max-w-xs">{ht.exploreSub}</p>
            </div>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SITE_ROUTES.map((route, index) => (
            <Reveal key={route.path} delay={index * 0.04}>
              <Link
                to={route.path}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-6
                  hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
              >
                <span className="text-sm font-semibold text-white/60 group-hover:text-white transition-colors">
                  {t.nav[route.navKey]}
                </span>
                <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
