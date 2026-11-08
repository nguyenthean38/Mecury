/* Thành phần dùng chung cho các mục cài đặt */
import { cn } from '@/lib/cn'

/** Tiêu đề của một mục cài đặt */
export function SectionHeader({ title, desc, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
      <div className="min-w-0">
        <h2 className="ds-h2">{title}</h2>
        {desc && <p className="text-muted text-[13.5px] mt-1 max-w-xl">{desc}</p>}
      </div>
      {action && <div className="flex items-center gap-2 flex-wrap shrink-0">{action}</div>}
    </div>
  )
}

/** Một dòng cài đặt: nhãn/mô tả bên trái, điều khiển bên phải */
export function SettingRow({ title, desc, children, className }) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-line last:border-0', className)}>
      <div className="min-w-0">
        <div className="text-[14px] font-[550] text-fg">{title}</div>
        {desc && <div className="ds-caption mt-0.5 max-w-md">{desc}</div>}
      </div>
      <div className="shrink-0 flex items-center gap-2">{children}</div>
    </div>
  )
}

/** Logo / biểu tượng màu cho dịch vụ bên ngoài */
export function BrandTile({ name, color, size = 40 }) {
  const letters = name.replace(/[^A-Za-zÀ-ỹ0-9 ]/g, '').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return (
    <span className="inline-grid place-items-center rounded-[11px] shrink-0 font-[700] text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.34 }} aria-hidden>
      {letters}
    </span>
  )
}

/** Tải ảnh lên (mô phỏng): trả về object URL để xem trước */
export function pickImage(onPick) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/png,image/jpeg,image/svg+xml'
  input.onchange = () => {
    const f = input.files?.[0]
    if (f) onPick(URL.createObjectURL(f), f)
  }
  input.click()
}

export const MEMBER_COLORS = ['#138f66', '#4f7fe0', '#c2588a', '#d99a2b', '#7a6fd6', '#59a7b8', '#e07a5f', '#6d8f3a']
