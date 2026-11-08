# Mạch — Design System

Tài liệu mô tả nền tảng giao diện của Mạch — phần mềm quản lý tài chính kết nối với ngân hàng doanh nghiệp đang dùng (Mạch không phải ngân hàng). Nội dung gồm nguyên tắc, token, typography, thành phần dùng chung và quy ước dữ liệu. Mọi trang trong ứng dụng đều dựng từ các khối này.

## 1. Nguyên tắc

1. **Thoáng và tĩnh.**
   - Nền sáng ấm (`canvas #fbfbf9`), thẻ trắng viền 1px rất mảnh, bo góc 16px, đổ bóng gần như không có.
   - Màu thương hiệu chỉ dùng cho hành động chính và trạng thái được chọn.
2. **Số liệu là nhân vật chính.**
   - Mọi con số dùng chữ số đều cột (`num`).
   - Ký hiệu `₫` nhỏ và nhạt hơn phần số để mắt đọc giá trị trước.
   - Tiền vào tô xanh, tiền ra giữ màu chữ thường: không tô đỏ cả bảng.
3. **Chuẩn Việt Nam.**
   - Định dạng `vi-VN`: `1.284.560.000 ₫`, `08/11/2026`, `8 thg 11`.
   - Tiếng Việt có dấu đầy đủ. Nội dung chuyển khoản tự bỏ dấu.
   - Số tiền đọc thành chữ trên uỷ nhiệm chi và hoá đơn (`readVND`).
   - Sổ sách theo Thông tư 200/2014/TT-BTC.
4. **Một việc, một luồng.**
   - Tác vụ nhiều bước (lệnh chi, tạo hoá đơn, yêu cầu thẻ, thiết lập doanh nghiệp) dùng `FlowShell` toàn màn hình. Bố cục gồm các bước bên trái, nội dung ở giữa và bản xem trước trực tiếp bên phải.
   - Tác vụ ngắn dùng `Modal`. Xem chi tiết dùng `Drawer`.
5. **Sáng / tối từ một nguồn.**
   - Mọi màu đi qua biến CSS. Lớp `.dark` trên `<html>` đổi toàn bộ bảng màu.
   - Không viết cứng màu xám/trắng trong thành phần.

## 2. Token màu (`frontend/src/styles/index.css`)

| Nhóm | Token Tailwind | Sáng | Tối | Dùng cho |
|---|---|---|---|---|
| Bề mặt | `bg-canvas` | `#fbfbf9` | `#0c0e0d` | Nền trang |
| | `bg-side` | `#f5f5f1` | `#101312` | Thanh bên |
| | `bg-surface` | `#ffffff` | `#141817` | Thẻ, hộp thoại |
| | `bg-subtle` / `bg-hover` / `bg-press` | `#f3f3ef` → `#e4e4dd` | `#1a1f1d` → `#283030` | Nền phụ, hover, nhấn |
| Viền | `border-line` / `border-line-strong` | `#e8e8e2` / `#d6d6ce` | `#232927` / `#323a37` | Viền thẻ / viền ô nhập |
| Chữ | `text-fg` / `dim` / `muted` / `faint` | `#15181a` → `#9a9fa3` | `#edf0ee` → `#5e6764` | 4 cấp nhấn mạnh |
| Thương hiệu | `brand-50 … brand-700` | Xanh ngọc, `brand-500 = #138f66` | Sáng hơn để đủ tương phản | Nút chính, focus, trạng thái bật |
| Nhấn | `gold` / `gold-soft` | `#d99a2b` | `#e8b04e` | Lãi suất, điểm nhấn phụ |
| Ngữ nghĩa | `pos` `neg` `warn` `info` (+ `-soft`) | | | Tiền vào, lỗi/quá hạn, chờ duyệt, thông tin |
| Biểu đồ | `chart-1 … chart-6` | | | Chuỗi dữ liệu nhiều màu |

**Đổ bóng:** `shadow-xs` cho thẻ, `shadow-sm` khi hover, `shadow-md` cho popover, `shadow-lg` cho hộp thoại và ngăn kéo.

**Bo góc:**
- Thẻ: 16px.
- Ô nhập và nút: 10px.
- Nút "viên thuốc" trên thanh hành động nhanh: tròn hẳn.

## 3. Typography

- **Font:**
  - **Inter Variable** cho toàn bộ giao diện. Font hỗ trợ đầy đủ tiếng Việt và hai biến thể `cv11`, `ss01` cho chữ số rõ ràng.
  - **JetBrains Mono** cho mã giao dịch, phím tắt và nội dung chuyển khoản.
- **Tiêu đề:** dùng độ đậm 500, không đậm hơn, để giữ cảm giác nhẹ.

| Utility | Kích thước | Dùng cho |
|---|---|---|
| `ds-display` | clamp(2.5–4.6rem) / 500 | Tiêu đề trang giới thiệu |
| `ds-h1` | 28px / 500 | Tiêu đề trang |
| `ds-h2` | 19px / 550 | Tiêu đề mục, hộp thoại |
| `ds-h3` | 15.5px / 600 | Tiêu đề thẻ |
| `ds-amount` | 30px / 500, chữ số đều cột | Số dư lớn |
| `ds-label` | 11.5px / IN HOA | Nhãn nhóm |
| `ds-caption` | 12.5px / `muted` | Chú thích |

## 4. Thành phần dùng chung (`frontend/src/components`)

**`ui/` — khối giao diện cơ bản**

- **Nút:**
  - `Button`: biến thể `primary`, `secondary`, `outline`, `ghost`, `danger`, `danger-soft`, `link`, `inverse`; cỡ `xs` → `lg`; hỗ trợ `icon`, `iconRight`, `pill`, `loading`, `to`.
  - `IconButton`: luôn có `label` cho trình đọc màn hình.
- **Nhập liệu:**
  - Ô nhập: `Input` (có prefix/suffix), `Textarea`, `Select`, `SearchInput`.
  - Nhập tiền: `MoneyInput` tự chèn dấu chấm; chế độ `big` dùng cho màn hình nhập số tiền.
  - Lựa chọn: `Checkbox` (có trạng thái chọn một phần), `Toggle`, `RadioCards`.
  - Khác: `FileDrop` (kéo thả chứng từ), `OtpInput`.
- **Hiển thị:**
  - Khung và tiêu đề: `Card`, `CardHeader`, `PageHeader`.
  - Tiền và chỉ số: `Money` (tôn trọng chế độ "Ẩn số dư"), `Stat`, `Progress` (tự đổi sang cảnh báo khi ≥75% và lỗi khi ≥90%).
  - Nhãn và người: `Badge`, `StatusBadge`, `Avatar`, `AvatarStack`.
  - Điều hướng trong trang: `Segmented`, `Tabs`.
  - Thông tin: `KeyValue`, `Callout`, `EmptyState`, `Skeleton`, `Tooltip`, `Kbd`.
- **Lớp phủ:**
  - Gồm `Modal`, `Confirm`, `Drawer`, `Popover` + `Menu`, `FlowShell`.
  - Tất cả khoá cuộn trang, đóng bằng `Esc` theo thứ tự lớp và trả lại focus.
  - `Popover` dùng portal nên không bị cắt trong bảng cuộn.
- **Bảng:** `Table`, `THead`, `Th` (có sắp xếp), `Tr`, `Td`. Thêm `fixed` khi cần cột co giãn và cắt chữ.
- **Nghiệp vụ:**
  - `TxAvatar`, `CategoryTag`, `AccountIcon`, `FlowArrow`.
  - `PaymentCard`: hình thẻ doanh nghiệp (mang tên ngân hàng phát hành) với 4 kiểu màu, trạng thái tạm khoá và huỷ.
  - `QrCode`: VietQR minh hoạ.

**`charts/`** — biểu đồ SVG tự viết, không dùng thư viện ngoài:

- `AreaChart`: số dư theo thời gian, có đường dọc và tooltip.
- `CashflowChart`: cột tiền vào/ra kèm đường dòng tiền ròng, chọn được từng tháng.
- `Donut`, `Sparkline`, `BarList`.

**`layout/`** — khung ứng dụng:

- `AppLayout`: bảo vệ đăng nhập, phím tắt toàn cục.
- `Sidebar`: điều hướng, mục đã ghim, đổi giao diện.
- Thanh trên cùng: tìm kiếm, chuyển tiền, ẩn số dư, thông báo.
- `CommandPalette`: `Ctrl K`, tìm trang, giao dịch, người nhận, hoá đơn và chạy hành động.
- `Assistant`: trợ lý AI trả lời bằng số liệu thật từ dữ liệu demo, mở bằng `Ctrl J`.

**`features/`** — luồng nghiệp vụ dùng chung giữa nhiều trang:

- `move-money/MoveMoney`: lệnh chi qua ngân hàng đã kết nối, chuyển nội bộ, nhận tiền (VietQR), yêu cầu thanh toán. Có xác thực OTP và bản xem trước uỷ nhiệm chi.
- `transactions/TxList`, `transactions/TxDrawer`: danh sách gọn và ngăn chi tiết giao dịch (đổi danh mục, ghi chú, đính kèm chứng từ).

## 5. Quy ước dữ liệu

- **Nguồn dữ liệu:**
  - Dữ liệu mô phỏng nằm trong `frontend/src/data`.
  - Giao dịch được sinh có hạt giống (`seeded`), nên lần nào tải cũng giống nhau.
- **Mốc thời gian:**
  - "Hôm nay" của bản demo cố định là **08/11/2026** (`TODAY`).
  - Biểu đồ và trạng thái "quá hạn" luôn nhất quán theo mốc này.
- **Kho trạng thái:**
  - `useBank` (Zustand) lưu thao tác của người xem vào `localStorage`. Ví dụ: khoá thẻ, duyệt hoá đơn, chuyển tiền.
  - Nút **Cài đặt → Giao diện → Khôi phục dữ liệu demo** đưa mọi thứ về ban đầu.
- **Trạng thái và màu:** bảng tra (`BILL_STATUS`, `INVOICE_STATUS`, `CARD_STATUS`, `REIMB_STATUS`) quy định nhãn tiếng Việt và tông màu cho `StatusBadge`.

## 6. Khả năng truy cập

- Mọi ô nhập có nhãn. Mọi nút chỉ có biểu tượng đều có `aria-label`.
- Bàn phím:
  - Điều khiển bằng `Tab`, `Enter`, `Esc` và mũi tên trong bảng lệnh.
  - Viền focus 2px màu thương hiệu, chỉ hiện khi dùng bàn phím (`:focus-visible`).
- Chuyển động:
  - Mọi hiệu ứng ngắn, dưới 300ms.
  - Hiệu ứng tắt hẳn khi người dùng bật "Giảm chuyển động".
- Tương phản chữ `muted` trên nền đạt mức AA ở cả hai giao diện.
