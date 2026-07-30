import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function StatCard({ label, value, delta = null, deltaType = 'up', icon: Icon, color = 'text-primary', suffix = '' }) {
  const DeltaIcon = deltaType === 'up' ? ArrowUpRight : deltaType === 'down' ? ArrowDownRight : Minus;
  const deltaColor = deltaType === 'up' ? 'text-emerald-400' : deltaType === 'down' ? 'text-red-400' : 'text-white/30';

  return (
    <div className="rounded-2xl bg-surface-2 border border-line p-5 hover:border-white/10 transition-colors duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center">
          {Icon && <Icon className={`w-4 h-4 ${color}`} />}
        </div>
        {delta && (
          <span className={`text-[10px] font-medium flex items-center gap-0.5 ${deltaColor}`}>
            {delta}
            <DeltaIcon className="w-3 h-3" />
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-white mb-1">{value}{suffix}</p>
      <p className="text-[11px] text-white/30">{label}</p>
    </div>
  );
}
