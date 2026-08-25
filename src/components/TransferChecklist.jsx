import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Check, 
  Copy, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  Filter, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Eye,
  EyeOff,
  Save
} from 'lucide-react';
import { formatMoney } from '../utils/allocationEngine';
import { CATEGORIES, ROUND_PRESETS } from '../data/defaultPockets';

export function TransferChecklist({
  calculation,
  currentMode,
  setCurrentMode,
  incomeAmount,
  setIncomeAmount,
  checkedPocketsByRound = {},
  setCheckedPocketsByRound,
  onBackToCalculator,
  onSaveToHistory
}) {
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'completed'
  const [showZeroAmount, setShowZeroAmount] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Isolate checked state for this specific round
  const currentRoundChecks = checkedPocketsByRound[currentMode] || {};

  const allActivePockets = calculation.pocketResults;
  const nonZeroPockets = allActivePockets.filter(p => p.allocatedAmount > 0);
  
  const displayPockets = showZeroAmount ? allActivePockets : nonZeroPockets;
  const totalCount = nonZeroPockets.length;
  const completedCount = nonZeroPockets.filter(p => currentRoundChecks[p.id]).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const totalTransferred = nonZeroPockets
    .filter(p => currentRoundChecks[p.id])
    .reduce((sum, p) => sum + p.allocatedAmount, 0);

  // Trigger confetti when 100% complete
  useEffect(() => {
    if (totalCount > 0 && completedCount === totalCount) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [completedCount, totalCount]);

  const toggleCheck = (pocketId) => {
    setCheckedPocketsByRound(prev => ({
      ...prev,
      [currentMode]: {
        ...(prev[currentMode] || {}),
        [pocketId]: !(prev[currentMode]?.[pocketId])
      }
    }));
  };

  const handleCopyAmount = (pocket) => {
    navigator.clipboard.writeText(pocket.allocatedAmount.toString());
    setCopiedId(`amt_${pocket.id}`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopyName = (pocket) => {
    navigator.clipboard.writeText(pocket.name);
    setCopiedId(`name_${pocket.id}`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleResetChecklist = () => {
    if (window.confirm(`ต้องการล้างเครื่องหมายติ๊กถูกของ ${currentMode === 'round10' ? 'รอบ 10' : currentMode === 'round25' ? 'รอบ 25' : 'เงินพิเศษ'} ทั้งหมดเพื่อเริ่มโอนใหม่หรือไม่?`)) {
      setCheckedPocketsByRound(prev => ({
        ...prev,
        [currentMode]: {}
      }));
    }
  };

  const handleCheckAll = () => {
    const allChecked = {};
    nonZeroPockets.forEach(p => {
      allChecked[p.id] = true;
    });
    setCheckedPocketsByRound(prev => ({
      ...prev,
      [currentMode]: allChecked
    }));
  };

  const handleSaveHistoryDirect = () => {
    if (onSaveToHistory) {
      onSaveToHistory({
        mode: currentMode,
        totalIncome: calculation.income,
        summary: calculation.summary,
        pocketResults: calculation.pocketResults,
        categoryBreakdown: calculation.categoryBreakdown,
        note: `โอนสำเร็จ ${completedCount}/${totalCount} กระเป๋า (${progressPercent}%)`
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  // Filter pockets
  const filteredPockets = displayPockets.filter(pocket => {
    if (filterCategory !== 'all' && pocket.categoryId !== filterCategory) return false;
    const isDone = !!currentRoundChecks[pocket.id];
    if (filterStatus === 'pending' && isDone) return false;
    if (filterStatus === 'completed' && !isDone) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Status & Progress Banner */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl text-white p-5 sm:p-7 shadow-lg shadow-emerald-700/20">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={onBackToCalculator}
                className="inline-flex items-center gap-1 text-xs text-emerald-100 hover:text-white bg-emerald-800/60 px-2.5 py-1 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>กลับหน้าคำนวณ</span>
              </button>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold">
              Checklist ผู้ช่วยโอนเงินเข้า MAKE
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
              เปิดแอป MAKE by KBank แล้วกด Copy ยอดเงินไปโอนทีละ Cloud Pocket ได้เลย!
            </p>
          </div>

          {/* Transfer Counter */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 sm:text-right">
            <span className="text-xs text-emerald-100 block">โอนแล้ว / ยอดรวม</span>
            <div className="text-xl sm:text-2xl font-bold font-mono-numeric">
              {formatMoney(totalTransferred)} / {formatMoney(calculation.summary.totalAllocated)}
            </div>
            <span className="text-xs text-emerald-200 block mt-0.5">
              {completedCount} จาก {totalCount} กระเป๋า ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Quick Mode Switcher inside Checklist */}
        <div className="mt-4 pt-3 border-t border-emerald-500/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-emerald-200 font-medium">สลับรอบโอน:</span>
            {ROUND_PRESETS.map((preset) => {
              const isSelected = currentMode === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setCurrentMode(preset.id);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'bg-emerald-800/50 hover:bg-emerald-800/80 text-emerald-100'
                  }`}
                >
                  <span>{preset.icon} {preset.shortName}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Save to History Button */}
          <button
            onClick={handleSaveHistoryDirect}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-950/90 text-emerald-100 border border-emerald-400/40 text-xs font-semibold transition-all"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-amber-200">บันทึกประวัติแล้ว!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกประวัติรอบนี้</span>
              </>
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-emerald-950/40 h-3 rounded-full overflow-hidden p-0.5 border border-white/20">
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-emerald-300 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {progressPercent === 100 && totalCount > 0 && (
          <div className="mt-4 bg-white/20 backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-white/30 animate-bounce">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300 flex-shrink-0" />
              <span className="text-sm font-semibold">
                🎉 ยอดเยี่ยมมาก! คุณโอนเงินเข้า Cloud Pocket ครบตามแผนเรียบร้อยแล้ว!
              </span>
            </div>
            <button
              onClick={handleSaveHistoryDirect}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all whitespace-nowrap"
            >
              <Save className="w-4 h-4" />
              <span>{savedSuccess ? 'บันทึกประวัติเรียบร้อย!' : 'กดบันทึกลงประวัติ'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col gap-3">
        
        {/* Category Filters: ALWAYS show all 5 categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({displayPockets.length})
          </button>

          {CATEGORIES.map(cat => {
            const count = (showZeroAmount ? allActivePockets : nonZeroPockets).filter(p => p.categoryId === cat.id).length;
            const isSelected = filterCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                  isSelected
                    ? `${cat.bgColor} ${cat.textColor} font-bold border ${cat.borderColor}`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Status Filter + Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="all">สถานะ: ทั้งหมด</option>
              <option value="pending">⏳ ยังไม่โอน</option>
              <option value="completed">✅ โอนแล้ว</option>
            </select>

            <button
              onClick={() => setShowZeroAmount(!showZeroAmount)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors ${
                showZeroAmount
                  ? 'bg-amber-50 border-amber-200 text-amber-800 font-medium'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {showZeroAmount ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showZeroAmount ? 'แสดงกระเป๋า ฿0 ด้วย' : 'ซ่อนกระเป๋า ฿0'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleCheckAll}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium whitespace-nowrap"
            >
              ติ๊กครบทั้งหมด
            </button>

            <button
              onClick={handleResetChecklist}
              title="ล้างเครื่องหมายติ๊กถูกของรอบนี้"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Pocket Checklist Rows */}
      <div className="space-y-2.5">
        {filteredPockets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            <p className="font-semibold text-slate-700 mb-1">
              ไม่มีกระเป๋าเงินในตัวกรองนี้
            </p>
            <p className="text-xs text-slate-400">
              {currentMode === 'special' && filterCategory === 'squirrel'
                ? '💡 ในโหมด "เงินพิเศษ" มีเฉพาะ 1Life ที่จัดสรร 10% (Fix Cost ไม่ถูกหัก)'
                : 'ลองเปลี่ยนโหมดรอบการโอน หรือคลิก "แสดงกระเป๋า ฿0 ด้วย"'}
            </p>
          </div>
        ) : (
          filteredPockets.map((pocket) => {
            const isDone = !!currentRoundChecks[pocket.id];
            const category = CATEGORIES.find(c => c.id === pocket.categoryId);
            const isAmtCopied = copiedId === `amt_${pocket.id}`;
            const isNameCopied = copiedId === `name_${pocket.id}`;
            const isZero = pocket.allocatedAmount === 0;

            return (
              <div
                key={pocket.id}
                onClick={() => !isZero && toggleCheck(pocket.id)}
                className={`bg-white rounded-2xl border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none group ${
                  isZero
                    ? 'opacity-40 bg-slate-50/70 border-slate-200 cursor-default'
                    : isDone
                    ? 'border-emerald-200 bg-emerald-50/30 opacity-75 cursor-pointer'
                    : 'border-slate-200 hover:border-emerald-300 hover:shadow-sm cursor-pointer'
                }`}
              >
                {/* Left: Checkbox + Pocket Details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                      isZero
                        ? 'border-slate-200 bg-slate-100 text-transparent'
                        : isDone
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'border-slate-300 bg-white group-hover:border-emerald-500'
                    }`}
                  >
                    {isDone && !isZero && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>

                  <span className="text-2xl flex-shrink-0">{pocket.emoji || '📁'}</span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-sm sm:text-base ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {pocket.name}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${category?.badgeBg} ${category?.textColor}`}>
                        {category?.emoji} {category?.name}
                      </span>
                    </div>
                    {pocket.description && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {pocket.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Copy Buttons & Amount */}
                <div
                  className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block">ยอดที่ต้องโอน</span>
                    <span className={`text-lg sm:text-xl font-bold font-mono-numeric ${
                      isZero ? 'text-slate-400' : isDone ? 'text-emerald-700' : 'text-slate-900'
                    }`}>
                      {formatMoney(pocket.allocatedAmount)}
                    </span>
                  </div>

                  {/* Copy Amount Button */}
                  <button
                    disabled={isZero}
                    onClick={() => handleCopyAmount(pocket)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                      isZero
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isAmtCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                    title="คัดลอกตัวเลขยอดเงิน"
                  >
                    {isAmtCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>คัดลอกแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอก ฿{pocket.allocatedAmount}</span>
                      </>
                    )}
                  </button>

                  {/* Copy Pocket Name Button */}
                  <button
                    onClick={() => handleCopyName(pocket)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                    title="คัดลอกชื่อกระเป๋า"
                  >
                    {isNameCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
