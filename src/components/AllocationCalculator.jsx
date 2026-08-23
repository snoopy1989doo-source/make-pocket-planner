import React, { useState, useEffect } from 'react';
import { ROUND_PRESETS } from '../data/defaultPockets';
import { SummaryCards } from './SummaryCards';
import { PocketCard } from './PocketCard';
import { formatMoney } from '../utils/allocationEngine';
import { 
  ArrowRight, 
  Save, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Wallet, 
  ChevronDown, 
  ChevronUp,
  Edit3,
  Check,
  X,
  RotateCcw
} from 'lucide-react';

export function AllocationCalculator({
  currentMode,
  setCurrentMode,
  incomeAmount,
  setIncomeAmount,
  calculation,
  roundDescriptions = {},
  onUpdateDescription,
  onResetDescription,
  onGoToChecklist,
  onSaveToHistory
}) {
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [note, setNote] = useState('');

  // Editable pinned note state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');

  const currentPresetInfo = ROUND_PRESETS.find(p => p.id === currentMode);
  const currentDescription = roundDescriptions[currentMode] || currentPresetInfo?.description || '';

  // Sync draft when mode changes or when entering edit mode
  useEffect(() => {
    setNoteDraft(currentDescription);
    setIsEditingNote(false);
  }, [currentMode, currentDescription]);

  const handleStartEditNote = () => {
    setNoteDraft(currentDescription);
    setIsEditingNote(true);
  };

  const handleSaveNote = () => {
    if (onUpdateDescription) {
      onUpdateDescription(currentMode, noteDraft.trim());
    }
    setIsEditingNote(false);
  };

  const handleCancelEditNote = () => {
    setNoteDraft(currentDescription);
    setIsEditingNote(false);
  };

  const handleResetNote = () => {
    if (onResetDescription) {
      onResetDescription(currentMode);
    }
    setIsEditingNote(false);
  };

  const quickAmounts = currentMode === 'special'
    ? [3000, 5000, 10000, 20000, 50000]
    : [3000, 6000, 8000, 10000, 12000];

  const toggleCategory = (catId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleSave = () => {
    onSaveToHistory({
      mode: currentMode,
      totalIncome: calculation.income,
      summary: calculation.summary,
      pocketResults: calculation.pocketResults,
      categoryBreakdown: calculation.categoryBreakdown,
      note: note.trim()
    });
    setSaveSuccess(true);
    setNote('');
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* --- SECTION 1: Income & Mode Selector Card --- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6">
        
        {/* Round / Mode Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              เลือกรอบรายรับ / โหมดจัดสรร
            </label>
            <div className="flex flex-wrap gap-2">
              {ROUND_PRESETS.map((preset) => {
                const isSelected = currentMode === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setCurrentMode(preset.id);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 ring-2 ring-amber-500/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editable Preset Context Info (📌 Pinned Note) */}
          <div className="w-full lg:max-w-md bg-slate-50 p-3 rounded-2xl border border-slate-200/80 shadow-2xs relative group">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <span>📌</span>
                <span>{currentPresetInfo?.shortName}:</span>
              </span>

              {!isEditingNote ? (
                <button
                  onClick={handleStartEditNote}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-100/80 hover:bg-amber-200/80 px-2 py-0.5 rounded-md transition-colors"
                  title="แก้ไขโน้ตปักหมุดนี้"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>แก้ไขโน้ต</span>
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleResetNote}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-200 rounded text-[10px]"
                    title="คืนค่าเริ่มต้น"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {isEditingNote ? (
              <div className="space-y-2 mt-1.5">
                <textarea
                  rows={3}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="พิมพ์ข้อความโน้ตช่วยจำสำหรับรอบนี้..."
                  className="w-full text-xs p-2 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={handleCancelEditNote}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 text-xs font-medium"
                  >
                    <X className="w-3 h-3" />
                    <span>ยกเลิก</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs"
                  >
                    <Check className="w-3 h-3" />
                    <span>บันทึก</span>
                  </button>
                </div>
              </div>
            ) : (
              <p
                onClick={handleStartEditNote}
                className="text-xs text-slate-600 leading-relaxed cursor-pointer hover:text-slate-900 transition-colors"
                title="คลิกเพื่อแก้ไขโน้ต"
              >
                {currentDescription}
              </p>
            )}
          </div>

        </div>

        {/* Input Amount Section */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          <div className="md:col-span-6">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              ระบุยอดเงินที่ได้รับ (บาท)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 font-mono-numeric">
                ฿
              </span>
              <input
                type="number"
                min="0"
                step="100"
                value={incomeAmount || ''}
                onChange={(e) => setIncomeAmount(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl text-2xl sm:text-3xl font-bold font-mono-numeric text-slate-900 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="md:col-span-6">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              ยอดยอดนิยม / แนะนำ
            </label>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setIncomeAmount(amt)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono-numeric transition-all ${
                    incomeAmount === amt
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {formatMoney(amt)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Summary Metric Row */}
        <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-[11px] text-slate-500 block">ยอดรวมทั้งหมด</span>
            <span className="text-base sm:text-lg font-bold font-mono-numeric text-slate-900">
              {formatMoney(calculation.summary.totalIncome)}
            </span>
          </div>

          <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/60">
            <span className="text-[11px] text-amber-700 block">หัก Fixed Cost ล่วงหน้า</span>
            <span className="text-base sm:text-lg font-bold font-mono-numeric text-amber-800">
              {formatMoney(calculation.summary.totalFixed)}
            </span>
          </div>

          <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-200/60">
            <span className="text-[11px] text-emerald-700 block">เงินกระจายตามสัดส่วน (%)</span>
            <span className="text-base sm:text-lg font-bold font-mono-numeric text-emerald-800">
              {formatMoney(calculation.summary.totalVariable)}
            </span>
          </div>

          <div className={`rounded-xl p-3 border ${
            calculation.summary.unallocatedAmount > 0 
              ? 'bg-orange-50 border-orange-200 text-orange-800' 
              : 'bg-slate-50 border-slate-200/70 text-slate-600'
          }`}>
            <span className="text-[11px] block">
              {calculation.summary.unallocatedAmount > 0 ? 'คงเหลือยังไม่จัดสรร' : 'จัดสรรครบ 100%'}
            </span>
            <span className="text-base sm:text-lg font-bold font-mono-numeric">
              {formatMoney(calculation.summary.unallocatedAmount)}
            </span>
          </div>
        </div>

      </div>

      {/* --- SECTION 2: 5 Main Categories Summary Cards --- */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>📊</span>
            <span>ภาพรวมการกระจายเงิน 5 หมวดหมู่</span>
          </h3>
          <span className="text-xs text-slate-400">
            รวม {calculation.pocketResults.length} Cloud Pockets
          </span>
        </div>
        <SummaryCards 
          categoryBreakdown={calculation.categoryBreakdown} 
          totalIncome={calculation.income} 
        />
      </div>

      {/* --- SECTION 3: Detailed Pocket Breakdown by Category --- */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span>📁</span>
          <span>รายการแบ่งเงินลง Cloud Pocket (รายกระเป๋า)</span>
        </h3>

        {calculation.categoryBreakdown.map((cat) => {
          const isCollapsed = collapsedCategories[cat.id];
          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Category Section Header */}
              <button
                onClick={() => toggleCategory(cat.id)}
                className={`w-full px-4 py-3 flex items-center justify-between transition-colors border-b ${cat.bgColor} ${cat.borderColor}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{cat.emoji}</span>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {cat.name}
                      </span>
                      <span className="text-xs text-slate-500 hidden sm:inline">
                        • {cat.thName}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      {cat.pockets.length} กระเป๋า • รวม {formatMoney(cat.totalAllocated)} ({cat.percentage}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm sm:text-base font-mono-numeric text-slate-900">
                    {formatMoney(cat.totalAllocated)}
                  </span>
                  {isCollapsed ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Pockets Grid inside category */}
              {!isCollapsed && (
                <div className="p-3 sm:p-4 bg-slate-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {cat.pockets.map((pocket) => (
                      <PocketCard
                        key={pocket.id}
                        pocket={pocket}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- SECTION 4: Bottom Action Bar (Save History & Go to Transfer Mode) --- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Optional Note input */}
        <div className="w-full sm:w-auto flex-1 max-w-md">
          <input
            type="text"
            placeholder="บันทึกช่วยจำ (เช่น เงินเดือน มี.ค. 69 รอบ 10, โบนัสโปรเจกต์)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={handleSave}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs sm:text-sm transition-colors"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">บันทึกแล้ว!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>บันทึกประวัติ</span>
              </>
            )}
          </button>

          <button
            onClick={onGoToChecklist}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
          >
            <span>เริ่มโอนเข้า MAKE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
