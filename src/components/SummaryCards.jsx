import React from 'react';
import { formatMoney } from '../utils/allocationEngine';

export function SummaryCards({ categoryBreakdown, totalIncome }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {categoryBreakdown.map((cat) => {
        return (
          <div
            key={cat.id}
            className={`rounded-2xl border p-3.5 transition-all shadow-sm hover:shadow-md ${cat.bgColor} ${cat.borderColor}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">{cat.emoji}</span>
                <span className="font-bold text-xs sm:text-sm text-slate-800">
                  {cat.name}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cat.badgeBg} ${cat.textColor}`}>
                {cat.percentage}%
              </span>
            </div>

            <div className="mt-1">
              <div className="text-base sm:text-lg font-bold font-mono-numeric text-slate-900 leading-tight">
                {formatMoney(cat.totalAllocated)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                {cat.pockets.length} กระเป๋า
              </div>
            </div>

            {/* Tiny progress bar */}
            <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full bg-gradient-to-r ${cat.accentColor} rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(100, cat.percentage)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
