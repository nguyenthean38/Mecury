/* ==========================================================
   Dữ liệu mô phỏng — thẻ, ngân sách nhóm, hoàn ứng
   ========================================================== */

/** type: virtual | physical · status: active | frozen | cancelled */
export const CARDS = [
  { id: 'c1', last4: '4421', nickname: 'Thẻ của Minh Anh', member: 'u1', type: 'physical', status: 'active', limit: 100000000, period: 'Tháng', spent: 38450000, account: 'acc-main', expiry: '09/29', style: 'jade', budget: null, created: '2025-03-02' },
  { id: 'c2', last4: '3856', nickname: 'Quảng cáo & thiết kế', member: 'u3', type: 'virtual', status: 'active', limit: 120000000, period: 'Tháng', spent: 71200000, account: 'acc-main', expiry: '04/28', style: 'ink', budget: 'b1', created: '2025-06-11' },
  { id: 'c3', last4: '6962', nickname: 'Phần mềm & hạ tầng', member: 'u4', type: 'virtual', status: 'active', limit: 40000000, period: 'Tháng', spent: 21340000, account: 'acc-main', expiry: '11/28', style: 'sky', budget: 'b2', created: '2025-01-20' },
  { id: 'c4', last4: '1190', nickname: 'Vận hành văn phòng', member: 'u5', type: 'physical', status: 'active', limit: 20000000, period: 'Tháng', spent: 6820000, account: 'acc-main', expiry: '02/30', style: 'sand', budget: 'b4', created: '2025-08-03' },
  { id: 'c5', last4: '7314', nickname: 'Công tác & tiếp khách', member: 'u6', type: 'physical', status: 'active', limit: 50000000, period: 'Tháng', spent: 18960000, account: 'acc-main', expiry: '07/29', style: 'jade', budget: 'b3', created: '2025-09-14' },
  { id: 'c6', last4: '5508', nickname: 'Thuê bao một lần', member: 'u4', type: 'virtual', status: 'frozen', limit: 5000000, period: 'Mỗi giao dịch', spent: 0, account: 'acc-main', expiry: '12/26', style: 'ink', budget: null, created: '2026-09-02' },
  { id: 'c7', last4: '2087', nickname: 'Sự kiện ra mắt Q3', member: 'u3', type: 'virtual', status: 'cancelled', limit: 60000000, period: 'Trọn đời', spent: 57300000, account: 'acc-main', expiry: '10/26', style: 'sky', budget: 'b1', created: '2026-06-20' },
]

export const CARD_STATUS = {
  active: { label: 'Đang hoạt động', tone: 'pos' },
  frozen: { label: 'Tạm khoá', tone: 'info' },
  cancelled: { label: 'Đã huỷ', tone: 'neutral' },
}

/** Nhóm ngành hàng có thể chặn trên thẻ */
export const MERCHANT_GROUPS = ['Phần mềm', 'Quảng cáo', 'Đi lại', 'Khách sạn', 'Nhà hàng', 'Thiết bị điện tử', 'Văn phòng phẩm', 'Giải trí', 'Cờ bạc', 'Rút tiền mặt']

/** Ngân sách chi tiêu nhóm */
export const BUDGETS = [
  { id: 'b1', name: 'Marketing quý 4', icon: 'Megaphone', color: '#c2588a', limit: 180000000, period: 'Quý', spent: 112400000, members: ['u3', 'u1'], owner: 'u3', desc: 'Quảng cáo Meta, Google, TikTok và in ấn cho chiến dịch cuối năm.', receiptRequired: true, status: 'active', created: '2026-10-01' },
  { id: 'b2', name: 'Phần mềm & công cụ', icon: 'Cloud', color: '#4f7fe0', limit: 45000000, period: 'Tháng', spent: 21340000, members: ['u4', 'u2'], owner: 'u4', desc: 'Thuê bao SaaS, máy chủ, tên miền.', receiptRequired: true, status: 'active', created: '2025-01-20' },
  { id: 'b3', name: 'Công tác phí', icon: 'Plane', color: '#59a7b8', limit: 60000000, period: 'Tháng', spent: 18960000, members: ['u6', 'u1', 'u5'], owner: 'u6', desc: 'Vé máy bay, khách sạn, đi lại khi gặp khách hàng.', receiptRequired: false, status: 'active', created: '2025-09-14' },
  { id: 'b4', name: 'Vận hành văn phòng', icon: 'Coffee', color: '#d99a2b', limit: 20000000, period: 'Tháng', spent: 6820000, members: ['u5'], owner: 'u5', desc: 'Đồ dùng pantry, văn phòng phẩm, sửa chữa nhỏ.', receiptRequired: false, status: 'active', created: '2025-08-03' },
  { id: 'b5', name: 'Tiệc tất niên 2026', icon: 'PartyPopper', color: '#7a6fd6', limit: 85000000, period: 'Trọn đời', spent: 0, members: ['u5', 'u1'], owner: 'u5', desc: 'Đặt nhà hàng, quà tặng, trang trí.', receiptRequired: true, status: 'draft', created: '2026-11-06' },
]

/** Mẫu gợi ý khi tạo ngân sách */
export const BUDGET_TEMPLATES = [
  { name: 'Công tác phí', icon: 'Plane', desc: 'Vé máy bay, khách sạn, đi lại' },
  { name: 'Tiếp khách', icon: 'UtensilsCrossed', desc: 'Nhà hàng, quà tặng đối tác' },
  { name: 'Đào tạo', icon: 'GraduationCap', desc: 'Khoá học, sách, hội thảo' },
  { name: 'Văn phòng', icon: 'Lamp', desc: 'Đồ dùng, thiết bị nhỏ' },
  { name: 'Phần mềm', icon: 'Cloud', desc: 'Thuê bao, công cụ làm việc' },
]

/** Hoàn ứng: nhân viên tự chi rồi xin công ty trả lại */
export const REIMBURSEMENTS = [
  { id: 'rb1', member: 'u6', merchant: 'Taxi Mai Linh', amount: 386000, date: '2026-11-06', category: 'travel', note: 'Đi gặp khách Tre Việt Xanh ở Thủ Đức', status: 'pending', receipt: 'bien-lai-taxi.jpg', submitted: '2026-11-06' },
  { id: 'rb2', member: 'u3', merchant: 'In ấn Kỹ Thuật Số Sài Gòn', amount: 2450000, date: '2026-11-04', category: 'marketing', note: 'In standee và tờ rơi cho sự kiện', status: 'pending', receipt: 'hoa-don-in-an.pdf', submitted: '2026-11-05' },
  { id: 'rb3', member: 'u5', merchant: 'Siêu thị Co.opmart', amount: 1128000, date: '2026-11-03', category: 'office', note: 'Mua trà, cà phê, bánh cho pantry', status: 'pending', receipt: 'coopmart.jpg', submitted: '2026-11-03' },
  { id: 'rb4', member: 'u4', merchant: 'Udemy', amount: 349000, date: '2026-10-29', category: 'office', note: 'Khoá học Kubernetes', status: 'approved', receipt: 'udemy.pdf', submitted: '2026-10-30', approver: 'u1' },
  { id: 'rb5', member: 'u6', merchant: 'Khách sạn Biển Xanh Nha Trang', amount: 2980000, date: '2026-10-21', category: 'travel', note: 'Công tác Nha Trang 2 đêm', status: 'paid', receipt: 'khach-san.pdf', submitted: '2026-10-23', approver: 'u1', paidAt: '2026-10-25' },
  { id: 'rb6', member: 'u3', merchant: 'Grab', amount: 214000, date: '2026-10-18', category: 'travel', note: '', status: 'rejected', receipt: null, submitted: '2026-10-19', approver: 'u2', reason: 'Thiếu biên lai, vui lòng tải lên và nộp lại.' },
  { id: 'rb7', member: 'u1', merchant: 'Nhà sách Phương Nam', amount: 865000, date: '2026-10-12', category: 'office', note: 'Sách quản trị cho thư viện công ty', status: 'paid', receipt: 'phuong-nam.jpg', submitted: '2026-10-12', approver: 'u2', paidAt: '2026-10-15' },
]

export const REIMB_STATUS = {
  pending: { label: 'Chờ duyệt', tone: 'warn' },
  approved: { label: 'Đã duyệt', tone: 'info' },
  paid: { label: 'Đã hoàn tiền', tone: 'pos' },
  rejected: { label: 'Từ chối', tone: 'neg' },
}
