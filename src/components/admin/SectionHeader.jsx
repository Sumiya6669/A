import React from 'react';

export default function SectionHeader({ title, subtitle, action = null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
      <div>
        <h1 className="text-xl font-black text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-white/30 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
