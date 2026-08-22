import React, { useState } from 'react';
import { formatMoney } from '../utils/allocationEngine';
import { ROUND_PRESETS } from '../data/defaultPockets';
import { 
  Calendar, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Wallet,
  Sparkles,
  FileText
} from 'lucide-react';

export function HistoryLog({ history, setHistory }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDeleteEntry = (id) => {
    if (window.confirm('คุณต้องการลบรายการประวัตินี้ใช่หรือไม่?')) {
      setHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleClearAll = () => {
    if (window.confirm('ต้องการล้างประวัติการจัดสรรทั้งหมดหรือไม่?')) {
      setHistory([]);
    }
  };

  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-2xl mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl mx-auto mb-4">
          📜
        </div>
        <h3 className="font-bold text-slate-800 text-lg mb-1">ยังไม่มีประวัติการจัดสรรเงิน</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          เมื่อคุณคำนวณและกดปุ่ม "บันทึกประวัติ" ในหน้าคำนวณ รายการสรุปยอดเงินและรายละเอียดแต่ละกระเป๋าจะถูกบันทึกไว้ที่นี่
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>📜</span>
            <span>ประวัติการจัดสรรเงินย้อนหลัง</span>
          </h2>
          <p className="text-xs text-slate-500">
            บันทึกไว้ทั้งหมด {history.length} รายการ
          </p>
        </div>

        <button
          onClick={handleClearAll}
          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors font-medium"
        >
          ล้างประวัติทั้งหมด
        </button>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {history.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const presetInfo = ROUND_PRESETS.find(p => p.id === entry.mode);
          const dateStr = new Date(entry.timestamp || Date.now()).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div
              key={entry.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
            >
              {/* Header / Summary Row */}
              <div
                onClick={() => toggleExpand(entry.id)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">
                    {presetInfo?.icon || '💰'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {presetInfo?.title || entry.mode}
                      </span>
                      <span className="text-xs text-slate-400">
                        • {dateStr}
                      </span>
                    </div>
                    {entry.note ? (
                      <p className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-1">
                        📝 {entry.note}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-0.5">
                        จัดสรรเข้า {entry.pocketResults?.filter(p => p.allocatedAmount > 0).length || 0} กระเป๋า
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block">ยอดรวมทั้งสิ้น</span>
                    <span className="text-base sm:text-lg font-bold font-mono-numeric text-slate-900">
                      {formatMoney(entry.totalIncome)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEntry(entry.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="ลบรายการนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Breakdown */}
              {isExpanded && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 border-t border-slate-100 bg-slate-50/50">
                  
                  {/* Category Summary Pill */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                    {entry.categoryBreakdown?.map(cat => (
                      <div key={cat.id} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center gap-1 text-slate-600 font-medium truncate">
                          <span>{cat.emoji}</span>
                          <span>{cat.name}</span>
                        </div>
                        <div className="font-bold font-mono-numeric text-slate-900 mt-1">
                          {formatMoney(cat.totalAllocated)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pockets Grid */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      รายละเอียดรายกระเป๋า (Cloud Pockets)
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {entry.pocketResults?.filter(p => p.allocatedAmount > 0).map(p => (
                        <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="font-medium text-slate-700 truncate mr-2">
                            {p.emoji} {p.name}
                          </span>
                          <span className="font-bold font-mono-numeric text-slate-900 whitespace-nowrap">
                            {formatMoney(p.allocatedAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
