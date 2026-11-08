/* Hồ sơ công ty — /cai-dat */
import { useState } from 'react'
import { BadgeCheck, Upload, AlertTriangle, Trash2 } from 'lucide-react'
import { COMPANY, ME } from '@/data/org'
import { toast } from '@/store'
import { Avatar, Badge, Button, Card, CardHeader, Callout, Confirm, Input, Select } from '@/components/ui'
import { SectionHeader, pickImage } from './shared'

const TYPES = ['Công ty cổ phần', 'Công ty TNHH một thành viên', 'Công ty TNHH hai thành viên trở lên', 'Doanh nghiệp tư nhân', 'Hộ kinh doanh']
const SIZES = ['1 – 10', '11 – 50', '51 – 200', 'Trên 200']

const initial = () => ({
  name: COMPANY.name, short: COMPANY.short, taxCode: COMPANY.taxCode, type: COMPANY.type, industry: COMPANY.industry,
  employees: COMPANY.employees, founded: COMPANY.founded, email: COMPANY.email, phone: COMPANY.phone, website: COMPANY.website,
  address: COMPANY.address, ward: COMPANY.ward, city: COMPANY.city, rep: ME.name, repTitle: ME.title,
})

export function CompanySection() {
  const [saved, setSaved] = useState(initial)
  const [f, setF] = useState(saved)
  const [logo, setLogo] = useState(null)
  const [closing, setClosing] = useState(false)
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const dirty = JSON.stringify(f) !== JSON.stringify(saved)

  const save = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(f)
      toast({ title: 'Đã lưu hồ sơ công ty', desc: 'Thông tin mới sẽ hiện trên hoá đơn và chứng từ từ bây giờ.', tone: 'pos' })
    }, 500)
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Hồ sơ công ty" desc="Thông tin pháp lý hiển thị trên hoá đơn, uỷ nhiệm chi và báo cáo gửi cơ quan thuế." />

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {logo
            ? <img src={logo} alt="Logo công ty" className="size-16 rounded-2xl object-cover border border-line" />
            : <Avatar name={f.short} color="#138f66" size={64} square />}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="ds-h3">{saved.short}</span>
              <Badge tone="pos" icon={BadgeCheck}>Đã xác minh</Badge>
            </div>
            <p className="ds-caption mt-0.5">Logo xuất hiện trên hoá đơn, link thanh toán và email gửi khách. PNG hoặc SVG, tối thiểu 256 × 256 px.</p>
          </div>
          <div className="flex gap-2">
            {logo && <Button variant="ghost" onClick={() => { setLogo(null); toast('Đã gỡ logo') }}>Gỡ</Button>}
            <Button variant="outline" icon={Upload} onClick={() => pickImage((url) => { setLogo(url); toast({ title: 'Đã tải logo lên', tone: 'pos' }) })}>Tải logo</Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Thông tin pháp lý" desc="Theo Giấy chứng nhận đăng ký doanh nghiệp." />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input className="sm:col-span-2" label="Tên công ty đầy đủ" value={f.name} onChange={set('name')} />
          <Input label="Tên giao dịch" value={f.short} onChange={set('short')} />
          <Input label="Mã số thuế" value={f.taxCode} disabled hint="Liên hệ hỗ trợ nếu cần thay đổi mã số thuế." suffix={<BadgeCheck size={15} className="text-pos" />} />
          <Select label="Loại hình doanh nghiệp" value={f.type} onChange={set('type')} options={TYPES} />
          <Input label="Năm thành lập" value={f.founded} onChange={set('founded')} inputMode="numeric" maxLength={4} />
          <Input label="Ngành nghề chính" value={f.industry} onChange={set('industry')} />
          <Select label="Quy mô nhân sự" value={f.employees} onChange={set('employees')} options={SIZES} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Địa chỉ & liên hệ" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input className="sm:col-span-2" label="Địa chỉ trụ sở" value={f.address} onChange={set('address')} />
          <Input label="Phường / xã" value={f.ward} onChange={set('ward')} />
          <Input label="Tỉnh / thành phố" value={f.city} onChange={set('city')} />
          <Input label="Email kế toán" type="email" value={f.email} onChange={set('email')} hint="Nhận hoá đơn đầu vào và sao kê hằng tháng." />
          <Input label="Số điện thoại" value={f.phone} onChange={set('phone')} />
          <Input label="Website" prefix="https://" value={f.website} onChange={set('website')} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Người đại diện theo pháp luật" desc="Người ký hợp đồng sử dụng dịch vụ Mạch thay mặt công ty." />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Họ và tên" value={f.rep} onChange={set('rep')} />
          <Input label="Chức vụ" value={f.repTitle} onChange={set('repTitle')} />
        </div>
      </Card>

      <div className="flex items-center justify-end gap-2">
        {dirty && <span className="ds-caption mr-auto">Bạn có thay đổi chưa lưu.</span>}
        <Button variant="ghost" disabled={!dirty} onClick={() => setF(saved)}>Huỷ thay đổi</Button>
        <Button variant="primary" disabled={!dirty} loading={saving} onClick={save}>Lưu thay đổi</Button>
      </div>

      <Card className="border-neg/30">
        <CardHeader title="Vùng nguy hiểm" icon={AlertTriangle} desc="Các thao tác dưới đây không thể hoàn tác." />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line p-4">
          <div className="min-w-0">
            <div className="text-[14px] font-[550]">Đóng tài khoản doanh nghiệp</div>
            <div className="ds-caption mt-0.5">Mọi thẻ sẽ bị huỷ, tài khoản ngừng nhận tiền. Số dư còn lại được chuyển về tài khoản bạn chỉ định.</div>
          </div>
          <Button variant="danger-soft" icon={Trash2} onClick={() => setClosing(true)}>Đóng tài khoản</Button>
        </div>
      </Card>

      <Confirm open={closing} onClose={() => setClosing(false)} danger confirmLabel="Gửi yêu cầu đóng"
        title="Đóng tài khoản Sen Việt Digital?"
        desc="Yêu cầu sẽ được chuyển đến chuyên viên hỗ trợ để xác minh trong 1–2 ngày làm việc."
        onConfirm={() => toast({ title: 'Đã gửi yêu cầu đóng tài khoản', desc: 'Chuyên viên sẽ gọi cho bạn để xác nhận trước khi xử lý.' })}>
        <Callout tone="warn" icon={AlertTriangle}>
          Trước khi đóng, hãy thanh toán hết dư nợ thẻ tín dụng và xuất đầy đủ sao kê, chứng từ cho kế toán.
        </Callout>
      </Confirm>
    </div>
  )
}
