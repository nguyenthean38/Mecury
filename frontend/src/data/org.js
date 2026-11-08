/* ==========================================================
   Dữ liệu mô phỏng — công ty, thành viên, tài khoản
   Toàn bộ tên công ty, người và số tài khoản đều là hư cấu.
   ========================================================== */

export const COMPANY = {
  name: 'Công ty Cổ phần Sen Việt Digital',
  short: 'Sen Việt Digital',
  taxCode: '0316 842 571',
  type: 'Công ty cổ phần',
  industry: 'Dịch vụ thiết kế & phát triển phần mềm',
  founded: '2021',
  employees: '11 – 50',
  email: 'ketoan@senviet.vn',
  phone: '028 3822 4517',
  website: 'senviet.vn',
  address: 'Tầng 9, Toà nhà Hoa Sen, 52 Nguyễn Thị Minh Khai',
  ward: 'Phường Bến Thành',
  city: 'TP. Hồ Chí Minh',
  plan: 'growth',
  partnerBank: 'Ngân hàng Thịnh An',
}

export const ME = {
  id: 'u1',
  name: 'Nguyễn Minh Anh',
  email: 'minhanh@senviet.vn',
  role: 'Quản trị viên',
  title: 'Giám đốc điều hành',
  phone: '0901 234 567',
  dob: '14/03/1992',
  color: '#138f66',
}

/** role: admin | bookkeeper | employee | custom */
export const TEAM = [
  { id: 'u1', name: 'Nguyễn Minh Anh', email: 'minhanh@senviet.vn', role: 'admin', title: 'Giám đốc điều hành', dept: 'Ban điều hành', status: 'active', joined: '2021-03-02', color: '#138f66' },
  { id: 'u2', name: 'Trần Quốc Bảo', email: 'bao.tran@senviet.vn', role: 'bookkeeper', title: 'Kế toán trưởng', dept: 'Tài chính', status: 'active', joined: '2021-06-14', color: '#4f7fe0' },
  { id: 'u3', name: 'Lê Thu Hà', email: 'ha.le@senviet.vn', role: 'employee', title: 'Trưởng nhóm Marketing', dept: 'Marketing', status: 'active', joined: '2022-01-10', color: '#c2588a' },
  { id: 'u4', name: 'Phạm Đức Huy', email: 'huy.pham@senviet.vn', role: 'custom', title: 'Kỹ sư phần mềm', dept: 'Kỹ thuật', status: 'active', joined: '2022-04-18', color: '#d99a2b' },
  { id: 'u5', name: 'Võ Ngọc Lan', email: 'lan.vo@senviet.vn', role: 'employee', title: 'Chuyên viên vận hành', dept: 'Vận hành', status: 'active', joined: '2023-02-06', color: '#7a6fd6' },
  { id: 'u6', name: 'Đặng Gia Khang', email: 'khang.dang@senviet.vn', role: 'employee', title: 'Quản lý kinh doanh', dept: 'Kinh doanh', status: 'active', joined: '2023-08-21', color: '#59a7b8' },
  { id: 'u7', name: 'Hoàng Mai Chi', email: 'chi.hoang@senviet.vn', role: 'employee', title: 'Nhà thiết kế UI/UX', dept: 'Thiết kế', status: 'invited', joined: '2026-11-05', color: '#e07a5f' },
]

export const ROLES = {
  admin: { label: 'Quản trị viên', desc: 'Toàn quyền: chuyển tiền, quản lý thành viên, cài đặt công ty.' },
  bookkeeper: { label: 'Kế toán', desc: 'Xem mọi giao dịch, xuất báo cáo, phân loại và ghi sổ. Không chuyển tiền.' },
  employee: { label: 'Nhân viên', desc: 'Dùng thẻ được cấp, nộp hoàn ứng, xem giao dịch của chính mình.' },
  custom: { label: 'Tuỳ chỉnh', desc: 'Quyền do quản trị viên chọn riêng cho từng người.' },
}

export const memberById = (id) => TEAM.find((m) => m.id === id)

/**
 * kind: checking (thanh toán) | savings (dự phòng) | tax (thuế) | payroll (lương) | credit (thẻ tín dụng)
 */
export const ACCOUNTS = [
  { id: 'acc-main', kind: 'checking', name: 'Thanh toán chính', last4: '2502', balance: 1284560000, number: '9704 2210 0025 02', bank: 'Ngân hàng Thịnh An', color: '#138f66', primary: true },
  { id: 'acc-reserve', kind: 'savings', name: 'Quỹ dự phòng', last4: '5679', balance: 3500000000, number: '9704 2210 0056 79', bank: 'Ngân hàng Thịnh An', color: '#d99a2b', apy: 4.6 },
  { id: 'acc-tax', kind: 'tax', name: 'Dành nộp thuế', last4: '7127', balance: 412300000, number: '9704 2210 0071 27', bank: 'Ngân hàng Thịnh An', color: '#4f7fe0' },
  { id: 'acc-payroll', kind: 'payroll', name: 'Quỹ lương', last4: '8823', balance: 286400000, number: '9704 2210 0088 23', bank: 'Ngân hàng Lạc Hồng', color: '#7a6fd6' },
]

export const CREDIT = {
  id: 'acc-credit',
  kind: 'credit',
  name: 'Thẻ tín dụng doanh nghiệp',
  limit: 300000000,
  balance: 48230000,
  statementDue: '2026-11-25',
  minDue: 2411500,
  cashback: 1.5,
  cashbackEarned: 3184000,
}

export const ACCOUNT_KIND = {
  checking: 'Tài khoản thanh toán',
  savings: 'Tài khoản tiết kiệm',
  tax: 'Tài khoản chuyên dụng',
  payroll: 'Tài khoản chuyên dụng',
  credit: 'Tín dụng',
}

export const accountById = (id) => ACCOUNTS.find((a) => a.id === id)

/** Quy tắc tự động chuyển tiền giữa các tài khoản */
export const AUTO_RULES = [
  { id: 'r1', type: 'target', title: 'Giữ số dư mục tiêu', desc: 'Khi Thanh toán chính vượt 1,5 tỷ, chuyển phần dư sang Quỹ dự phòng.', from: 'acc-main', to: 'acc-reserve', threshold: 1500000000, freq: 'Hằng ngày', active: true, lastRun: '2026-11-02' },
  { id: 'r2', type: 'percent', title: 'Trích thuế tự động', desc: 'Trích 10% mỗi khoản tiền vào sang tài khoản Dành nộp thuế.', from: 'acc-main', to: 'acc-tax', percent: 10, freq: 'Mỗi khoản tiền vào', active: true, lastRun: '2026-11-07' },
  { id: 'r3', type: 'schedule', title: 'Nạp quỹ lương', desc: 'Chuyển 280 triệu sang Quỹ lương vào ngày 25 hằng tháng.', from: 'acc-main', to: 'acc-payroll', amount: 280000000, freq: 'Ngày 25 hằng tháng', active: false, lastRun: '2026-10-25' },
]
