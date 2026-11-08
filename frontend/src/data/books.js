/* ==========================================================
   Dữ liệu mô phỏng — sổ sách kế toán (theo Thông tư 200/2014/TT-BTC)
   ========================================================== */
import { TRANSACTIONS } from './transactions'

/** Hệ thống tài khoản rút gọn */
export const LEDGER_ACCOUNTS = [
  { code: '111', name: 'Tiền mặt', type: 'Tài sản' },
  { code: '1121', name: 'Tiền gửi ngân hàng — Thanh toán chính', type: 'Tài sản' },
  { code: '1122', name: 'Tiền gửi ngân hàng — Quỹ dự phòng', type: 'Tài sản' },
  { code: '1123', name: 'Tiền gửi ngân hàng — Dành nộp thuế', type: 'Tài sản' },
  { code: '1124', name: 'Tiền gửi ngân hàng — Quỹ lương', type: 'Tài sản' },
  { code: '131', name: 'Phải thu của khách hàng', type: 'Tài sản' },
  { code: '133', name: 'Thuế GTGT được khấu trừ', type: 'Tài sản' },
  { code: '242', name: 'Chi phí trả trước', type: 'Tài sản' },
  { code: '331', name: 'Phải trả cho người bán', type: 'Nợ phải trả' },
  { code: '3331', name: 'Thuế GTGT phải nộp', type: 'Nợ phải trả' },
  { code: '334', name: 'Phải trả người lao động', type: 'Nợ phải trả' },
  { code: '3383', name: 'Bảo hiểm xã hội', type: 'Nợ phải trả' },
  { code: '411', name: 'Vốn góp của chủ sở hữu', type: 'Vốn chủ sở hữu' },
  { code: '421', name: 'Lợi nhuận sau thuế chưa phân phối', type: 'Vốn chủ sở hữu' },
  { code: '511', name: 'Doanh thu bán hàng và cung cấp dịch vụ', type: 'Doanh thu' },
  { code: '515', name: 'Doanh thu hoạt động tài chính', type: 'Doanh thu' },
  { code: '6421', name: 'Chi phí nhân viên quản lý', type: 'Chi phí' },
  { code: '6422', name: 'Chi phí vật liệu, đồ dùng văn phòng', type: 'Chi phí' },
  { code: '6427', name: 'Chi phí dịch vụ mua ngoài', type: 'Chi phí' },
  { code: '6428', name: 'Chi phí bằng tiền khác', type: 'Chi phí' },
  { code: '641', name: 'Chi phí bán hàng (quảng cáo)', type: 'Chi phí' },
]

/** Danh mục giao dịch → tài khoản kế toán */
export const CATEGORY_LEDGER = {
  revenue: '511', interest: '515', payroll: '6421', office: '6422', software: '6427', utilities: '6427', rent: '6427',
  contractor: '6427', marketing: '641', travel: '6428', meals: '6428', tax: '3331', fees: '6428',
}

const MONTHS = [5, 6, 7, 8, 9, 10, 11]

/** Báo cáo kết quả kinh doanh theo tháng, tính từ giao dịch */
export function buildPnL() {
  const rows = {}
  MONTHS.forEach((m) => (rows[m] = { revenue: 0, other: 0, payroll: 0, marketing: 0, software: 0, rent: 0, office: 0, travel: 0, meals: 0, utilities: 0, contractor: 0 }))
  TRANSACTIONS.forEach((t) => {
    if (t.status === 'failed') return
    const m = new Date(t.date).getMonth() + 1
    if (!rows[m]) return
    const c = t.category
    if (c === 'revenue') rows[m].revenue += t.amount / 1.08 // doanh thu chưa gồm VAT 8%
    else if (c === 'interest') rows[m].other += t.amount
    else if (c && rows[m][c] !== undefined) rows[m][c] += -t.amount
  })
  return MONTHS.map((m) => {
    const r = rows[m]
    const opex = r.payroll + r.marketing + r.software + r.rent + r.office + r.travel + r.meals + r.utilities + r.contractor
    const ebt = r.revenue + r.other - opex
    return { month: m, ...r, opex, ebt, cit: Math.max(0, ebt * 0.2), net: ebt - Math.max(0, ebt * 0.2) }
  })
}

/** Bảng cân đối kế toán rút gọn tại cuối các tháng gần đây */
export const BALANCE_SHEET = {
  months: ['31/08', '30/09', '31/10', '08/11'],
  sections: [
    { title: 'Tài sản ngắn hạn', rows: [
      { code: '112', name: 'Tiền gửi ngân hàng', values: [4920000000, 5104000000, 5318000000, 5483260000] },
      { code: '131', name: 'Phải thu của khách hàng', values: [214000000, 186500000, 248300000, 247640000] },
      { code: '133', name: 'Thuế GTGT được khấu trừ', values: [18400000, 21200000, 19800000, 12500000] },
      { code: '242', name: 'Chi phí trả trước', values: [42000000, 38500000, 35000000, 35000000] },
    ] },
    { title: 'Tài sản dài hạn', rows: [
      { code: '211', name: 'Tài sản cố định hữu hình', values: [386000000, 378000000, 370000000, 370000000] },
    ] },
    { title: 'Nợ phải trả', rows: [
      { code: '331', name: 'Phải trả cho người bán', values: [96200000, 71400000, 88600000, 92950000] },
      { code: '3331', name: 'Thuế GTGT phải nộp', values: [64300000, 86250000, 41800000, 52100000] },
      { code: '334', name: 'Phải trả người lao động', values: [0, 0, 0, 0] },
      { code: '341', name: 'Dư nợ thẻ tín dụng', values: [36100000, 52800000, 44900000, 48230000] },
    ] },
    { title: 'Vốn chủ sở hữu', rows: [
      { code: '411', name: 'Vốn góp của chủ sở hữu', values: [3000000000, 3000000000, 3000000000, 3000000000] },
      { code: '421', name: 'Lợi nhuận sau thuế chưa phân phối', values: [2383800000, 2517750000, 2815800000, 2955120000] },
    ] },
  ],
}

/** Bút toán gần đây */
export const JOURNAL = [
  { id: 'j1', date: '2026-11-06', no: 'BT-1108', desc: 'Ghi nhận doanh thu giai đoạn 1 — Tre Việt Xanh', lines: [{ acc: '131', debit: 103680000 }, { acc: '511', credit: 96000000 }, { acc: '3331', credit: 7680000 }], source: 'Hoá đơn SV-2026-0148', status: 'posted' },
  { id: 'j2', date: '2026-11-05', no: 'BT-1107', desc: 'Thanh toán tiền thuê văn phòng tháng 11', lines: [{ acc: '6427', debit: 58181818 }, { acc: '133', debit: 5818182 }, { acc: '1121', credit: 64000000 }], source: 'Giao dịch ngân hàng', status: 'posted' },
  { id: 'j3', date: '2026-11-01', no: 'BT-1106', desc: 'Lãi tiền gửi Quỹ dự phòng tháng 10', lines: [{ acc: '1122', debit: 13420000 }, { acc: '515', credit: 13420000 }], source: 'Giao dịch ngân hàng', status: 'posted' },
  { id: 'j4', date: '2026-10-31', no: 'BT-1105', desc: 'Phân bổ chi phí trả trước — bản quyền phần mềm', lines: [{ acc: '6427', debit: 3500000 }, { acc: '242', credit: 3500000 }], source: 'Bút toán định kỳ', status: 'posted' },
  { id: 'j5', date: '2026-10-31', no: 'BT-1104', desc: 'Khấu hao TSCĐ tháng 10', lines: [{ acc: '6428', debit: 8000000 }, { acc: '214', credit: 8000000 }], source: 'Bút toán định kỳ', status: 'posted' },
  { id: 'j6', date: '2026-11-08', no: 'BT-1109', desc: 'Tạm trích chi phí bảo trì máy chủ tháng 11', lines: [{ acc: '6427', debit: 4800000 }, { acc: '331', credit: 4800000 }], source: 'Nhập tay', status: 'draft' },
]

/** Đối soát ngân hàng theo tháng */
export const RECONCILIATION = [
  { month: 'Tháng 11/2026', account: 'acc-main', status: 'in_progress', matched: 41, total: 48, diff: 0 },
  { month: 'Tháng 10/2026', account: 'acc-main', status: 'done', matched: 96, total: 96, diff: 0 },
  { month: 'Tháng 9/2026', account: 'acc-main', status: 'done', matched: 88, total: 88, diff: 0 },
  { month: 'Tháng 8/2026', account: 'acc-main', status: 'done', matched: 92, total: 92, diff: 0 },
]
