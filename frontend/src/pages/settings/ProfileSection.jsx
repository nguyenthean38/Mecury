/* Hồ sơ cá nhân — /cai-dat/ho-so */
import { useState } from 'react'
import { Camera, Mail, Phone } from 'lucide-react'
import { ME, ROLES } from '@/data/org'
import { toast } from '@/store'
import { Avatar, Badge, Button, Card, CardHeader, Input, Select } from '@/components/ui'
import { SectionHeader, pickImage } from './shared'

const initial = () => ({
  name: ME.name, preferred: 'Minh Anh', title: ME.title, email: ME.email, phone: ME.phone, dob: ME.dob,
  lang: 'vi', tz: 'Asia/Ho_Chi_Minh', dateFmt: 'dd/mm/yyyy',
})

export function ProfileSection() {
  const [saved, setSaved] = useState(initial)
  const [f, setF] = useState(saved)
  const [photo, setPhoto] = useState(null)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const dirty = JSON.stringify(f) !== JSON.stringify(saved)
  const nameOk = f.name.trim().length >= 2

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Hồ sơ cá nhân" desc="Thông tin này hiển thị với các thành viên khác trong công ty." />

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative w-fit">
            {photo
              ? <img src={photo} alt="Ảnh đại diện" className="size-[72px] rounded-full object-cover" />
              : <Avatar name={f.name} color={ME.color} size={72} />}
            <button onClick={() => pickImage((url) => { setPhoto(url); toast({ title: 'Đã cập nhật ảnh đại diện', tone: 'pos' }) })}
              aria-label="Đổi ảnh đại diện"
              className="absolute -bottom-1 -right-1 size-8 grid place-items-center rounded-full bg-surface border border-line shadow-sm text-dim hover:text-fg">
              <Camera size={15} />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="ds-h3">{saved.name}</span>
              <Badge tone="brand">{ROLES.admin.label}</Badge>
            </div>
            <div className="ds-caption mt-0.5">{saved.title} · Sen Việt Digital</div>
          </div>
          {photo && <Button variant="ghost" onClick={() => { setPhoto(null); toast('Đã gỡ ảnh đại diện') }}>Gỡ ảnh</Button>}
        </div>
      </Card>

      <Card>
        <CardHeader title="Thông tin cơ bản" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Họ và tên" value={f.name} onChange={set('name')} error={!nameOk ? 'Vui lòng nhập họ và tên.' : undefined} />
          <Input label="Tên gọi" value={f.preferred} onChange={set('preferred')} hint="Mạch sẽ chào bạn bằng tên này." />
          <Input label="Chức danh" value={f.title} onChange={set('title')} />
          <Input label="Ngày sinh" value={f.dob} onChange={set('dob')} placeholder="dd/mm/yyyy" />
          <Input label="Email đăng nhập" prefix={Mail} value={f.email} disabled hint="Liên hệ quản trị viên khác để đổi email đăng nhập." />
          <Input label="Số điện thoại" prefix={Phone} value={f.phone} onChange={set('phone')} hint="Nhận mã OTP và thông báo Zalo." />
        </div>
      </Card>

      <Card>
        <CardHeader title="Ngôn ngữ & khu vực" />
        <div className="grid sm:grid-cols-3 gap-4">
          <Select label="Ngôn ngữ" value={f.lang} onChange={set('lang')} options={[{ value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'English (sắp ra mắt)' }]} />
          <Select label="Múi giờ" value={f.tz} onChange={set('tz')} options={[{ value: 'Asia/Ho_Chi_Minh', label: '(GMT+7) Hà Nội, TP. Hồ Chí Minh' }, { value: 'Asia/Singapore', label: '(GMT+8) Singapore' }]} />
          <Select label="Định dạng ngày" value={f.dateFmt} onChange={set('dateFmt')} options={[{ value: 'dd/mm/yyyy', label: '08/11/2026' }, { value: 'd thg m', label: '8 thg 11, 2026' }]} />
        </div>
      </Card>

      <div className="flex items-center justify-end gap-2">
        {dirty && <span className="ds-caption mr-auto">Bạn có thay đổi chưa lưu.</span>}
        <Button variant="ghost" disabled={!dirty} onClick={() => setF(saved)}>Huỷ thay đổi</Button>
        <Button variant="primary" disabled={!dirty || !nameOk} onClick={() => {
          if (f.lang === 'en') { toast({ title: 'Tiếng Anh sắp ra mắt', desc: 'Giao diện vẫn hiển thị bằng tiếng Việt.', tone: 'info' }); setF((x) => ({ ...x, lang: 'vi' })) }
          setSaved({ ...f, lang: 'vi' })
          toast({ title: 'Đã lưu hồ sơ cá nhân', tone: 'pos' })
        }}>Lưu thay đổi</Button>
      </div>
    </div>
  )
}
