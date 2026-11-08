/* ==========================================================
   Dữ liệu mô phỏng — xuất hoá đơn: khách hàng, danh mục, hoá đơn
   ========================================================== */

export const CUSTOMERS = [
  { id: 'k1', name: 'Công ty TNHH Hạt Mầm', contact: 'Ngô Bảo Trâm', email: 'tram.ngo@hatmam.vn', taxCode: '0315 221 480', address: '18 Trần Quang Khải, Phường Tân Định, TP. Hồ Chí Minh', color: '#6d8f3a', since: '2023-02-12' },
  { id: 'k2', name: 'CTCP Thời Trang Mây', contact: 'Phan Quỳnh Như', email: 'nhu.phan@thoitrangmay.vn', taxCode: '0316 009 852', address: '211 Đồng Khởi, Phường Sài Gòn, TP. Hồ Chí Minh', color: '#7a6fd6', since: '2024-05-08' },
  { id: 'k3', name: 'Nhà hàng Bếp Nhà Lá', contact: 'Trương Văn Lộc', email: 'loc@bepnhala.vn', taxCode: '0314 887 006', address: '7 Phạm Ngọc Thạch, Phường Xuân Hoà, TP. Hồ Chí Minh', color: '#3f8f8a', since: '2024-09-19' },
  { id: 'k4', name: 'Gốm Sứ Bát Tràng An', contact: 'Đỗ Thị Hằng', email: 'hang@gombattrangan.vn', taxCode: '0108 552 917', address: 'Thôn 3, Xã Bát Tràng, Hà Nội', color: '#4f7fe0', since: '2025-01-06' },
  { id: 'k5', name: 'Lụa Hà Đông Xưa', contact: 'Vũ Thanh Tâm', email: 'tam@luahadongxua.vn', taxCode: '0109 336 214', address: '45 Vạn Phúc, Phường Hà Đông, Hà Nội', color: '#c2588a', since: '2025-06-23' },
  { id: 'k6', name: 'CTCP Tre Việt Xanh', contact: 'Lý Minh Đăng', email: 'dang.ly@treviet.vn', taxCode: '0317 445 003', address: 'KCN Tân Thuận, Phường Tân Thuận, TP. Hồ Chí Minh', color: '#138f66', since: '2025-11-02' },
  { id: 'k7', name: 'Nha khoa Nụ Cười Sài Gòn', contact: 'BS. Hồ Gia Bảo', email: 'giabao@nucuoisaigon.vn', taxCode: '0315 902 667', address: '120 Nguyễn Trãi, Phường Bến Thành, TP. Hồ Chí Minh', color: '#59a7b8', since: '2026-03-14' },
]

/** Danh mục sản phẩm / dịch vụ bán ra */
export const CATALOG = [
  { id: 'i1', name: 'Thiết kế website doanh nghiệp', unit: 'Gói', price: 48000000, vat: 8, desc: 'Tối đa 12 trang, tối ưu điện thoại, trang quản trị tiếng Việt.' },
  { id: 'i2', name: 'Website bán hàng', unit: 'Gói', price: 85000000, vat: 8, desc: 'Giỏ hàng, thanh toán VietQR, quản lý đơn và kho.' },
  { id: 'i3', name: 'Ứng dụng di động iOS & Android', unit: 'Gói', price: 240000000, vat: 8, desc: 'Thiết kế, lập trình, đưa lên kho ứng dụng.' },
  { id: 'i4', name: 'Bảo trì & vận hành', unit: 'Tháng', price: 6500000, vat: 8, desc: 'Sao lưu, cập nhật bảo mật, hỗ trợ trong giờ hành chính.' },
  { id: 'i5', name: 'Chatbot AI chăm sóc khách hàng', unit: 'Gói', price: 36000000, vat: 8, desc: 'Huấn luyện trên dữ liệu doanh nghiệp, tích hợp Zalo và Messenger.' },
  { id: 'i6', name: 'Thiết kế nhận diện thương hiệu', unit: 'Gói', price: 28000000, vat: 8, desc: 'Logo, bảng màu, bộ ấn phẩm văn phòng.' },
  { id: 'i7', name: 'Giờ tư vấn kỹ thuật', unit: 'Giờ', price: 1200000, vat: 8, desc: 'Tư vấn kiến trúc, chọn công nghệ, đánh giá mã nguồn.' },
]

/**
 * status: draft | scheduled | sent | viewed | partial | paid | overdue | void
 * items: [{ catalog, name, qty, price, vat }]
 */
export const INVOICES = [
  { id: 'iv1', number: 'SV-2026-0148', customer: 'k6', issued: '2026-11-06', due: '2026-11-20', status: 'sent', items: [{ catalog: 'i3', name: 'Ứng dụng di động iOS & Android — giai đoạn 1 (40%)', qty: 1, price: 96000000, vat: 8 }], memo: 'Thanh toán giai đoạn 1 theo hợp đồng 12/2026/HĐ-SV.', paid: 0, viewedAt: null },
  { id: 'iv2', number: 'SV-2026-0147', customer: 'k2', issued: '2026-11-02', due: '2026-11-16', status: 'viewed', items: [{ catalog: 'i2', name: 'Website bán hàng', qty: 1, price: 85000000, vat: 8 }, { catalog: 'i4', name: 'Bảo trì & vận hành', qty: 3, price: 6500000, vat: 8 }], memo: '', paid: 0, viewedAt: '2026-11-03T10:14:00' },
  { id: 'iv3', number: 'SV-2026-0146', customer: 'k7', issued: '2026-10-28', due: '2026-11-07', status: 'overdue', items: [{ catalog: 'i5', name: 'Chatbot AI chăm sóc khách hàng', qty: 1, price: 36000000, vat: 8 }], memo: '', paid: 0, viewedAt: '2026-10-29T08:41:00' },
  { id: 'iv4', number: 'SV-2026-0145', customer: 'k1', issued: '2026-10-20', due: '2026-11-03', status: 'partial', items: [{ catalog: 'i1', name: 'Thiết kế website doanh nghiệp', qty: 1, price: 48000000, vat: 8 }, { catalog: 'i6', name: 'Thiết kế nhận diện thương hiệu', qty: 1, price: 28000000, vat: 8 }], memo: '', paid: 40000000, viewedAt: '2026-10-20T15:02:00' },
  { id: 'iv5', number: 'SV-2026-0144', customer: 'k4', issued: '2026-10-15', due: '2026-10-29', status: 'paid', items: [{ catalog: 'i2', name: 'Website bán hàng', qty: 1, price: 85000000, vat: 8 }], memo: '', paid: 91800000, paidAt: '2026-10-27' },
  { id: 'iv6', number: 'SV-2026-0143', customer: 'k3', issued: '2026-10-08', due: '2026-10-22', status: 'paid', items: [{ catalog: 'i4', name: 'Bảo trì & vận hành', qty: 6, price: 6500000, vat: 8 }], memo: 'Gói bảo trì 6 tháng cuối năm.', paid: 42120000, paidAt: '2026-10-21' },
  { id: 'iv7', number: 'SV-2026-0142', customer: 'k5', issued: '2026-09-30', due: '2026-10-14', status: 'paid', items: [{ catalog: 'i1', name: 'Thiết kế website doanh nghiệp', qty: 1, price: 48000000, vat: 8 }, { catalog: 'i7', name: 'Giờ tư vấn kỹ thuật', qty: 10, price: 1200000, vat: 8 }], memo: '', paid: 64800000, paidAt: '2026-10-11' },
  { id: 'iv8', number: 'SV-2026-0149', customer: 'k1', issued: '2026-11-08', due: '2026-11-22', status: 'draft', items: [{ catalog: 'i4', name: 'Bảo trì & vận hành', qty: 1, price: 6500000, vat: 8 }], memo: '', paid: 0 },
  { id: 'iv9', number: 'SV-2026-0150', customer: 'k3', issued: '2026-12-01', due: '2026-12-15', status: 'scheduled', items: [{ catalog: 'i7', name: 'Giờ tư vấn kỹ thuật', qty: 8, price: 1200000, vat: 8 }], memo: 'Tư vấn mở rộng hệ thống đặt bàn.', paid: 0, recurring: 'Hằng tháng' },
]

export const INVOICE_STATUS = {
  draft: { label: 'Nháp', tone: 'neutral' },
  scheduled: { label: 'Hẹn gửi', tone: 'info' },
  sent: { label: 'Đã gửi', tone: 'info' },
  viewed: { label: 'Khách đã xem', tone: 'info' },
  partial: { label: 'Trả một phần', tone: 'warn' },
  paid: { label: 'Đã thanh toán', tone: 'pos' },
  overdue: { label: 'Quá hạn', tone: 'neg' },
  void: { label: 'Đã huỷ', tone: 'neutral' },
}

export function invoiceTotals(inv) {
  const subtotal = inv.items.reduce((s, i) => s + i.qty * i.price, 0)
  const vat = inv.items.reduce((s, i) => s + Math.round(i.qty * i.price * (i.vat || 0) / 100), 0)
  const total = subtotal + vat
  return { subtotal, vat, total, due: Math.max(0, total - (inv.paid || 0)) }
}
