export const CATEGORIES = [
  {
    id: 'squirrel',
    name: 'Squirrel',
    thName: 'ค่าใช้จ่ายประจำวัน & Fix Cost',
    emoji: '🐿️',
    color: '#F59E0B',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-100',
    accentColor: 'from-amber-500 to-amber-600',
    description: 'ค่ากินอยู่ ใช้จ่ายจำเป็น และค่าใช้จ่ายคงที่รายเดือน'
  },
  {
    id: 'rhino',
    name: 'Rhino',
    thName: 'หนี้สิน & ภาระผูกพัน',
    emoji: '🦏',
    color: '#64748B',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    textColor: 'text-slate-700',
    badgeBg: 'bg-slate-200',
    accentColor: 'from-slate-600 to-slate-700',
    description: 'กยศ. และภาระหนี้สินที่ต้องเคลียร์ให้หมด'
  },
  {
    id: 'cat',
    name: 'Cat',
    thName: 'รางวัลชีวิต & กิจกรรม',
    emoji: '🐱',
    color: '#EC4899',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
    badgeBg: 'bg-pink-100',
    accentColor: 'from-pink-500 to-pink-600',
    description: 'เดทกับแฟน ช้อปปิ้ง ท่องเที่ยว และของขวัญให้ตัวเอง'
  },
  {
    id: 'bee',
    name: 'Bee',
    thName: 'ออม & ลงทุนปลอดภัย / ปันผล',
    emoji: '🐝',
    color: '#EAB308',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    badgeBg: 'bg-yellow-100',
    accentColor: 'from-yellow-500 to-yellow-600',
    description: 'พอร์ตลงทุน พอร์ตปันผล ออมทอง อัญมณี และเงินเย็นธุรกิจ'
  },
  {
    id: 'shark',
    name: 'Shark',
    thName: 'ลงทุนเสี่ยงสูง & Trading',
    emoji: '🦈',
    color: '#3B82F6',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeBg: 'bg-blue-100',
    accentColor: 'from-blue-500 to-blue-600',
    description: 'เทรดมือ, Copy Trade, Option, Crypto, บอทเทรด และพอร์ต Risk'
  }
];

export const DEFAULT_POCKETS = [
  // --- SQUIRREL (🐿️) ---
  {
    id: 'p_1life',
    name: '1Life',
    categoryId: 'squirrel',
    description: 'ใช้จ่ายจำเป็น เช่น ค่ากินประจำวันรายปักษ์',
    emoji: '🍱',
    isActive: true,
    rules: {
      round10: { mode: 'percent_remaining', value: 50 }, // 50% ของเงินที่เหลือหลังหัก Fix
      round25: { mode: 'percent_remaining', value: 50 },
      special: { mode: 'percent_remaining', value: 0 }  // เงินพิเศษไม่ลงค่ากิน
    }
  },
  {
    id: 'p_fixcost',
    name: 'Fix Cost',
    categoryId: 'squirrel',
    description: 'ค่าบ้าน, ค่าเน็ต, ค่าน้ำ, ค่าไฟ (3,000/เดือน = 1,500/รอบ)',
    emoji: '🏠',
    isActive: true,
    rules: {
      round10: { mode: 'fixed', value: 1500 }, // Fix 1,500 รอบวันที่ 10
      round25: { mode: 'fixed', value: 1500 }, // Fix 1,500 รอบวันที่ 25
      special: { mode: 'fixed', value: 0 }
    }
  },

  // --- RHINO (🦏) ---
  {
    id: 'p_redwing',
    name: 'Redwing',
    categoryId: 'rhino',
    description: 'กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.)',
    emoji: '🎓',
    isActive: true,
    rules: {
      round10: { mode: 'fixed', value: 0 },
      round25: { mode: 'fixed', value: 300 }, // ทยอยเก็บรอบปลายเดือน
      special: { mode: 'percent_remaining', value: 10 }
    }
  },
  {
    id: 'p_debt',
    name: 'Debt',
    categoryId: 'rhino',
    description: 'จ่ายหนี้สิน / เคลียร์ยอดค้างชำระ',
    emoji: '💳',
    isActive: true,
    rules: {
      round10: { mode: 'fixed', value: 0 },
      round25: { mode: 'fixed', value: 200 },
      special: { mode: 'percent_remaining', value: 10 }
    }
  },

  // --- CAT (🐱) ---
  {
    id: 'p_mybabe',
    name: 'My Babe',
    categoryId: 'cat',
    description: 'ทำกิจกรรมกับแฟน, เลี้ยงข้าว, เดท',
    emoji: '💖',
    isActive: true,
    rules: {
      round10: { mode: 'percent_remaining', value: 10 },
      round25: { mode: 'percent_remaining', value: 10 },
      special: { mode: 'percent_remaining', value: 10 }
    }
  },
  {
    id: 'p_joyfull',
    name: 'Joy Full',
    categoryId: 'cat',
    description: 'ซื้อของที่อยากได้ ชิ้นไม่ใหญ่ Shopping',
    emoji: '🛍️',
    isActive: true,
    rules: {
      round10: { mode: 'percent_remaining', value: 10 },
      round25: { mode: 'percent_remaining', value: 10 },
      special: { mode: 'percent_remaining', value: 10 }
    }
  },

  // --- BEE (🐝) ---
  {
    id: 'p_zero1',
    name: 'Zero 1-5 (พอร์ตลงทุน)',
    categoryId: 'bee',
    description: 'พอร์ตลงทุนหลัก 1-5',
    emoji: '📈',
    isActive: true,
    rules: {
      round10: { mode: 'percent_remaining', value: 6 },
      round25: { mode: 'percent_remaining', value: 6 },
      special: { mode: 'percent_remaining', value: 12 }
    }
  },
  {
    id: 'p_nextgen',
    name: 'Next Gen',
    categoryId: 'bee',
    description: 'ลงทุนหุ้น / สินทรัพย์แห่งอนาคต',
    emoji: '🚀',
    isActive: true,
    rules: {
      round10: { mode: 'percent_remaining', value: 4 },
      round25: { mode: 'percent_remaining', value: 4 },
      special: { mode: 'percent_remaining', value: 8 }
    }
  },
  {
    id: 'p_divyield',
    name: 'Dividend Yield',
    categoryId: 'bee',
    description: 'หุ้นปันผลต่างประเทศ / กองทุนปันผลสูง',
    emoji: '🌍',
    isActive: true,
    rules: {
      round10: { mode: 'percent_remaining', value: 4 },
      round25: { mode: 'percent_remaining', value: 4 },
      special: { mode: 'percent_remaining', value: 8 }
    }
  },
  {
    id: 'p_thaidividend',
    name: 'Thai Dividend',
    categoryId: 'bee',
    description: 'หุ้นปันผลไทย กระแสเงินสดสม่ำเสมอ',
    emoji: '🇹🇭',
    isActive: true,
    rules: {
      round10: { mode: 'percent_remaining', value: 4 },
      round25: { mode: 'percent_remaining', value: 4 },
      special: { mode: 'percent_remaining', value: 8 }
    }
  },
  {
    id: 'p_coolmoney',
    name: 'Cool Money',
    categoryId: 'bee',
    description: 'เงินเย็น ไว้ช้อนหุ้นตอนวิกฤต หรือทำธุรกิจ (ฟาร์มวัว, ร้านชำ)',
    emoji: '🧊',
    isActive: true,
    rules: {
      round10: { mode: 'percent_remaining', value: 4 },
      round25: { mode: 'percent_remaining', value: 4 },
      special: { mode: 'percent_remaining', value: 10 }
    }
  },
  {
    id: 'p_ruby',
    name: 'Ruby',
    categoryId: 'bee',
    description: 'ซื้ออัญมณี ออมทองออนไลน์ สินทรัพย์จริง (เงินแท่ง ทองแท่ง เพชร)',
    emoji: '💎',
    isActive: true,
    rules: {
      round10: { mode: 'percent_remaining', value: 4 },
      round25: { mode: 'percent_remaining', value: 4 },
      special: { mode: 'percent_remaining', value: 8 }
    }
  },

  // --- SHARK (🦈) ---
  {
    id: 'p_life',
    name: 'Life (เทรดมือ)',
    categoryId: 'shark',
    description: 'เทรดมือ ตามแผนปั้นพอร์ตใจเย็น',
    emoji: '🎯',
    isActive: true,
    rules: {
      round10: { mode: 'percent_remaining', value: 2 },
      round25: { mode: 'percent_remaining', value: 2 },
      special: { mode: 'percent_remaining', value: 5 }
    }
  },
  {
    id: 'p_copytrade',
    name: 'Copy Trade',
    categoryId: 'shark',
    description: 'Copy Trade In XM',
    emoji: '👥',
    isActive: true,
    rules: {
      round10: { mode: 'percent_remaining', value: 1.5 },
      round25: { mode: 'percent_remaining', value: 1.5 },
      special: { mode: 'percent_remaining', value: 5 }
    }
  },
  {
    id: 'p_risk',
    name: 'Risk (OverLot)',
    categoryId: 'shark',
    description: 'เทรดออลอิน OverLot พอร์ตความเสี่ยงสูง',
    emoji: '⚡',
    isActive: true,
    rules: {
      round10: { mode: 'percent_remaining', value: 1.5 },
      round25: { mode: 'percent_remaining', value: 1.5 },
      special: { mode: 'percent_remaining', value: 4 }
    }
  },
  {
    id: 'p_option',
    name: 'Option',
    categoryId: 'shark',
    description: 'เทรดหุ้น Option',
    emoji: '📊',
    isActive: true,
    rules: {
      round10: { mode: 'percent_remaining', value: 1 },
      round25: { mode: 'percent_remaining', value: 1 },
      special: { mode: 'percent_remaining', value: 3 }
    }
  },
  {
    id: 'p_crypto',
    name: 'Crypto',
    categoryId: 'shark',
    description: 'เทรดและซื้อ Spot คริปโต',
    emoji: '🪙',
    isActive: true,
    rules: {
      round10: { mode: 'percent_remaining', value: 1 },
      round25: { mode: 'percent_remaining', value: 1 },
      special: { mode: 'percent_remaining', value: 4 }
    }
  },
  {
    id: 'p_bottrade',
    name: 'Bot Trade',
    categoryId: 'shark',
    description: 'เทรดอัตโนมัติด้วยบอทเทรด',
    emoji: '🤖',
    isActive: true,
    rules: {
      round10: { mode: 'percent_remaining', value: 1 },
      round25: { mode: 'percent_remaining', value: 1 },
      special: { mode: 'percent_remaining', value: 3 }
    }
  }
];

export const ROUND_PRESETS = [
  {
    id: 'round10',
    title: 'รอบวันที่ 10 (ต้นเดือน)',
    shortName: 'รอบ 10',
    defaultAmount: 6000,
    icon: '🗓️',
    description: 'เงินเดือนครึ่งแรก หัก Fix Cost (1,500) และกระจายใช้จ่าย/ลงทุนครึ่งเดือนแรก'
  },
  {
    id: 'round25',
    title: 'รอบวันที่ 25 (ปลายเดือน)',
    shortName: 'รอบ 25',
    defaultAmount: 6000,
    icon: '📅',
    description: 'เงินเดือนครึ่งหลัง หัก Fix Cost (1,500) + กยศ./หนี้ และกระจายใช้จ่าย/ลงทุนครึ่งเดือนหลัง'
  },
  {
    id: 'special',
    title: 'เงินพิเศษ (Special Income)',
    shortName: 'เงินพิเศษ',
    defaultAmount: 5000,
    icon: '✨',
    description: 'โบนัส, กำไรเทรด, งานนอก, เงินปันผล เน้นเข้าพอร์ต Bee, Shark และ Cat'
  }
];
