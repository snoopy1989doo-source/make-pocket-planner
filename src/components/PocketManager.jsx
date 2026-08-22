import React, { useState } from 'react';
import { CATEGORIES, DEFAULT_POCKETS } from '../data/defaultPockets';
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
  EyeOff
} from 'lucide-react';
import { formatMoney } from '../utils/allocationEngine';

export function PocketManager({ pockets, setPockets }) {
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

  const handleStartAdd = () => {
    setFormData({
      id: 'p_' + Date.now(),
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

  // Calculate percentage sums
  const calculateModeStats = (mode) => {
    let fixSum = 0;
    let pctSum = 0;
    pockets.filter(p => p.isActive).forEach(p => {
      const rule = p.rules?.[mode] || { mode: 'percent_remaining', value: 0 };
      if (rule.mode === 'fixed') fixSum += Number(rule.value) || 0;
      else pctSum += Number(rule.value) || 0;
    });
    return { fixSum, pctSum: Math.round(pctSum * 10) / 10 };
  };

  const r10Stats = calculateModeStats('round10');
  const r25Stats = calculateModeStats('round25');
  const specialStats = calculateModeStats('special');

  const filteredPockets = selectedCategoryFilter === 'all'
    ? pockets
    : pockets.filter(p => p.categoryId === selectedCategoryFilter);

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
              กำหนดสัดส่วน %, ยอด Fix Cost, หมวดหมู่อนุสัญญา 5 สัตว์ (Squirrel, Rhino, Cat, Bee, Shark)
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
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <div className="font-semibold text-slate-700 mb-1">🗓️ รอบ 10 (ต้นเดือน)</div>
            <div className="flex justify-between text-slate-500">
              <span>Fixed รวม: <b>{formatMoney(r10Stats.fixSum)}</b></span>
              <span className={r10Stats.pctSum === 100 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                สัดส่วน %: {r10Stats.pctSum}%
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <div className="font-semibold text-slate-700 mb-1">📅 รอบ 25 (ปลายเดือน)</div>
            <div className="flex justify-between text-slate-500">
              <span>Fixed รวม: <b>{formatMoney(r25Stats.fixSum)}</b></span>
              <span className={r25Stats.pctSum === 100 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                สัดส่วน %: {r25Stats.pctSum}%
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <div className="font-semibold text-slate-700 mb-1">✨ เงินพิเศษ (Special)</div>
            <div className="flex justify-between text-slate-500">
              <span>Fixed รวม: <b>{formatMoney(specialStats.fixSum)}</b></span>
              <span className={specialStats.pctSum === 100 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                สัดส่วน %: {specialStats.pctSum}%
              </span>
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

      {/* Add / Edit Pocket Modal / Card */}
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
            
            {/* Emoji picker simple */}
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

          {/* Allocation Rules for 3 modes */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              ตั้งค่าสูตรการกระจายเงิน (3 โหมด)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Round 10 */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-800 block mb-2">
                  🗓️ รอบวันที่ 10
                </span>
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={formData.rules.round10.mode}
                    onChange={(e) => setFormData({
                      ...formData,
                      rules: {
                        ...formData.rules,
                        round10: { ...formData.rules.round10, mode: e.target.value }
                      }
                    })}
                    className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="percent_remaining">% ของเงินที่เหลือ</option>
                    <option value="fixed">Fixed ยอดตายตัว (บาท)</option>
                  </select>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.rules.round10.value}
                  onChange={(e) => setFormData({
                    ...formData,
                    rules: {
                      ...formData.rules,
                      round10: { ...formData.rules.round10, value: Number(e.target.value) }
                    }
                  })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold font-mono-numeric"
                />
              </div>

              {/* Round 25 */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-800 block mb-2">
                  📅 รอบวันที่ 25
                </span>
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={formData.rules.round25.mode}
                    onChange={(e) => setFormData({
                      ...formData,
                      rules: {
                        ...formData.rules,
                        round25: { ...formData.rules.round25, mode: e.target.value }
                      }
                    })}
                    className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="percent_remaining">% ของเงินที่เหลือ</option>
                    <option value="fixed">Fixed ยอดตายตัว (บาท)</option>
                  </select>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.rules.round25.value}
                  onChange={(e) => setFormData({
                    ...formData,
                    rules: {
                      ...formData.rules,
                      round25: { ...formData.rules.round25, value: Number(e.target.value) }
                    }
                  })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold font-mono-numeric"
                />
              </div>

              {/* Special */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-800 block mb-2">
                  ✨ เงินพิเศษ
                </span>
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={formData.rules.special.mode}
                    onChange={(e) => setFormData({
                      ...formData,
                      rules: {
                        ...formData.rules,
                        special: { ...formData.rules.special, mode: e.target.value }
                      }
                    })}
                    className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="percent_remaining">% ของเงินที่เหลือ</option>
                    <option value="fixed">Fixed ยอดตายตัว (บาท)</option>
                  </select>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.rules.special.value}
                  onChange={(e) => setFormData({
                    ...formData,
                    rules: {
                      ...formData.rules,
                      special: { ...formData.rules.special, value: Number(e.target.value) }
                    }
                  })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold font-mono-numeric"
                />
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

      {/* Pocket List Table/Card Grid */}
      <div className="space-y-3">
        {filteredPockets.map((pocket) => {
          const category = CATEGORIES.find(c => c.id === pocket.categoryId);
          const isBeingEdited = editingPocket === pocket.id;

          return (
            <div
              key={pocket.id}
              className={`bg-white rounded-2xl border p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                !pocket.isActive ? 'opacity-50 bg-slate-50/80 border-slate-200' : 'border-slate-200 hover:border-slate-300'
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

              {/* Middle Rules Display */}
              <div className="flex items-center gap-2 text-xs text-slate-600 overflow-x-auto py-1">
                <div className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/70 whitespace-nowrap">
                  <span className="text-slate-400 mr-1">รอบ 10:</span>
                  <span className="font-bold font-mono-numeric text-slate-700">
                    {pocket.rules?.round10?.mode === 'fixed' ? `฿${pocket.rules.round10.value}` : `${pocket.rules?.round10?.value || 0}%`}
                  </span>
                </div>
                <div className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/70 whitespace-nowrap">
                  <span className="text-slate-400 mr-1">รอบ 25:</span>
                  <span className="font-bold font-mono-numeric text-slate-700">
                    {pocket.rules?.round25?.mode === 'fixed' ? `฿${pocket.rules.round25.value}` : `${pocket.rules?.round25?.value || 0}%`}
                  </span>
                </div>
                <div className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/70 whitespace-nowrap">
                  <span className="text-slate-400 mr-1">เงินพิเศษ:</span>
                  <span className="font-bold font-mono-numeric text-slate-700">
                    {pocket.rules?.special?.mode === 'fixed' ? `฿${pocket.rules.special.value}` : `${pocket.rules?.special?.value || 0}%`}
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
