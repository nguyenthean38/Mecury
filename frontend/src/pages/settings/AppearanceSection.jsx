/* Giao diện — /cai-dat/giao-dien */
import { useState } from 'react'
import { Sun, Moon, Monitor, RotateCcw, Rows3, Rows4 } from 'lucide-react'
import { useBank, useUI, toast } from '@/store'
import { Button, Card, CardHeader, Confirm, Money, RadioCards, Segmented, Toggle } from '@/components/ui'
import { SectionHeader, SettingRow } from './shared'

const DENSITY_KEY = 'mach-density'
const readDensity = () => { try { return localStorage.getItem(DENSITY_KEY) || 'comfortable' } catch { return 'comfortable' } }

export function AppearanceSection() {
  const { theme, setTheme, hideBalances, toggleHide } = useUI()
  const [density, setDensity] = useState(readDensity)
  const [reset, setReset] = useState(false)

  const changeDensity = (v) => {
    setDensity(v)
    try { localStorage.setItem(DENSITY_KEY, v) } catch { /* bỏ qua khi trình duyệt chặn lưu trữ */ }
    toast(v === 'compact' ? 'Đã chuyển sang hiển thị gọn' : 'Đã chuyển sang hiển thị thoáng')
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Giao diện" desc="Tuỳ chỉnh cách Mạch hiển thị trên thiết bị này." />

      <Card>
        <CardHeader title="Chủ đề" desc="Chế độ tối dễ chịu hơn khi làm việc buổi tối." />
        <RadioCards columns={3} value={theme} onChange={(v) => { setTheme(v); toast(v === 'dark' ? 'Đã bật chế độ tối' : v === 'light' ? 'Đã bật chế độ sáng' : 'Giao diện sẽ theo cài đặt hệ thống') }}
          options={[
            { value: 'light', label: 'Sáng', desc: 'Nền sáng, chữ đậm', icon: Sun },
            { value: 'dark', label: 'Tối', desc: 'Nền tối, đỡ mỏi mắt', icon: Moon },
            { value: 'system', label: 'Theo hệ thống', desc: 'Tự đổi theo thiết bị', icon: Monitor },
          ]} />
      </Card>

      <Card>
        <CardHeader title="Hiển thị" />
        <SettingRow title="Ẩn số dư mặc định" desc={<>Che mọi số tiền bằng ••••••, hữu ích khi trình chiếu hoặc làm việc nơi công cộng. Ví dụ: <Money value={1284560000} className="font-[550] text-dim" /></>}>
          <Toggle checked={hideBalances} onChange={() => { toggleHide(); toast(hideBalances ? 'Đã hiện số dư' : 'Đã ẩn số dư') }} />
        </SettingRow>
        <SettingRow title="Mật độ hiển thị" desc="Chế độ gọn hiển thị nhiều dòng hơn trong bảng giao dịch và hoá đơn.">
          <Segmented size="sm" value={density} onChange={changeDensity} options={[{ value: 'comfortable', label: 'Thoáng', icon: Rows3 }, { value: 'compact', label: 'Gọn', icon: Rows4 }]} />
        </SettingRow>
        <SettingRow title="Định dạng số tiền" desc="Theo chuẩn Việt Nam: dấu chấm phân cách hàng nghìn, ký hiệu ₫ phía sau.">
          <span className="num text-[13.5px] font-[550] rounded-lg bg-subtle px-2.5 py-1">1.284.560.000 ₫</span>
        </SettingRow>
      </Card>

      <Card>
        <CardHeader title="Dữ liệu demo" desc="Bản demo lưu mọi thao tác của bạn (khoá thẻ, duyệt chi, tạo hoá đơn…) trên trình duyệt này." />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line p-4">
          <div className="min-w-0">
            <div className="text-[14px] font-[550]">Khôi phục dữ liệu demo</div>
            <div className="ds-caption mt-0.5">Đưa tài khoản, giao dịch, thẻ, hoá đơn và thành viên về trạng thái ban đầu.</div>
          </div>
          <Button variant="danger-soft" icon={RotateCcw} onClick={() => setReset(true)}>Khôi phục</Button>
        </div>
      </Card>

      <Confirm open={reset} onClose={() => setReset(false)} danger confirmLabel="Khôi phục dữ liệu"
        title="Khôi phục dữ liệu demo?" desc="Mọi thay đổi bạn đã thực hiện trong bản demo sẽ bị xoá. Cài đặt giao diện vẫn được giữ."
        onConfirm={() => { useBank.getState().resetDemo(); toast({ title: 'Đã khôi phục dữ liệu demo', desc: 'Mọi số liệu đã về trạng thái ban đầu.', tone: 'pos' }) }} />
    </div>
  )
}
