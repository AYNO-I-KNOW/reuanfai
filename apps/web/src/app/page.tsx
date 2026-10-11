import Link from 'next/link'
import {ArrowRight, Baby, Building2, Monitor, Smartphone, Stethoscope} from 'lucide-react'
import '@/design/fonts.css'
import s from './page.module.css'

// Single entry link for judges and demo: pick a role, open that prototype.
const roles = [
  {
    href: '/ruenfai',
    icon: Baby,
    name: 'แม่หลังคลอด',
    detail: 'ตอบแบบคัดกรองก่อนรับบริการ จองคิว ดูนัด ยา และบันทึกอาการ',
    device: 'ออกแบบสำหรับมือถือ (เปิดผ่าน LINE)',
    DeviceIcon: Smartphone,
  },
  {
    href: '/clinic',
    icon: Stethoscope,
    name: 'หน่วยบริการ',
    detail: 'ดูนัดหมาย ปฏิทินแพทย์ ข้อมูลคุณแม่ก่อนรับบริการ คลังยา และรีวิว',
    device: 'ออกแบบสำหรับจอคอมพิวเตอร์',
    DeviceIcon: Monitor,
  },
  {
    href: '/department',
    icon: Building2,
    name: 'กรมการแพทย์แผนไทยฯ',
    detail: 'ภาพรวมแบบรวมกลุ่ม: การเข้ารับบริการ ความพึงพอใจ และกรณีเข้าเกณฑ์ส่งต่อ',
    device: 'ออกแบบสำหรับจอคอมพิวเตอร์',
    DeviceIcon: Monitor,
  },
] as const

export default function Home() {
  return (
    <main className={s.page}>
      <div className={s.wrap}>
        <header className={s.header}>
          <h1>เรือนไฟ</h1>
          <p>เพื่อนคู่ใจแม่หลังคลอด ตั้งแต่วันคลอดจนครบ 3 เดือน</p>
        </header>

        <h2 className={s.prompt}>เลือกมุมมองที่ต้องการดู</h2>
        <ul className={s.roles}>
          {roles.map(({href, icon: Icon, name, detail, device, DeviceIcon}) => (
            <li key={href}>
              <Link href={href} className={s.role}>
                <span className={s.icon} aria-hidden="true"><Icon size={24} /></span>
                <span className={s.body}>
                  <span className={s.name}>{name}</span>
                  <span className={s.detail}>{detail}</span>
                  <span className={s.device}><DeviceIcon size={14} aria-hidden="true" />{device}</span>
                </span>
                <ArrowRight className={s.arrow} size={20} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>

        <p className={s.note}>ต้นแบบเพื่อการนำเสนอ · ใช้ข้อมูลจำลองทั้งหมด · เกณฑ์ยังไม่ผ่านการตรวจจากแพทย์แผนไทย</p>
      </div>
    </main>
  )
}
