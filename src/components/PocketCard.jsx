import React, { useState } from 'react';
import { Copy, Check, Info } from 'lucide-react';
import { formatMoney } from '../utils/allocationEngine';

export function PocketCard({ pocket, onCopyAmount, onCopyName }) {
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedName, setCopiedName] = useState(false);

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(pocket.allocatedAmount.toString());
    setCopiedAmount(true);
    if (onCopyAmount) onCopyAmount(pocket);
    setTimeout(() => setCopiedAmount(false), 1500);
  };

  const handleCopyName = () => {
    navigator.clipboard.writeText(pocket.name);
    setCopiedName(true);
    if (onCopyName) onCopyName(pocket);
    setTimeout(() => setCopiedName(false), 1500);
  };

  const isFixed = pocket.ruleUsed?.mode === 'fixed';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between group">
      <div>
        {/* Top bar: Emoji, Name, Type badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl flex-shrink-0">{pocket.emoji || '📁'}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-slate-800 text-sm truncate" title={pocket.name}>
                  {pocket.name}
                </h4>
                <button
                  onClick={handleCopyName}
                  title="คัดลอกชื่อกระเป๋า"
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity p-0.5"
                >
                  {copiedName ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              {pocket.description && (
                <p className="text-[11px] text-slate-400 truncate mt-0.5" title={pocket.description}>
                  {pocket.description}
                </p>
              )}
            </div>
          </div>

          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
              isFixed
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}
          >
            {isFixed ? 'Fix' : `${pocket.ruleUsed?.value || 0}%`}
          </span>
        </div>
      </div>

      {/* Bottom bar: Amount & Quick Copy */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-400 block">ยอดจัดสรร</span>
          <span className="text-base font-bold font-mono-numeric text-slate-900">
            {formatMoney(pocket.allocatedAmount)}
          </span>
          {pocket.allocatedAmount > 0 && (
            <span className="text-[10px] text-slate-400 ml-1">
              ({pocket.percentOfTotal}%)
            </span>
          )}
        </div>

        <button
          onClick={handleCopyAmount}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            copiedAmount
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 hover:border-emerald-200'
          }`}
          title="คัดลอกยอดเงินไปวางใน MAKE"
        >
          {copiedAmount ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>คัดลอกแล้ว</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
