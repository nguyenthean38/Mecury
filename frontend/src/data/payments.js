/* ==========================================================
   Dữ liệu mô phỏng — người nhận, hoá đơn phải trả (thanh toán)
   ========================================================== */

export const BANKS = ['Vietcombank', 'Techcombank', 'MB Bank', 'ACB', 'VPBank', 'BIDV', 'VietinBank', 'Sacombank', 'TPBank', 'Ngân hàng Thịnh An', 'Ngân hàng Lạc Hồng']

/** Người nhận (nhà cung cấp, đối tác, cá nhân) */
export const RECIPIENTS = [
  { id: 'p1', name: 'Toà nhà Hoa Sen', type: 'business', taxCode: '0312 554 890', email: 'thuvien@hoasentower.vn', bank: 'Vietcombank', account: '0071 0004 5521 8', holder: 'CONG TY TNHH TOA NHA HOA SEN', lastPaid: '2026-11-05', total: 384000000, color: '#8a7f6d' },
  { id: 'p2', name: 'Studio Ảnh Hoa Cau', type: 'business', taxCode: '0316 120 774', email: 'hello@hoacau.studio', bank: 'Techcombank', account: '1903 5521 7780 12', holder: 'STUDIO ANH HOA CAU', lastPaid: '2026-10-16', total: 74600000, color: '#c2588a' },
  { id: 'p3', name: 'Trần Minh Khôi', type: 'person', email: 'khoi.tran.dev@gmail.com', bank: 'MB Bank', account: '0901 888 234', holder: 'TRAN MINH KHOI', lastPaid: '2026-09-16', total: 52000000, color: '#3f8f8a' },
  { id: 'p4', name: 'CTCP In Ấn Bao Bì Phương Nam', type: 'business', taxCode: '0301 448 115', email: 'ketoan@inphuongnam.vn', bank: 'ACB', account: '2148 6609 1', holder: 'CTCP IN AN BAO BI PHUONG NAM', lastPaid: '2026-08-11', total: 38900000, color: '#d99a2b' },
  { id: 'p5', name: 'Công ty Luật Minh Bạch', type: 'business', taxCode: '0315 007 362', email: 'contact@luatminhbach.vn', bank: 'VPBank', account: '1188 2290 66', holder: 'CONG TY LUAT TNHH MINH BACH', lastPaid: '2026-07-02', total: 45000000, color: '#4f7fe0' },
  { id: 'p6', name: 'Nội thất Gỗ Mộc An', type: 'business', taxCode: '0314 772 109', email: 'sales@gomocan.vn', bank: 'BIDV', account: '3141 0000 8821 5', holder: 'CONG TY TNHH NOI THAT GO MOC AN', lastPaid: null, total: 0, color: '#7a5230' },
  { id: 'p7', name: 'Lê Thu Hà', type: 'person', email: 'ha.le@senviet.vn', bank: 'Techcombank', account: '1903 4412 0098 31', holder: 'LE THU HA', lastPaid: '2026-10-25', total: 2450000, color: '#c2588a', employee: true },
]

/**
 * Hoá đơn phải trả — status:
 * draft (nháp, vừa tải lên) | review (chờ duyệt) | scheduled (đã lên lịch) | paid (đã trả) | overdue (quá hạn)
 */
export const BILLS = [
  { id: 'bl1', recipient: 'p6', number: 'MA-2026-1182', amount: 46800000, issued: '2026-10-28', due: '2026-11-12', status: 'review', category: 'office', note: 'Bàn họp và 6 ghế cho phòng họp mới', file: 'hoa-don-go-moc-an.pdf', requestedBy: 'u5', vat: 8 },
  { id: 'bl2', recipient: 'p2', number: 'HC-0931', amount: 18500000, issued: '2026-11-01', due: '2026-11-15', status: 'draft', category: 'contractor', note: 'Chụp ảnh sản phẩm cho Lụa Hà Đông Xưa', file: 'hoacau-0931.pdf', requestedBy: 'u3', vat: 10 },
  { id: 'bl3', recipient: 'p1', number: 'HS-T12-2026', amount: 64000000, issued: '2026-11-01', due: '2026-12-05', status: 'scheduled', category: 'rent', note: 'Tiền thuê văn phòng tháng 12', file: 'hoasen-t12.pdf', scheduledFor: '2026-12-04', fromAccount: 'acc-main', recurring: 'Hằng tháng', vat: 10 },
  { id: 'bl4', recipient: 'p4', number: 'PN-55210', amount: 12650000, issued: '2026-10-10', due: '2026-11-04', status: 'overdue', category: 'marketing', note: 'In 2.000 hộp quà tết cho khách hàng', file: 'phuongnam-55210.pdf', requestedBy: 'u3', vat: 8 },
  { id: 'bl5', recipient: 'p5', number: 'LMB-2026-077', amount: 15000000, issued: '2026-11-03', due: '2026-11-20', status: 'review', category: 'contractor', note: 'Tư vấn hợp đồng khung với Tre Việt Xanh', file: 'luat-minh-bach.pdf', requestedBy: 'u1', vat: 10 },
  { id: 'bl6', recipient: 'p1', number: 'HS-T11-2026', amount: 64000000, issued: '2026-10-01', due: '2026-11-05', status: 'paid', category: 'rent', note: 'Tiền thuê văn phòng tháng 11', file: 'hoasen-t11.pdf', paidAt: '2026-11-05', fromAccount: 'acc-main', vat: 10 },
  { id: 'bl7', recipient: 'p3', number: 'KHOI-10', amount: 16000000, issued: '2026-10-14', due: '2026-10-16', status: 'paid', category: 'contractor', note: 'Phát triển tính năng thanh toán VietQR', file: null, paidAt: '2026-10-16', fromAccount: 'acc-main', vat: 0 },
]

export const BILL_STATUS = {
  draft: { label: 'Cần bổ sung', tone: 'neutral' },
  review: { label: 'Chờ duyệt', tone: 'warn' },
  scheduled: { label: 'Đã lên lịch', tone: 'info' },
  paid: { label: 'Đã thanh toán', tone: 'pos' },
  overdue: { label: 'Quá hạn', tone: 'neg' },
}

/** Phương thức chuyển tiền */
export const PAY_METHODS = [
  { id: 'napas', label: 'Chuyển nhanh 24/7', desc: 'Đến ngay trong vài giây · tối đa 500 triệu/lần', fee: 0 },
  { id: 'interbank', label: 'Chuyển thường liên ngân hàng', desc: 'Đến trong ngày làm việc · không giới hạn', fee: 0 },
  { id: 'internal', label: 'Giữa các tài khoản của bạn', desc: 'Tức thì, miễn phí', fee: 0 },
]
