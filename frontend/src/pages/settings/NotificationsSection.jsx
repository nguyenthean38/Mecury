/* Thông báo — /cai-dat/thong-bao */
import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, CreditCard, CheckCircle2, FileWarning, Mail, Smartphone, MessageCircle, Moon } from 'lucide-react'
import { ME } from '@/data/org'
import { toast } from '@/store'
import { Button, Card, CardHeader, Checkbox, MoneyInput, Select, Toggle } from '@/components/ui'
import { SectionHeader, SettingRow } from './shared'

const CHANNELS = [
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'app', label: 'Ứng dụng', icon: Smartphone },
  { key: 'zalo', label: 'Zalo', icon: MessageCircle },
]
const EVENTS = [
  { key: 'money_in', label: 'Tiền vào', desc: 'Mỗi khoản tiền về tài khoản của công ty.', icon: ArrowDownLeft },
  { key: 'big_out', label: 'Tiền ra lớn', desc: 'Khoản chi vượt ngưỡng bạn đặt bên dưới.', icon: ArrowUpRight },
  { key: 'declined', label: 'Thẻ bị từ chối', desc: 'Giao dịch thẻ không thành công vì hạn mức hoặc nghi gian lận.', icon: CreditCard },
  { key: 'approval', label: 'Yêu cầu duyệt', desc: 'Có khoản chi, hoá đơn hoặc hoàn ứng chờ bạn duyệt.', icon: CheckCircle2 },
  { key: 'overdue', label: 'Hoá đơn quá hạn', desc: 'Khách hàng chưa thanh toán khi đến hạn.', icon: FileWarning },
]
const DEFAULTS = {
  money_in: { email: false, app: true, zalo: true },
  big_out: { email: true, app: true, zalo: true },
  declined: { email: true, app: true, zalo: false },
  approval: { email: true, app: true, zalo: false },
  overdue: { email: true, app: false, zalo: false },
}
const initial = () => ({ matrix: DEFAULTS, threshold: 50000000, digest: true, digestDay: 'mon', quiet: true })

export function NotificationsSection() {
  const [saved, setSaved] = useState(initial)
  const [s, setS] = useState(saved)
  const dirty = JSON.stringify(s) !== JSON.stringify(saved)
  const setCell = (ev, ch, v) => setS((x) => ({ ...x, matrix: { ...x.matrix, [ev]: { ...x.matrix[ev], [ch]: v } } }))
  const setCol = (ch, v) => setS((x) => ({ ...x, matrix: Object.fromEntries(Object.entries(x.matrix).map(([k, r]) => [k, { ...r, [ch]: v }])) }))
  const colState = (ch) => {
    const n = EVENTS.filter((e) => s.matrix[e.key][ch]).length
    return { all: n === EVENTS.length, some: n > 0 && n < EVENTS.length }
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Thông báo" desc="Chọn sự kiện bạn muốn biết ngay và kênh nhận phù hợp. Cài đặt này chỉ áp dụng cho riêng bạn." />

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13.5px] border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left font-[550] text-muted text-[12.5px] h-12 pl-5 pr-3">Sự kiện</th>
                {CHANNELS.map((c) => {
                  const st = colState(c.key)
                  const I = c.icon
                  return (
                    <th key={c.key} className="w-[110px] px-3 last:pr-5">
                      <div className="flex flex-col items-center gap-1.5 py-2">
                        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-[550] text-muted"><I size={14} />{c.label}</span>
                        <Checkbox checked={st.all} indeterminate={st.some} onChange={() => setCol(c.key, !st.all)} />
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {EVENTS.map((e) => {
                const I = e.icon
                return (
                  <tr key={e.key} className="border-b border-line last:border-0">
                    <td className="py-3.5 pl-5 pr-3">
                      <div className="flex items-start gap-3">
                        <span className="size-8 shrink-0 grid place-items-center rounded-lg bg-subtle text-dim"><I size={16} /></span>
                        <div className="min-w-0">
                          <div className="font-[550]">{e.label}</div>
                          <div className="ds-caption">{e.desc}</div>
                        </div>
                      </div>
                    </td>
                    {CHANNELS.map((c) => (
                      <td key={c.key} className="text-center px-3 last:pr-5">
                        <label className="inline-flex">
                          <span className="sr-only">{`${e.label} qua ${c.label}`}</span>
                          <Toggle size="sm" checked={s.matrix[e.key][c.key]} onChange={(v) => setCell(e.key, c.key, v)} />
                        </label>
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-line ds-caption">
          Email gửi tới <b className="font-[600] text-dim">{ME.email}</b> · Zalo gửi tới số <b className="font-[600] text-dim">{ME.phone}</b>
        </div>
      </Card>

      <Card>
        <CardHeader title="Ngưỡng & lịch gửi" />
        <SettingRow title="Ngưỡng “Tiền ra lớn”" desc="Báo cho bạn khi một khoản chi bằng hoặc vượt số tiền này.">
          <MoneyInput value={s.threshold} onChange={(threshold) => setS({ ...s, threshold })} className="w-full sm:w-[220px]" />
        </SettingRow>
        <SettingRow title="Bản tóm tắt dòng tiền hằng tuần" desc="Tiền vào, tiền ra, số dư và việc cần làm trong một email.">
          {s.digest && (
            <Select size="sm" aria-label="Ngày gửi tóm tắt" value={s.digestDay} onChange={(e) => setS({ ...s, digestDay: e.target.value })}
              options={[{ value: 'mon', label: 'Sáng thứ Hai' }, { value: 'fri', label: 'Chiều thứ Sáu' }]} className="w-[150px]" />
          )}
          <Toggle checked={s.digest} onChange={(digest) => setS({ ...s, digest })} />
        </SettingRow>
        <SettingRow title={<span className="inline-flex items-center gap-1.5"><Moon size={15} className="text-muted" />Giờ yên tĩnh</span>} desc="Tạm dừng thông báo ứng dụng và Zalo từ 22:00 đến 07:00, trừ cảnh báo bảo mật.">
          <Toggle checked={s.quiet} onChange={(quiet) => setS({ ...s, quiet })} />
        </SettingRow>
      </Card>

      <div className="flex items-center justify-end gap-2">
        {dirty && <span className="ds-caption mr-auto">Bạn có thay đổi chưa lưu.</span>}
        <Button variant="ghost" onClick={() => { setS(initial()); toast('Đã đặt lại mặc định, bấm Lưu để áp dụng') }}>Khôi phục mặc định</Button>
        <Button variant="primary" disabled={!dirty} onClick={() => { setSaved(s); toast({ title: 'Đã lưu cài đặt thông báo', tone: 'pos' }) }}>Lưu thay đổi</Button>
      </div>
    </div>
  )
}
