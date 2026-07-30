/**
 * Карта публичных страниц сайта.
 * Один источник правды для меню, футера и блока разделов на главной.
 * `navKey` — ключ в `t.nav`, чтобы подписи оставались локализованными.
 */
export const SITE_ROUTES = [
  { path: '/services', navKey: 'services' },
  { path: '/projects', navKey: 'works' },
  { path: '/products', navKey: 'products' },
  { path: '/process', navKey: 'process' },
  { path: '/stack', navKey: 'stack' },
  { path: '/reviews', navKey: 'reviews' },
  { path: '/faq', navKey: 'faq' },
  { path: '/contact', navKey: 'contact' },
];

export const CONTACT_PATH = '/contact';
export const PROJECTS_PATH = '/projects';
