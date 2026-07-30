import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SiteNav from '../nav/SiteNav';
import SiteFooter from './SiteFooter';
import Consultant from '../chat/Consultant';
import CursorGlow from '../core/CursorGlow';

/**
 * Общая обёртка публичных страниц: навигация, футер, консультант и фон.
 * Внутренние страницы получают верхний отступ под фиксированное меню,
 * главная — нет, потому что начинается с полноэкранного Hero.
 */
export default function SiteLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="min-h-screen bg-background font-inter overflow-x-hidden flex flex-col">
      <CursorGlow />
      <SiteNav />
      <main className={isHome ? 'flex-1' : 'flex-1 pt-24'}>
        <Outlet />
      </main>
      <SiteFooter />
      <Consultant />
    </div>
  );
}
