import React, { useState, useRef } from 'react';
import { 
  Calculator, 
  CheckSquare, 
  Settings, 
  History, 
  Download, 
  Upload, 
  RotateCcw, 
  Sparkles, 
  Coins,
  Database,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  RefreshCw,
  Layers
} from 'lucide-react';

export function Header({ 
  activeTab, 
  setActiveTab, 
  onExport, 
  onImport, 
  onResetDefaults, 
  onResetAllIncomeToZero,
  onResetAllPocketRulesToZero,
  onClearAllChecklists,
  pocketsCount = 0,
  loansCount = 0,
  historyCount = 0,
  activeLoanCount = 0 
}) {
  const [showStorageModal, setShowStorageModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          onImport(data);
          setShowStorageModal(false);
        } catch (err) {
          alert('ไฟล์สำรองไม่ถูกต้อง (JSON Invalid)');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <img
              src="./icon-192.png"
              alt="Money Planner"
              className="w-10 h-10 rounded-2xl object-cover shadow-md shadow-emerald-900/20 flex-shrink-0 border border-slate-200"
            />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Money Planner
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                Cloud Pocket
              </span>
            </div>
          </div>

          {/* Action Tools & Data Status */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
            <button
              onClick={() => setShowStorageModal(true)}
              title="ตรวจสอบสถานะการเก็บข้อมูล, สำรองข้อมูล, หรือรีเซ็ต"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-950 transition-colors font-semibold shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>การเก็บข้อมูล & รีเซ็ต</span>
            </button>

            <button
              onClick={onExport}
              title="สำรองข้อมูลเป็นไฟล์ JSON ทันที"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Backup</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-3.5 py-2.5 font-medium text-xs sm:text-sm rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'border-amber-500 text-amber-600 bg-amber-50/50 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>คำนวณ & วางแผน</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-2 px-3.5 py-2.5 font-medium text-xs sm:text-sm rounded-t-xl border-b-2 transition-all whitespace-nowrap relative ${
              activeTab === 'checklist'
                ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>ผู้ช่วยโอนเงิน MAKE</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>

          <button
            onClick={() => setActiveTab('loans')}
            className={`flex items-center gap-2 px-3.5 py-2.5 font-medium text-xs sm:text-sm rounded-t-xl border-b-2 transition-all whitespace-nowrap relative ${
              activeTab === 'loans'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>ยืมเงินตัวเอง & คืน</span>
            {activeLoanCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {activeLoanCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('manager')}
            className={`flex items-center gap-2 px-3.5 py-2.5 font-medium text-xs sm:text-sm rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'manager'
                ? 'border-amber-500 text-amber-600 bg-amber-50/50 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>จัดการกระเป๋า & กฎ</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2.5 font-medium text-xs sm:text-sm rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 bg-blue-50/50 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>ประวัติการจัดสรร</span>
          </button>
        </nav>
      </div>

      {/* Storage & Reset Management Modal */}
      {showStorageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    สถานะการเก็บข้อมูล & จัดการระบบ
                  </h3>
                  <p className="text-xs text-slate-500">
                    ความปลอดภัยข้อมูล, ตัวเลือกเริ่มรอบใหม่, และการสำรองข้อมูล
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStorageModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Storage Live Status Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>จัดเก็บบนเครื่อง (LocalStorage Auto-Save)</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  ออฟไลน์ 100% ปลอดภัย
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Cloud Pockets</span>
                  <span className="text-base font-bold font-mono-numeric text-slate-900">
                    {pocketsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 block">กระเป๋า</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">รายการยืมเงิน</span>
                  <span className="text-base font-bold font-mono-numeric text-indigo-700">
                    {loansCount}
                  </span>
                  <span className="text-[10px] text-slate-500 block">รายการ</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">ประวัติที่บันทึก</span>
                  <span className="text-base font-bold font-mono-numeric text-amber-700">
                    {historyCount}
                  </span>
                  <span className="text-[10px] text-slate-500 block">รายการ</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                ℹ️ ทุกการเปลี่ยนแปลงของคุณจะถูกบันทึกลงในเครื่องทันทีแบบ Real-time โดยไม่ต้องกดบันทึกซ้ำ
              </p>
            </div>

            {/* Reset Actions Section */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                🔄 ตัวเลือกการเริ่มใหม่ & รีเซ็ต
              </span>

              {/* Action 1: Reset Income to 0 (Keep pockets & rules) */}
              <button
                type="button"
                onClick={() => {
                  onResetAllIncomeToZero();
                  setShowStorageModal(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition-colors group"
              >
                <div>
                  <span className="text-xs font-bold text-amber-900 block flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                    <span>เซ็ตยอดเงินเป็น 0 บาท (เริ่มรอบใหม่)</span>
                  </span>
                  <span className="text-[11px] text-amber-700 block mt-0.5">
                    ล้างยอดเงินทุกรอบเป็น 0 และเคลียร์เครื่องหมายติ๊กโอน (กระเป๋าและกฎยังคงอยู่ครบ)
                  </span>
                </div>
                <span className="text-xs font-semibold text-amber-800 bg-amber-200/80 px-2 py-1 rounded-lg group-hover:bg-amber-300">
                  เริ่มรอบใหม่
                </span>
              </button>

              {/* Action 2: Reset All Pocket Rules to 0 */}
              {onResetAllPocketRulesToZero && (
                <button
                  type="button"
                  onClick={() => {
                    onResetAllPocketRulesToZero();
                    setShowStorageModal(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-left transition-colors group"
                >
                  <div>
                    <span className="text-xs font-bold text-orange-900 block flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-orange-700" />
                      <span>เซ็ตสัดส่วนกระเป๋า (Pockets) ทุกใบเป็น 0%</span>
                    </span>
                    <span className="text-[11px] text-orange-700 block mt-0.5">
                      ล้างสัดส่วน % และยอด Fixed ของทุกกระเป๋าเป็น 0 (รายชื่อกระเป๋าเดิมจะยังคงอยู่ครบ)
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-orange-800 bg-orange-200/80 px-2 py-1 rounded-lg group-hover:bg-orange-300">
                    เซ็ตกระเป๋าเป็น 0
                  </span>
                </button>
              )}

              {/* Action 3: Clear Checklist only */}
              <button
                type="button"
                onClick={() => {
                  onClearAllChecklists();
                  setShowStorageModal(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors group"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ล้างเครื่องหมายติ๊กโอนทุกรอบ</span>
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    รีเซ็ตติ๊กถูกการโอนให้กลับเป็นยังไม่ได้โอนทั้งหมด
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                  ล้างติ๊กโอน
                </span>
              </button>

              {/* Action 4: Factory Reset */}
              <button
                type="button"
                onClick={() => {
                  onResetDefaults();
                  setShowStorageModal(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-left transition-colors group"
              >
                <div>
                  <span className="text-xs font-bold text-rose-900 block flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                    <span>คืนค่าเริ่มต้นโรงงาน (Factory Reset)</span>
                  </span>
                  <span className="text-[11px] text-rose-700 block mt-0.5">
                    รีเซ็ตกระเป๋าทั้งหมดกลับเป็น 5 หมวดหมู่ตั้งต้น (Squirrel, Rhino, Cat, Bee, Shark)
                  </span>
                </div>
                <span className="text-xs font-semibold text-rose-800 bg-rose-200/80 px-2 py-1 rounded-lg group-hover:bg-rose-300">
                  รีเซ็ตทั้งหมด
                </span>
              </button>
            </div>

            {/* Backup & Restore Action Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  onExport();
                  setShowStorageModal(false);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>สำรองข้อมูล (Backup JSON)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>กู้คืนข้อมูล (Restore JSON)</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
