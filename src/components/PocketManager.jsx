import React, { useState, useMemo } from 'react';
import { CATEGORIES, DEFAULT_POCKETS, ROUND_PRESETS } from '../data/defaultPockets';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  RotateCcw, 
  HelpCircle, 
  Sparkles,
  Sliders,
  Eye,
  EyeOff,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { formatMoney, calculateAllocation } from '../utils/allocationEngine';

export function PocketManager({ pockets, setPockets, incomeAmounts = { round10: 6000, round25: 6000, special: 5000 } }) {
  const [editingPocket, setEditingPocket] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    categoryId: 'squirrel',
    emoji: '💰',
    description: '',
    isActive: true,
    rules: {
      round10: { mode: 'percent_remaining', value: 5 },
      round25: { mode: 'percent_remaining', value: 5 },
      special: { mode: 'percent_remaining', value: 5 }
    }
  });

  const base10 = incomeAmounts?.round10 || 6000;
  const base25 = incomeAmounts?.round25 || 6000;
  const baseSpecial = incomeAmounts?.special || 5000;

  // Calculate live preview allocations for all 3 modes
  const r10Alloc = useMemo(() => calculateAllocation(base10, 'round10', pockets), [base10, pockets]);
  const r25Alloc = useMemo(() => calculateAllocation(base25, 'round25', pockets), [base25, pockets]);
  const specAlloc = useMemo(() => calculateAllocation(baseSpecial, 'special', pockets), [baseSpecial, pockets]);

  // Helper to get estimated amount for an existing pocket in a mode
  const getEstimatedAmount = (pocketId, mode) => {
    let resultList = [];
    if (mode === 'round10') resultList = r10Alloc.pocketResults;
    else if (mode === 'round25') resultList = r25Alloc.pocketResults;
    else resultList = specAlloc.pocketResults;

    const match = resultList.find(p => p.id === pocketId);
    return match ? match.allocatedAmount : 0;
  };

  // Helper to get live breakdown & remaining stats for current formData being edited
  const getFormModeStats = (mode) => {
    const baseIncome = mode === 'round10' ? base10 : mode === 'round25' ? base25 : baseSpecial;
    
    // Construct temporary pockets list with formData
    const tempPockets = isAddingNew
      ? [...pockets.filter(p => p.id !== formData.id), formData]
      : pockets.map(p => p.id === formData.id ? formData : p);

    let fixedSum = 0;
    let pctSum = 0;

    tempPockets.filter(p => p.isActive).forEach(p => {
      const rule = p.rules?.[mode] || { mode: 'percent_remaining', value: 0 };
      if (rule.mode === 'fixed') fixedSum += Number(rule.value) || 0;
      else pctSum += Number(rule.value) || 0;
    });

    const availForPct = Math.max(0, baseIncome - fixedSum);
    const roundedPctSum = Math.round(pctSum * 10) / 10;
    const remainingPct = Math.round((100 - roundedPctSum) * 10) / 10;
    const remainingBaht = Math.round(((remainingPct / 100) * availForPct) * 100) / 100;

    // Estimate for current pocket
    const currentRule = formData.rules?.[mode] || { mode: 'percent_remaining', value: 0 };
    const currentPocketAmount = currentRule.mode === 'fixed'
      ? Number(currentRule.value) || 0
      : Math.round(((Number(currentRule.value) || 0) / 100) * availForPct);

    return {
      baseIncome,
      fixedSum,
      availForPct,
      pctSum: roundedPctSum,
      remainingPct,
      remainingBaht,
      currentPocketAmount
    };
  };

  const handleStartAdd = () => {
    const newId = 'p_' + Date.now();
    setFormData({
      id: newId,
      name: '',
      categoryId: selectedCategoryFilter !== 'all' ? selectedCategoryFilter : 'squirrel',
      emoji: '💰',
      description: '',
      isActive: true,
      rules: {
        round10: { mode: 'percent_remaining', value: 5 },
        round25: { mode: 'percent_remaining', value: 5 },
        special: { mode: 'percent_remaining', value: 5 }
      }
    });
    setIsAddingNew(true);
    setEditingPocket(null);
  };

  const handleStartEdit = (pocket) => {
    setFormData(JSON.parse(JSON.stringify(pocket)));
    setEditingPocket(pocket.id);
    setIsAddingNew(false);
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('กรุณากรอกชื่อ Cloud Pocket');
      return;
    }

    if (isAddingNew) {
      setPockets(prev => [...prev, formData]);
      setIsAddingNew(false);
    } else {
      setPockets(prev => prev.map(p => p.id === formData.id ? formData : p));
      setEditingPocket(null);
    }
  };

  const handleDelete = (pocketId) => {
    if (window.confirm('คุณต้องการลบ Cloud Pocket นี้ใช่หรือไม่?')) {
      setPockets(prev => prev.filter(p => p.id !== pocketId));
    }
  };

  const handleToggleActive = (pocketId) => {
    setPockets(prev => prev.map(p => {
      if (p.id === pocketId) {
        return { ...p, isActive: !p.isActive };
      }
      return p;
    }));
  };

  const handleResetToDefault = () => {
    if (window.confirm('ต้องการรีเซ็ตกระเป๋าทั้งหมดกลับเป็นค่าเริ่มต้นตามที่กำหนดไว้หรือไม่?')) {
      setPockets(DEFAULT_POCKETS);
    }
  };

  const filteredPockets = selectedCategoryFilter === 'all'
    ? pockets
    : pockets.filter(p => p.categoryId === selectedCategoryFilter);

  // Render stats for each mode in form
  const r10FormStats = getFormModeStats('round10');
  const r25FormStats = getFormModeStats('round25');
  const specFormStats = getFormModeStats('special');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Banner & Stats */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>⚙️</span>
              <span>จัดการ Cloud Pockets & กฎการกระจายเงิน</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              กำหนดสัดส่วน %, ยอด Fix Cost และดูสัดส่วนคงเหลือ/ยอดเงินที่แบ่งได้แบบ Real-time
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มกระเป๋าใหม่</span>
            </button>

            <button
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
              title="รีเซ็ตเป็นค่าเริ่มต้น"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">คืนค่าเริ่มต้น</span>
            </button>
          </div>
        </div>

        {/* Allocation Rules Check Matrix */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Round 10 */}
          <div className={`p-3.5 rounded-xl border ${
            r10Alloc.summary.unallocatedAmount > 0 ? 'bg-blue-50/70 border-blue-200' : r10Alloc.summary.totalPercentConfigured > 100 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200/70'
          }`}>
            <div className="font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span>🗓️ รอบ 10 (ฐาน {formatMoney(base10)})</span>
              <span className={`font-bold px-1.5 py-0.5 rounded ${
                r10Alloc.summary.totalPercentConfigured === 100 ? 'text-emerald-700 bg-emerald-100' : 'text-amber-800 bg-amber-100'
              }`}>
                รวม {r10Alloc.summary.totalPercentConfigured}%
              </span>
            </div>
            <div className="flex justify-between text-slate-500 mt-1">
              <span>Fixed: <b>{formatMoney(r10Alloc.summary.totalFixed)}</b></span>
              <span>เหลือแบ่งได้: <b className="text-slate-700">{formatMoney(r10Alloc.summary.unallocatedAmount)}</b></span>
            </div>
          </div>

          {/* Round 25 */}
          <div className={`p-3.5 rounded-xl border ${
            r25Alloc.summary.unallocatedAmount > 0 ? 'bg-blue-50/70 border-blue-200' : r25Alloc.summary.totalPercentConfigured > 100 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200/70'
          }`}>
            <div className="font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span>📅 รอบ 25 (ฐาน {formatMoney(base25)})</span>
              <span className={`font-bold px-1.5 py-0.5 rounded ${
                r25Alloc.summary.totalPercentConfigured === 100 ? 'text-emerald-700 bg-emerald-100' : 'text-amber-800 bg-amber-100'
              }`}>
                รวม {r25Alloc.summary.totalPercentConfigured}%
              </span>
            </div>
            <div className="flex justify-between text-slate-500 mt-1">
              <span>Fixed: <b>{formatMoney(r25Alloc.summary.totalFixed)}</b></span>
              <span>เหลือแบ่งได้: <b className="text-slate-700">{formatMoney(r25Alloc.summary.unallocatedAmount)}</b></span>
            </div>
          </div>

          {/* Special */}
          <div className={`p-3.5 rounded-xl border ${
            specAlloc.summary.unallocatedAmount > 0 ? 'bg-blue-50/70 border-blue-200' : specAlloc.summary.totalPercentConfigured > 100 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200/70'
          }`}>
            <div className="font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span>✨ เงินพิเศษ (ฐาน {formatMoney(baseSpecial)})</span>
              <span className={`font-bold px-1.5 py-0.5 rounded ${
                specAlloc.summary.totalPercentConfigured === 100 ? 'text-emerald-700 bg-emerald-100' : 'text-amber-800 bg-amber-100'
              }`}>
                รวม {specAlloc.summary.totalPercentConfigured}%
              </span>
            </div>
            <div className="flex justify-between text-slate-500 mt-1">
              <span>Fixed: <b>{formatMoney(specAlloc.summary.totalFixed)}</b></span>
              <span>เหลือแบ่งได้: <b className="text-slate-700">{formatMoney(specAlloc.summary.unallocatedAmount)}</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCategoryFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          ทั้งหมด ({pockets.length})
        </button>

        {CATEGORIES.map(cat => {
          const count = pockets.filter(p => p.categoryId === cat.id).length;
          const isSelected = selectedCategoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                isSelected
                  ? `${cat.bgColor} ${cat.textColor} font-bold border ${cat.borderColor}`
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Add / Edit Pocket Modal / Form */}
      {(isAddingNew || editingPocket) && (
        <form
          onSubmit={handleSaveForm}
          className="bg-white rounded-2xl border-2 border-amber-400 p-5 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>{isAddingNew ? '✨ เพิ่ม Cloud Pocket ใหม่' : '✏️ แก้ไข Cloud Pocket'}</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setEditingPocket(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            
            {/* Emoji picker */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 block mb-1">ไอคอน</label>
              <input
                type="text"
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                className="w-full text-center py-2 text-2xl bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
                maxLength={4}
              />
            </div>

            {/* Name */}
            <div className="sm:col-span-5">
              <label className="text-xs font-semibold text-slate-600 block mb-1">ชื่อ Cloud Pocket *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="เช่น ค่ากิน, กยศ., Next Gen"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Category */}
            <div className="sm:col-span-5">
              <label className="text-xs font-semibold text-slate-600 block mb-1">หมวดหมู่หลัก (5 สัตว์)</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name} ({c.thName})
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="sm:col-span-12">
              <label className="text-xs font-semibold text-slate-600 block mb-1">คำอธิบายเพิ่มเติม / เป้าหมาย</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="เช่น ค่ากินรายปักษ์, ออมทอง, พอร์ตเทรด XM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

          </div>

          {/* Allocation Rules for 3 modes with Live Remaining % & Remaining Baht */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              ตั้งค่าสูตรการกระจายเงิน (3 โหมด)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              
              {/* --- ROUND 10 --- */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      🗓️ รอบวันที่ 10
                    </span>
                    <span className="text-xs font-bold font-mono-numeric text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                      ≈ {formatMoney(r10FormStats.currentPocketAmount)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <select
                      value={formData.rules.round10.mode}
                      onChange={(e) => setFormData({
                        ...formData,
                        rules: {
                          ...formData.rules,
                          round10: { ...formData.rules.round10, mode: e.target.value }
                        }
                      })}
                      className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    >
                      <option value="percent_remaining">% ของเงินที่เหลือ</option>
                      <option value="fixed">Fixed ยอดคงที่ (บาท)</option>
                    </select>

                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.rules.round10.value === 0 ? '' : formData.rules.round10.value}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/^0+(?=\d)/, '');
                          setFormData({
                            ...formData,
                            rules: {
                              ...formData.rules,
                              round10: { ...formData.rules.round10, value: raw === '' ? 0 : Number(raw) }
                            }
                          });
                        }}
                        className="w-full px-3 py-1.5 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-bold font-mono-numeric focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                        {formData.rules.round10.mode === 'fixed' ? '฿' : '%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remaining % and Baht Badge */}
                <div className={`text-[11px] p-2 rounded-lg border leading-tight ${
                  r10FormStats.remainingPct === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : r10FormStats.remainingPct > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="font-semibold flex items-center justify-between">
                    <span>สัดส่วนรวม: {r10FormStats.pctSum}%</span>
                    <span>{r10FormStats.remainingPct === 0 ? '✅ ครบ 100%' : r10FormStats.remainingPct > 0 ? `เหลืออีก ${r10FormStats.remainingPct}%` : `เกินมา ${Math.abs(r10FormStats.remainingPct)}%`}</span>
                  </div>
                  <div className="text-[10px] mt-0.5 opacity-90">
                    {r10FormStats.remainingPct > 0
                      ? `ยังเหลือแบ่งได้อีก ≈ ${formatMoney(r10FormStats.remainingBaht)}`
                      : r10FormStats.remainingPct < 0
                      ? `ยอดเงินเกินงบ ≈ ${formatMoney(Math.abs(r10FormStats.remainingBaht))}`
                      : 'ยอดจัดสรรลงตัวพอดี 100%'}
                  </div>
                </div>
              </div>

              {/* --- ROUND 25 --- */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      📅 รอบวันที่ 25
                    </span>
                    <span className="text-xs font-bold font-mono-numeric text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                      ≈ {formatMoney(r25FormStats.currentPocketAmount)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <select
                      value={formData.rules.round25.mode}
                      onChange={(e) => setFormData({
                        ...formData,
                        rules: {
                          ...formData.rules,
                          round25: { ...formData.rules.round25, mode: e.target.value }
                        }
                      })}
                      className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    >
                      <option value="percent_remaining">% ของเงินที่เหลือ</option>
                      <option value="fixed">Fixed ยอดคงที่ (บาท)</option>
                    </select>

                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.rules.round25.value === 0 ? '' : formData.rules.round25.value}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/^0+(?=\d)/, '');
                          setFormData({
                            ...formData,
                            rules: {
                              ...formData.rules,
                              round25: { ...formData.rules.round25, value: raw === '' ? 0 : Number(raw) }
                            }
                          });
                        }}
                        className="w-full px-3 py-1.5 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-bold font-mono-numeric focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                        {formData.rules.round25.mode === 'fixed' ? '฿' : '%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remaining % and Baht Badge */}
                <div className={`text-[11px] p-2 rounded-lg border leading-tight ${
                  r25FormStats.remainingPct === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : r25FormStats.remainingPct > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="font-semibold flex items-center justify-between">
                    <span>สัดส่วนรวม: {r25FormStats.pctSum}%</span>
                    <span>{r25FormStats.remainingPct === 0 ? '✅ ครบ 100%' : r25FormStats.remainingPct > 0 ? `เหลืออีก ${r25FormStats.remainingPct}%` : `เกินมา ${Math.abs(r25FormStats.remainingPct)}%`}</span>
                  </div>
                  <div className="text-[10px] mt-0.5 opacity-90">
                    {r25FormStats.remainingPct > 0
                      ? `ยังเหลือแบ่งได้อีก ≈ ${formatMoney(r25FormStats.remainingBaht)}`
                      : r25FormStats.remainingPct < 0
                      ? `ยอดเงินเกินงบ ≈ ${formatMoney(Math.abs(r25FormStats.remainingBaht))}`
                      : 'ยอดจัดสรรลงตัวพอดี 100%'}
                  </div>
                </div>
              </div>

              {/* --- SPECIAL --- */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      ✨ เงินพิเศษ
                    </span>
                    <span className="text-xs font-bold font-mono-numeric text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                      ≈ {formatMoney(specFormStats.currentPocketAmount)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <select
                      value={formData.rules.special.mode}
                      onChange={(e) => setFormData({
                        ...formData,
                        rules: {
                          ...formData.rules,
                          special: { ...formData.rules.special, mode: e.target.value }
                        }
                      })}
                      className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    >
                      <option value="percent_remaining">% ของเงินที่เหลือ</option>
                      <option value="fixed">Fixed ยอดคงที่ (บาท)</option>
                    </select>

                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.rules.special.value === 0 ? '' : formData.rules.special.value}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/^0+(?=\d)/, '');
                          setFormData({
                            ...formData,
                            rules: {
                              ...formData.rules,
                              special: { ...formData.rules.special, value: raw === '' ? 0 : Number(raw) }
                            }
                          });
                        }}
                        className="w-full px-3 py-1.5 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-bold font-mono-numeric focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                        {formData.rules.special.mode === 'fixed' ? '฿' : '%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remaining % and Baht Badge */}
                <div className={`text-[11px] p-2 rounded-lg border leading-tight ${
                  specFormStats.remainingPct === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : specFormStats.remainingPct > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="font-semibold flex items-center justify-between">
                    <span>สัดส่วนรวม: {specFormStats.pctSum}%</span>
                    <span>{specFormStats.remainingPct === 0 ? '✅ ครบ 100%' : specFormStats.remainingPct > 0 ? `เหลืออีก ${specFormStats.remainingPct}%` : `เกินมา ${Math.abs(specFormStats.remainingPct)}%`}</span>
                  </div>
                  <div className="text-[10px] mt-0.5 opacity-90">
                    {specFormStats.remainingPct > 0
                      ? `ยังเหลือแบ่งได้อีก ≈ ${formatMoney(specFormStats.remainingBaht)}`
                      : specFormStats.remainingPct < 0
                      ? `ยอดเงินเกินงบ ≈ ${formatMoney(Math.abs(specFormStats.remainingBaht))}`
                      : 'ยอดจัดสรรลงตัวพอดี 100%'}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setEditingPocket(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md shadow-amber-500/20"
            >
              บันทึกกระเป๋า
            </button>
          </div>
        </form>
      )}

      {/* Pocket List Table/Card Grid with Baht Amount Pill */}
      <div className="space-y-3">
        {filteredPockets.map((pocket) => {
          const category = CATEGORIES.find(c => c.id === pocket.categoryId);
          const r10Amt = getEstimatedAmount(pocket.id, 'round10');
          const r25Amt = getEstimatedAmount(pocket.id, 'round25');
          const specAmt = getEstimatedAmount(pocket.id, 'special');

          return (
            <div
              key={pocket.id}
              className={`bg-white rounded-2xl border p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                !pocket.isActive ? 'opacity-50 bg-slate-50/80 border-slate-200' : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <span className="text-2xl flex-shrink-0">{pocket.emoji || '📁'}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 text-sm sm:text-base">
                      {pocket.name}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${category?.badgeBg} ${category?.textColor}`}>
                      {category?.emoji} {category?.name}
                    </span>
                    {!pocket.isActive && (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">
                        ปิดใช้งาน
                      </span>
                    )}
                  </div>
                  {pocket.description && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {pocket.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Middle Rules Display with BOTH % and Estimated Baht Amount */}
              <div className="flex items-center gap-2 text-xs text-slate-600 overflow-x-auto py-1">
                {/* Round 10 */}
                <div className="bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/70 whitespace-nowrap">
                  <span className="text-slate-400 mr-1 text-[11px]">รอบ 10:</span>
                  <span className="font-bold font-mono-numeric text-slate-800">
                    {pocket.rules?.round10?.mode === 'fixed' ? `฿${pocket.rules.round10.value}` : `${pocket.rules?.round10?.value || 0}%`}
                  </span>
                  <span className="text-amber-700 font-bold font-mono-numeric ml-1.5 text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                    ≈ {formatMoney(r10Amt)}
                  </span>
                </div>

                {/* Round 25 */}
                <div className="bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/70 whitespace-nowrap">
                  <span className="text-slate-400 mr-1 text-[11px]">รอบ 25:</span>
                  <span className="font-bold font-mono-numeric text-slate-800">
                    {pocket.rules?.round25?.mode === 'fixed' ? `฿${pocket.rules.round25.value}` : `${pocket.rules?.round25?.value || 0}%`}
                  </span>
                  <span className="text-amber-700 font-bold font-mono-numeric ml-1.5 text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                    ≈ {formatMoney(r25Amt)}
                  </span>
                </div>

                {/* Special */}
                <div className="bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/70 whitespace-nowrap">
                  <span className="text-slate-400 mr-1 text-[11px]">เงินพิเศษ:</span>
                  <span className="font-bold font-mono-numeric text-slate-800">
                    {pocket.rules?.special?.mode === 'fixed' ? `฿${pocket.rules.special.value}` : `${pocket.rules?.special?.value || 0}%`}
                  </span>
                  <span className="text-amber-700 font-bold font-mono-numeric ml-1.5 text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                    ≈ {formatMoney(specAmt)}
                  </span>
                </div>
              </div>

              {/* Right Action buttons */}
              <div className="flex items-center justify-end gap-1 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  onClick={() => handleToggleActive(pocket.id)}
                  title={pocket.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                  className={`p-2 rounded-lg text-xs transition-colors ${
                    pocket.isActive ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                  }`}
                >
                  {pocket.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => handleStartEdit(pocket)}
                  className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="แก้ไขกระเป๋า"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(pocket.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="ลบกระเป๋า"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
