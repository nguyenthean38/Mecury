# Mạch — Bản đồ màn hình

Danh sách đường dẫn, tệp và nội dung chính của từng màn hình. Mọi trang đều nằm trong `frontend/src/pages` và được tải theo nhu cầu (lazy route).

## Công khai

| Đường dẫn | Tệp | Nội dung |
|---|---|---|
| `/` | `public/LandingPage.jsx` | Trang giới thiệu: hero minh hoạ SVG, tính năng, bảo mật, bảng giá, cảm nhận khách hàng, hỏi đáp |
| `/dang-nhap` | `public/LoginPage.jsx` | Đăng nhập, passkey, **Dùng tài khoản demo**. Mở `?demo=1` để vào thẳng |
| `/dang-ky` | `public/SignupPage.jsx` | Tạo tài khoản, thước đo độ mạnh mật khẩu |
| `/quen-mat-khau` | `public/ForgotPasswordPage.jsx` | Gửi link đặt lại mật khẩu |
| `/mo-tai-khoan` | `public/OnboardingPage.jsx` | Thiết lập doanh nghiệp: thông tin công ty, kết nối ngân hàng, kế toán, mời đội ngũ |
| `*` | `public/NotFoundPage.jsx` | Trang 404 |

## Ứng dụng (cần đăng nhập)

| Đường dẫn | Tệp | Nội dung |
|---|---|---|
| `/tong-quan` | `HomePage.jsx` | Lời chào, thanh hành động nhanh tuỳ chỉnh được, số dư + biểu đồ, tài khoản, thẻ tín dụng, phải trả / phải thu, dòng tiền tháng, giao dịch gần đây, việc cần làm, chi tiêu thẻ |
| `/viec-can-lam` | `TasksPage.jsx` | Việc cần xử lý theo mức ưu tiên, đã xong, danh sách hoàn thiện thiết lập |
| `/tai-khoan` | `AccountsPage.jsx` | Tổng số dư các tài khoản ngân hàng đã kết nối, quy tắc tự động, kết nối thêm ngân hàng |
| `/tai-khoan/:id` | `AccountDetailPage.jsx` | Chi tiết tài khoản, VietQR, biểu đồ số dư, giao dịch của tài khoản |
| `/giao-dich` | `TransactionsPage.jsx` | Bảng giao dịch, bộ lọc, chế độ xem đã lưu, thao tác hàng loạt, xuất CSV, khớp chứng từ |
| `/phan-tich` | `InsightsPage.jsx` | Dòng tiền theo tháng, nhận định tự động, chi tiêu theo danh mục, đối tác, thành viên |
| `/the` | `CardsPage.jsx` | Danh sách thẻ, ngăn chi tiết thẻ, luồng tạo thẻ |
| `/chi-tieu-nhom` | `TeamSpendPage.jsx` | Ngân sách nhóm, thành viên, luồng tạo ngân sách |
| `/chi-tieu-nhom/:id` | `BudgetDetailPage.jsx` | Chi tiết ngân sách |
| `/hoan-ung` | `ReimbursementsPage.jsx` | Duyệt / từ chối / hoàn tiền, luồng nộp hoàn ứng |
| `/thanh-toan` | `PaymentsPage.jsx` | Hoá đơn phải trả, duyệt chi, thanh toán / hẹn lịch, tải hoá đơn lên bằng AI |
| `/nguoi-nhan` | `RecipientsPage.jsx` | Danh bạ người nhận, lịch sử thanh toán |
| `/hoa-don` | `InvoicesPage.jsx` | Hoá đơn bán ra, ngăn chi tiết có bản hoá đơn GTGT, luồng tạo hoá đơn có xem trước trực tiếp |
| `/hoa-don/khach-hang` | `CustomersPage.jsx` | Khách hàng và công nợ |
| `/hoa-don/danh-muc` | `CatalogPage.jsx` | Sản phẩm & dịch vụ |
| `/ke-toan` | `AccountingPage.jsx` | Tổng quan sổ sách, kết quả kinh doanh, cân đối kế toán, bút toán, đối soát, hệ thống tài khoản (`?tab=`) |
| `/cai-dat/:section?` | `settings/SettingsPage.jsx` | Có các mục: hồ sơ công ty, `thanh-vien`, `duyet-chi`, `tich-hop`, `goi-dich-vu`, `ho-so`, `bao-mat`, `thong-bao`, `giao-dien` |

## Lớp phủ toàn cục

| Thành phần | Cách mở | Nội dung |
|---|---|---|
| Chuyển tiền | Nút **Chuyển tiền** hoặc `useUI.openMoveMoney(mode)` | `send` (lệnh chi), `transfer` (giữa tài khoản), `deposit` (nhận tiền: thông tin TK + VietQR), `request` (link thanh toán) |
| Bảng lệnh | `Ctrl K` hoặc `/` | Tìm trang, tài khoản, giao dịch, người nhận, hoá đơn; chạy hành động |
| Trợ lý AI | `Ctrl J` hoặc nút góc phải dưới | Hỏi đáp về số dư, dòng tiền, chi tiêu, hoá đơn chưa thu |
| Thông báo | Biểu tượng chuông | Tiền vào, yêu cầu duyệt, hoá đơn quá hạn… |

## Tham số đường dẫn hỗ trợ

| Tham số | Tác dụng |
|---|---|
| `/giao-dich?id=…` | Mở ngăn chi tiết giao dịch |
| `/giao-dich?loc=chua-phan-loai` | Lọc giao dịch chưa phân loại |
| `/giao-dich?loc=thieu-chung-tu` | Lọc giao dịch thiếu chứng từ |
| `/giao-dich?danh-muc=…` | Lọc theo danh mục |
| `/giao-dich?tai-khoan=…` | Lọc theo tài khoản |
| `/the?tao=1` | Mở luồng tạo thẻ |
| `/hoan-ung?nop=1` | Mở luồng nộp hoàn ứng |
| `/thanh-toan?tai-len=1` | Mở luồng tải hoá đơn |
| `/hoa-don?tao=1` | Mở luồng tạo hoá đơn |
| `/hoa-don?id=…` | Mở chi tiết hoá đơn |
| `/nguoi-nhan?id=…` | Mở chi tiết người nhận |
