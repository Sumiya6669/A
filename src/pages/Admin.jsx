import React, { useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import DashboardModule from '../components/admin/modules/DashboardModule';
import LeadsModule from '../components/admin/modules/LeadsModule';
import TestimonialsModule from '../components/admin/modules/TestimonialsModule';
import MediaModule from '../components/admin/modules/MediaModule';
import SettingsModule from '../components/admin/modules/SettingsModule';
import SecurityModule from '../components/admin/modules/SecurityModule';
import ContentCrudModule from '../components/admin/modules/ContentCrudModule';
import { CONTENT_CONFIGS } from '../components/admin/modules/contentConfigs';

const MODULE_MAP = {
  dashboard: DashboardModule,
  leads: LeadsModule,
  services: (props) => <ContentCrudModule {...props} config={CONTENT_CONFIGS.services} />,
  products: (props) => <ContentCrudModule {...props} config={CONTENT_CONFIGS.products} />,
  cases: (props) => <ContentCrudModule {...props} config={CONTENT_CONFIGS.cases} />,
  faq: (props) => <ContentCrudModule {...props} config={CONTENT_CONFIGS.faq} />,
  testimonials: TestimonialsModule,
  media: MediaModule,
  settings: SettingsModule,
  security: SecurityModule,
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const ActiveModule = MODULE_MAP[activeTab] || DashboardModule;

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <ActiveModule onNavigate={setActiveTab} />
    </AdminLayout>
  );
}
