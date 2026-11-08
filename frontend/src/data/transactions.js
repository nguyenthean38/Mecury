/* ==========================================================
   Dữ liệu mô phỏng — giao dịch
   Sinh tự động, có hạt giống cố định nên lần nào tải cũng giống nhau.
   Khoảng thời gian: 01/05/2026 → 08/11/2026.
   ========================================================== */
import { seeded } from '@/lib/random'
import { TODAY } from '@/lib/format'

/** Danh mục chi tiêu / thu nhập */
export const CATEGORIES = {
  revenue: { label: 'Doanh thu', icon: 'TrendingUp', color: 'var(--c-pos)' },
  software: { label: 'Phần mềm & SaaS', icon: 'Cloud', color: 'var(--c-chart-3)' },
  marketing: { label: 'Quảng cáo & Marketing', icon: 'Megaphone', color: 'var(--c-chart-4)' },
  travel: { label: 'Đi lại & Công tác', icon: 'Plane', color: 'var(--c-chart-6)' },
  meals: { label: 'Ăn uống & Tiếp khách', icon: 'Coffee', color: 'var(--c-chart-2)' },
  office: { label: 'Văn phòng & Thiết bị', icon: 'Monitor', color: 'var(--c-chart-5)' },
  rent: { label: 'Thuê văn phòng', icon: 'Building2', color: '#8a7f6d' },
  payroll: { label: 'Lương & Phúc lợi', icon: 'Users', color: 'var(--c-chart-1)' },
  tax: { label: 'Thuế & Phí nhà nước', icon: 'Landmark', color: '#b0624b' },
  utilities: { label: 'Điện nước & Viễn thông', icon: 'Zap', color: '#6d8f3a' },
  contractor: { label: 'Thuê ngoài', icon: 'Handshake', color: '#3f8f8a' },
  transfer: { label: 'Chuyển nội bộ', icon: 'ArrowLeftRight', color: 'var(--c-faint)' },
  interest: { label: 'Lãi tiền gửi', icon: 'PiggyBank', color: 'var(--c-gold)' },
  fees: { label: 'Phí ngân hàng', icon: 'Receipt', color: 'var(--c-muted)' },
}
export const categoryList = Object.entries(CATEGORIES).map(([id, c]) => ({ id, ...c }))

/** Đối tác / nhà cung cấp. Tên thương hiệu chỉ dùng làm dữ liệu minh hoạ. */
export const MERCHANTS = {
  gws: { name: 'Google Workspace', cat: 'software', color: '#4f7fe0' },
  aws: { name: 'Amazon Web Services', cat: 'software', color: '#d99a2b' },
  figma: { name: 'Figma', cat: 'software', color: '#a259ff' },
  github: { name: 'GitHub', cat: 'software', color: '#24292f' },
  notion: { name: 'Notion', cat: 'software', color: '#37352f' },
  slack: { name: 'Slack', cat: 'software', color: '#611f69' },
  canva: { name: 'Canva', cat: 'software', color: '#00b5c8' },
  adobe: { name: 'Adobe Creative Cloud', cat: 'software', color: '#e0343a' },
  vngcloud: { name: 'VNG Cloud', cat: 'software', color: '#ef7d22' },
  meta: { name: 'Meta Ads', cat: 'marketing', color: '#1877f2' },
  gads: { name: 'Google Ads', cat: 'marketing', color: '#34a853' },
  tiktok: { name: 'TikTok Ads', cat: 'marketing', color: '#111111' },
  grab: { name: 'Grab', cat: 'travel', color: '#00b14f' },
  be: { name: 'Be Group', cat: 'travel', color: '#f5b400' },
  vna: { name: 'Vietnam Airlines', cat: 'travel', color: '#006885' },
  vietjet: { name: 'Vietjet Air', cat: 'travel', color: '#e3262f' },
  hotel: { name: 'Khách sạn Sông Hàn', cat: 'travel', color: '#8a6d3b' },
  highlands: { name: 'Highlands Coffee', cat: 'meals', color: '#b3282d' },
  tch: { name: 'The Coffee House', cat: 'meals', color: '#f37021' },
  pizza: { name: "Pizza 4P's", cat: 'meals', color: '#3a3a3a' },
  quanngon: { name: 'Nhà hàng Quán Bụi', cat: 'meals', color: '#7a5230' },
  tgdd: { name: 'Thế Giới Di Động', cat: 'office', color: '#f8cf00' },
  fahasa: { name: 'Nhà sách Fahasa', cat: 'office', color: '#c8102e' },
  bhx: { name: 'Bách Hoá Xanh', cat: 'office', color: '#0f9246' },
  rent: { name: 'Toà nhà Hoa Sen', cat: 'rent', color: '#8a7f6d' },
  viettel: { name: 'Viettel Telecom', cat: 'utilities', color: '#ee0033' },
  evn: { name: 'Điện lực TP.HCM', cat: 'utilities', color: '#0b4ea2' },
  fpt: { name: 'FPT Telecom', cat: 'utilities', color: '#f37021' },
  payroll: { name: 'Bảng lương nhân sự', cat: 'payroll', color: '#138f66' },
  bhxh: { name: 'Bảo hiểm xã hội TP.HCM', cat: 'payroll', color: '#1c5fa8' },
  tax: { name: 'Kho bạc Nhà nước', cat: 'tax', color: '#b0624b' },
  freelancer: { name: 'Trần Minh Khôi (cộng tác viên)', cat: 'contractor', color: '#3f8f8a' },
  studio: { name: 'Studio Ảnh Hoa Cau', cat: 'contractor', color: '#c2588a' },
  // khách hàng trả tiền
  c_hatmam: { name: 'Công ty TNHH Hạt Mầm', cat: 'revenue', color: '#6d8f3a' },
  c_may: { name: 'CTCP Thời Trang Mây', cat: 'revenue', color: '#7a6fd6' },
  c_nhala: { name: 'Nhà hàng Bếp Nhà Lá', cat: 'revenue', color: '#3f8f8a' },
  c_gom: { name: 'Gốm Sứ Bát Tràng An', cat: 'revenue', color: '#4f7fe0' },
  c_lua: { name: 'Lụa Hà Đông Xưa', cat: 'revenue', color: '#c2588a' },
  c_bamboo: { name: 'CTCP Tre Việt Xanh', cat: 'revenue', color: '#138f66' },
  c_nhakhoa: { name: 'Nha khoa Nụ Cười Sài Gòn', cat: 'revenue', color: '#59a7b8' },
  // nội bộ
  internal: { name: 'Chuyển nội bộ', cat: 'transfer', color: '#9a9fa3' },
  interest: { name: 'Lãi tiền gửi Quỹ dự phòng', cat: 'interest', color: '#d99a2b' },
}

export const CARD_HOLDERS = {
  '4421': 'u1', // Minh Anh
  '3856': 'u3', // Thu Hà — marketing
  '6962': 'u4', // Đức Huy — phần mềm
  '1190': 'u5', // Ngọc Lan — vận hành
  '7314': 'u6', // Gia Khang — kinh doanh
}

function build() {
  const r = seeded(20261108)
  const out = []
  let n = 0
  const push = (t) => out.push({ id: 'tx' + String(++n).padStart(4, '0'), status: 'posted', receipt: false, note: '', ...t })
  const at = (d, h, m) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x.toISOString() }

  const start = new Date(2026, 4, 1)
  for (let d = new Date(start); d <= TODAY; d.setDate(d.getDate() + 1)) {
    const day = d.getDate(), dow = d.getDay(), weekday = dow !== 0 && dow !== 6
    const month = d.getMonth() + 1
    const card = (merchant, amount, last4, extra = {}) => push({
      date: at(d, r.int(8, 21), r.int(0, 59)), merchant, amount: -amount, account: 'acc-main',
      method: 'card', card: last4, member: CARD_HOLDERS[last4], category: MERCHANTS[merchant].cat,
      receipt: r.chance(0.72), ...extra,
    })

    // ---- Tiền vào: khách hàng thanh toán (trích 10% sang tài khoản thuế) ----
    const income = (c, amt, h = r.int(9, 16)) => {
      push({ date: at(d, h, r.int(0, 59)), merchant: c, amount: amt, account: 'acc-main', method: 'transfer_in', category: 'revenue', receipt: true, ref: 'SV-HD-' + r.int(1000, 1299) })
      const tax = Math.round(amt * 0.1 / 1000) * 1000
      push({ date: at(d, 17, 5), merchant: 'internal', counterparty: 'Đến Dành nộp thuế ••7127', amount: -tax, account: 'acc-main', method: 'internal', category: 'transfer', to: 'acc-tax', rule: 'r2' })
      push({ date: at(d, 17, 5), merchant: 'internal', counterparty: 'Từ Thanh toán chính ••2502', amount: tax, account: 'acc-tax', method: 'internal', category: 'transfer', from: 'acc-main', rule: 'r2' })
    }
    // hợp đồng duy trì hằng tháng với khách hàng thân thiết
    if (day === 10) income('c_bamboo', 178200000)
    if (day === 14) income('c_may', 129600000)
    if (day === 22) income('c_hatmam', r.round(84e6 + r.next() * 24e6, 100000))
    // dự án lẻ
    if (weekday && r.chance(0.16)) {
      const c = r.pick(['c_hatmam', 'c_may', 'c_nhala', 'c_gom', 'c_lua', 'c_bamboo', 'c_nhakhoa'])
      income(c, r.round(r.pick([18, 24, 36, 48, 65, 82, 120, 165, 240]) * 1e6 * (0.9 + r.next() * 0.25), 50000))
    }

    // ---- Chi phí cố định hằng tháng ----
    if (day === 5) push({ date: at(d, 9, 0), merchant: 'rent', amount: -64000000, account: 'acc-main', method: 'transfer_out', category: 'rent', receipt: true, ref: 'Tiền thuê T' + month })
    if (day === 3) card('gws', 3640000, '6962')
    if (day === 4) card('aws', r.round(9e6 + r.next() * 6e6, 1000), '6962')
    if (day === 7) card('figma', 1820000, '6962')
    if (day === 8) card('github', 1140000, '6962')
    if (day === 9) card('slack', 2150000, '6962')
    if (day === 11) card('notion', 960000, '6962')
    if (day === 12) card('adobe', 1490000, '3856')
    if (day === 14) card('canva', 640000, '3856')
    if (day === 15) push({ date: at(d, 10, 0), merchant: 'vngcloud', amount: -r.round(4.2e6 + r.next() * 1.5e6, 1000), account: 'acc-main', method: 'direct_debit', category: 'software', receipt: true })
    if (day === 18) push({ date: at(d, 8, 0), merchant: 'viettel', amount: -1286000, account: 'acc-main', method: 'direct_debit', category: 'utilities', receipt: true })
    if (day === 20) push({ date: at(d, 8, 0), merchant: 'evn', amount: -r.round(4.1e6 + r.next() * 1.6e6, 1000), account: 'acc-main', method: 'direct_debit', category: 'utilities', receipt: true })
    if (day === 21) push({ date: at(d, 8, 0), merchant: 'fpt', amount: -880000, account: 'acc-main', method: 'direct_debit', category: 'utilities', receipt: true })
    if (day === 25) push({ date: at(d, 9, 30), merchant: 'payroll', counterparty: 'Lương tháng ' + month + ' — 14 nhân sự', amount: -r.round(262e6 + r.next() * 12e6, 100000), account: 'acc-payroll', method: 'transfer_out', category: 'payroll', receipt: true })
    if (day === 24) {
      push({ date: at(d, 15, 0), merchant: 'internal', counterparty: 'Đến Quỹ lương ••8823', amount: -280000000, account: 'acc-main', method: 'internal', category: 'transfer', to: 'acc-payroll' })
      push({ date: at(d, 15, 0), merchant: 'internal', counterparty: 'Từ Thanh toán chính ••2502', amount: 280000000, account: 'acc-payroll', method: 'internal', category: 'transfer', from: 'acc-main' })
    }
    if (day === 28) push({ date: at(d, 10, 0), merchant: 'bhxh', counterparty: 'BHXH, BHYT, BHTN tháng ' + month, amount: -r.round(56e6 + r.next() * 4e6, 1000), account: 'acc-main', method: 'transfer_out', category: 'payroll', receipt: true })
    if (day === 20) push({ date: at(d, 11, 0), merchant: 'tax', counterparty: 'Kho bạc Nhà nước — Thuế TNCN tháng ' + (month - 1 || 12), amount: -r.round(11e6 + r.next() * 3e6, 1000), account: 'acc-tax', method: 'transfer_out', category: 'tax', receipt: true })
    if (day === 30 && [7, 10].includes(month)) push({ date: at(d, 11, 0), merchant: 'tax', counterparty: 'Kho bạc Nhà nước — Thuế GTGT quý ' + (month === 7 ? 2 : 3), amount: -(month === 7 ? 81400000 : 86250000), account: 'acc-tax', method: 'transfer_out', category: 'tax', receipt: true })
    if (day === 1) push({ date: at(d, 0, 5), merchant: 'interest', amount: r.round(13.1e6 + r.next() * 0.6e6, 1000), account: 'acc-reserve', method: 'interest', category: 'interest', receipt: true })
    if (day === 2 && month % 2 === 0) {
      push({ date: at(d, 14, 0), merchant: 'internal', counterparty: 'Đến Quỹ dự phòng ••5679', amount: -150000000, account: 'acc-main', method: 'internal', category: 'transfer', to: 'acc-reserve', rule: 'r1' })
      push({ date: at(d, 14, 0), merchant: 'internal', counterparty: 'Từ Thanh toán chính ••2502', amount: 150000000, account: 'acc-reserve', method: 'internal', category: 'transfer', from: 'acc-main', rule: 'r1' })
    }

    // ---- Quảng cáo ----
    if (weekday && r.chance(0.13)) card(r.pick(['meta', 'gads', 'meta', 'tiktok']), r.round(r.pick([4, 6, 8, 12, 15, 20]) * 1e6 * (0.9 + r.next() * 0.3), 1000), '3856')

    // ---- Đi lại, ăn uống ----
    if (weekday && r.chance(0.55)) card(r.pick(['grab', 'grab', 'be']), r.round(45000 + r.next() * 380000, 1000), r.pick(['4421', '7314', '1190', '7314']))
    if (weekday && r.chance(0.32)) card(r.pick(['highlands', 'tch', 'highlands']), r.round(55000 + r.next() * 420000, 1000), r.pick(['4421', '7314', '1190']))
    if (weekday && r.chance(0.07)) card(r.pick(['pizza', 'quanngon']), r.round(1.2e6 + r.next() * 3.4e6, 1000), r.pick(['4421', '7314']))
    if (r.chance(0.035)) {
      card(r.pick(['vna', 'vietjet']), r.round(2.1e6 + r.next() * 4.2e6, 1000), r.pick(['7314', '4421']))
      card('hotel', r.round(1.6e6 + r.next() * 2.4e6, 1000), r.pick(['7314', '4421']))
    }

    // ---- Văn phòng ----
    if (weekday && r.chance(0.05)) card('fahasa', r.round(280000 + r.next() * 950000, 1000), '1190')
    if (dow === 1 && r.chance(0.6)) card('bhx', r.round(420000 + r.next() * 1.1e6, 1000), '1190')
    if (r.chance(0.012)) card('tgdd', r.round(8e6 + r.next() * 27e6, 100000), '4421')

    // ---- Thuê ngoài ----
    if (day === 16 && r.chance(0.7)) push({ date: at(d, 15, 30), merchant: r.pick(['freelancer', 'studio']), amount: -r.round(8e6 + r.next() * 18e6, 100000), account: 'acc-main', method: 'transfer_out', category: 'contractor', receipt: r.chance(0.5) })
  }

  // ---- Thẻ tín dụng: vài giao dịch thất bại / đang xử lý gần đây ----
  const recent = out.filter((t) => t.method === 'card').slice(-40)
  recent.slice(-3).forEach((t) => { t.status = 'pending'; t.receipt = false })
  ;[recent[6], recent[15], recent[22]].forEach((t) => t && (t.status = 'failed'))
  // vài giao dịch chưa phân loại để có việc cho "Việc cần làm"
  out.filter((t) => t.method === 'card').slice(-60).filter((_, i) => i % 7 === 3).forEach((t) => (t.category = null))
  // ghi chú mẫu
  const withNote = out.filter((t) => t.merchant === 'pizza' || t.merchant === 'quanngon')
  withNote.forEach((t, i) => (t.note = ['Tiếp khách Hạt Mầm', 'Liên hoan sinh nhật công ty', 'Ăn trưa cùng đối tác Tre Việt', 'Họp chốt hợp đồng Thời Trang Mây'][i % 4]))

  return out.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export const TRANSACTIONS = build()

export const METHOD_LABEL = {
  card: 'Thẻ',
  transfer_in: 'Nhận chuyển khoản',
  transfer_out: 'Chuyển khoản',
  internal: 'Chuyển nội bộ',
  direct_debit: 'Trích nợ tự động',
  interest: 'Trả lãi',
}

export const STATUS_LABEL = {
  posted: 'Hoàn tất',
  pending: 'Đang xử lý',
  failed: 'Thất bại',
}

export const txName = (t) => t.counterparty || MERCHANTS[t.merchant]?.name || 'Không rõ'
