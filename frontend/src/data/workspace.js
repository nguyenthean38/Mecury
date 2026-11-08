/* ==========================================================
   Dữ liệu mô phỏng — việc cần làm, thông báo, cài đặt
   ========================================================== */

/** Việc cần làm — `to` là đường dẫn mở khi bấm */
export const TASKS = [
  { id: 't1', kind: 'approve', title: 'Duyệt 3 khoản hoàn ứng', desc: 'Gia Khang, Thu Hà và Ngọc Lan đang chờ hoàn tiền, tổng 3.964.000 ₫.', to: '/hoan-ung', due: '2026-11-10', priority: 'high' },
  { id: 't2', kind: 'approve', title: 'Duyệt hoá đơn Nội thất Gỗ Mộc An', desc: '46.800.000 ₫ · đến hạn 12/11. Ngọc Lan gửi yêu cầu.', to: '/thanh-toan', due: '2026-11-12', priority: 'high' },
  { id: 't3', kind: 'categorize', title: 'Phân loại 9 giao dịch thẻ', desc: 'Giao dịch chưa có danh mục sẽ không vào được báo cáo chi phí.', to: '/giao-dich?loc=chua-phan-loai', due: null, priority: 'medium' },
  { id: 't4', kind: 'receipt', title: 'Bổ sung hoá đơn VAT', desc: 'Một số giao dịch trên 200.000 ₫ chưa có chứng từ đính kèm.', to: '/giao-dich?loc=thieu-chung-tu', due: '2026-11-30', priority: 'medium' },
  { id: 't5', kind: 'overdue', title: 'Nhắc Nha khoa Nụ Cười thanh toán', desc: 'Hoá đơn SV-2026-0146 đã quá hạn 1 ngày.', to: '/hoa-don', due: '2026-11-07', priority: 'high' },
  { id: 't6', kind: 'security', title: 'Bật xác thực hai lớp cho Hoàng Mai Chi', desc: 'Thành viên mới cần bật 2FA trước khi được cấp thẻ.', to: '/cai-dat/thanh-vien', due: null, priority: 'low' },
]

export const DONE_TASKS = [
  { id: 'd1', title: 'Kết nối tài khoản Ngân hàng Thịnh An', doneAt: '2026-10-30' },
  { id: 'd2', title: 'Kết nối phần mềm kế toán MISA', doneAt: '2026-10-22' },
  { id: 'd3', title: 'Thiết lập quy tắc trích thuế 10%', doneAt: '2026-10-02' },
]

export const NOTIFICATIONS = [
  { id: 'n1', kind: 'money_in', title: 'Nhận 96.000.000 ₫ từ CTCP Tre Việt Xanh', time: '2026-11-08T08:42:00', read: false, to: '/giao-dich' },
  { id: 'n2', kind: 'approval', title: 'Ngọc Lan gửi yêu cầu duyệt hoá đơn 46.800.000 ₫', time: '2026-11-07T16:10:00', read: false, to: '/thanh-toan' },
  { id: 'n3', kind: 'invoice', title: 'Nha khoa Nụ Cười chưa thanh toán hoá đơn SV-2026-0146', time: '2026-11-07T09:00:00', read: false, to: '/hoa-don' },
  { id: 'n4', kind: 'card', title: 'Thẻ ••3856 đã dùng 59% hạn mức tháng', time: '2026-11-06T11:25:00', read: true, to: '/the' },
  { id: 'n5', kind: 'member', title: 'Hoàng Mai Chi đã chấp nhận lời mời', time: '2026-11-05T14:02:00', read: true, to: '/cai-dat/thanh-vien' },
  { id: 'n6', kind: 'rule', title: 'Quy tắc "Trích thuế tự động" đã chạy 4 lần tuần này', time: '2026-11-04T17:05:00', read: true, to: '/tai-khoan' },
]

export const INTEGRATIONS = [
  { id: 'misa', name: 'MISA AMIS Kế toán', group: 'Kế toán', desc: 'Đồng bộ giao dịch, chứng từ và hoá đơn hai chiều.', connected: true, color: '#1a73e8' },
  { id: 'fast', name: 'Fast Accounting', group: 'Kế toán', desc: 'Xuất bút toán theo chuẩn Thông tư 200.', connected: false, color: '#e8710a' },
  { id: 'einvoice', name: 'Hoá đơn điện tử VNPT', group: 'Hoá đơn', desc: 'Phát hành hoá đơn GTGT có mã của cơ quan thuế.', connected: true, color: '#0057a8' },
  { id: 'zalo', name: 'Zalo OA', group: 'Thông báo', desc: 'Gửi hoá đơn và nhắc thanh toán qua Zalo cho khách.', connected: false, color: '#0068ff' },
  { id: 'slack', name: 'Slack', group: 'Thông báo', desc: 'Nhận thông báo duyệt chi và tiền vào trong kênh nhóm.', connected: true, color: '#611f69' },
  { id: 'sheets', name: 'Google Sheets', group: 'Dữ liệu', desc: 'Tự động xuất giao dịch mỗi ngày vào bảng tính.', connected: false, color: '#0f9d58' },
  { id: 'haravan', name: 'Haravan', group: 'Bán hàng', desc: 'Đối soát đơn hàng với tiền về tài khoản.', connected: false, color: '#2a62ff' },
  { id: 'payroll', name: 'Base Payroll', group: 'Nhân sự', desc: 'Chi lương tự động từ Quỹ lương theo bảng lương.', connected: false, color: '#ff6a00' },
]

export const APPROVAL_RULES = [
  { id: 'ap1', scope: 'Chuyển khoản', condition: 'Trên 50.000.000 ₫', approvers: ['u1'], count: 1, active: true },
  { id: 'ap2', scope: 'Chuyển khoản', condition: 'Trên 500.000.000 ₫', approvers: ['u1', 'u2'], count: 2, active: true },
  { id: 'ap3', scope: 'Hoá đơn phải trả', condition: 'Mọi hoá đơn', approvers: ['u1', 'u2'], count: 1, active: true },
  { id: 'ap4', scope: 'Hoàn ứng', condition: 'Trên 2.000.000 ₫', approvers: ['u2'], count: 1, active: false },
]

export const SESSIONS = [
  { id: 's1', device: 'Chrome trên Windows', place: 'TP. Hồ Chí Minh', ip: '113.161.xx.xx', last: '2026-11-08T09:30:00', current: true },
  { id: 's2', device: 'Ứng dụng Mạch trên iPhone 15', place: 'TP. Hồ Chí Minh', ip: '27.72.xx.xx', last: '2026-11-07T21:14:00' },
  { id: 's3', device: 'Safari trên macOS', place: 'Đà Nẵng', ip: '14.232.xx.xx', last: '2026-10-29T10:02:00' },
]

export const PLANS = [
  { id: 'free', name: 'Khởi đầu', price: 0, tag: 'Cho hộ kinh doanh, công ty mới', features: ['Kết nối 2 tài khoản ngân hàng', 'Tạo lệnh chi, duyệt 1 cấp', 'Quản lý 5 thẻ doanh nghiệp', 'Xuất hoá đơn cơ bản', 'Báo cáo dòng tiền'] },
  { id: 'growth', name: 'Tăng trưởng', price: 490000, tag: 'Phổ biến nhất cho đội 10 – 50 người', features: ['Kết nối không giới hạn ngân hàng', 'Quản lý thẻ doanh nghiệp không giới hạn', 'Ngân sách nhóm, hoàn ứng', 'Duyệt chi nhiều cấp', 'Đồng bộ MISA, hoá đơn điện tử', 'Trợ lý AI phân loại chi phí'] },
  { id: 'scale', name: 'Doanh nghiệp', price: 1990000, tag: 'Cho công ty nhiều chi nhánh', features: ['Mọi tính năng gói Tăng trưởng', 'Sổ sách kế toán theo Thông tư 200', 'Phân quyền tuỳ chỉnh, API', 'Quản lý nhiều pháp nhân', 'Chuyên viên hỗ trợ riêng'] },
]
