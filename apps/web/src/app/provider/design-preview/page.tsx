'use client';
import Checkbox from '@/components/ui/reuanfai-checkbox';
import ProviderSelect from './ProviderSelect';
import { useEffect, useLayoutEffect, useRef, useState, useId, type ReactNode } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Package, MessageSquare, ChevronRight, ChevronLeft, ChevronDown, Search, ClipboardCheck, CircleAlert, PanelLeftClose, PanelLeftOpen, X, Plus, History, Check, ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown, Clock3, LogOut } from 'lucide-react';
import '@/design/fonts.css';
import { tokenStyle } from '@/design/tokens';
import { doctors, LOW_STOCK_LIMIT, services, activities, type Appointment, type Medicine } from './mock-data';
import s from './preview.module.css';
import ScheduleCalendar from './ScheduleCalendar';
import ReviewsPanel from './ReviewsPanel';
import {appointmentConflict,readCalendarSettings,supportsServices} from './appointment-validation';
import {careDemo,useCareDemo,savePrescription} from '@/design/care-demo';
// Seeded mock cases have no answers; mother bookings carry onboarding answers ('' = skipped optional question).
const reported = (v?: string) => v === undefined || v === 'ไม่มี' ? 'รายงานว่าไม่มี' : v || 'ไม่ได้ระบุ';
const isoDay = (a: Appointment) => `${(a.year ?? 2569) - 543}-${String((a.month ?? 10) + 1).padStart(2, '0')}-${String(a.day).padStart(2, '0')}`;
const thaiDay = new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'long' });
type View = 'dashboard' | 'appointments' | 'case' | 'treatment' | 'prescribe' | 'schedule' | 'inventory' | 'reviews';
type Draft = {
    rights: boolean;
    decisions: Record<string, string>;
    reason: string;
    before: number;
    after: number;
    done: string[];
    icd: string;
    course: number;
    next: string;
};
const newDraft = (): Draft => ({ rights: false, decisions: {}, reason: '', before: 6, after: 4, done: [], icd: '', course: 0, next: '' });
function TableScroll({ children }: {
    children: ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [overflow, setOverflow] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const check = () => setOverflow(el.scrollWidth > el.clientWidth + 1);
        const observer = new ResizeObserver(check);
        observer.observe(el);
        if (el.firstElementChild)
            observer.observe(el.firstElementChild);
        check();
        return () => observer.disconnect();
    }, []);
    return <>{overflow && <p className={s.tableHint}>เลื่อนซ้าย–ขวาเพื่อดูข้อมูลเพิ่มเติม</p>}<div ref={ref} className={s.tableScroll} tabIndex={overflow ? 0 : undefined} role="region" aria-label="ตารางข้อมูล">{children}</div></>;
}
function Illus({ kind = 0, small = false }: {
    kind?: number;
    small?: boolean;
}) { return <span aria-hidden="true" className={`${s.illus} ${small ? s.smallIllus : ''}`} data-illustration={kind} style={{ backgroundPosition: `${kind * 50}% center` }}/>; }
function medicineImage(m: Pick<Medicine, 'image' | 'unit'>) { return m.image || ('/images/provider-preview/medicine-' + (m.unit === 'ขวด' ? 'bottle' : 'sachet') + '.svg'); }
function MedicinePhoto({ medicine }: {
    medicine: Pick<Medicine, 'name' | 'image' | 'unit'>;
}) { return <Image unoptimized src={medicineImage(medicine)} alt={medicine.name} width={40} height={40} className={s.medicinePhoto}/>; }
function PhotoEditor({ src, onChange }: {
    src: string;
    onChange: (src: string) => void;
}) {
    const [error, setError] = useState('');
    return <div className={s.photoEditor}><Image unoptimized src={src} alt="รูปยา" width={88} height={88}/><div><label className={s.uploadLabel}>เปลี่ยนรูปยา<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => {
            const file = e.target.files?.[0];
            if (!file)
                return;
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
                setError('เลือก PNG, JPG หรือ WebP ไม่เกิน 5 MB');
                return;
            }
            setError('');
            const reader = new FileReader();
            reader.onload = () => onChange(String(reader.result));
            reader.readAsDataURL(file);
        }}/></label><small>PNG, JPG, WebP · ไม่เกิน 5 MB</small>{error && <p role="alert">{error}</p>}</div></div>;
}
function Badge({ children, good = false }: {
    children: ReactNode;
    good?: boolean;
}) { return <span className={`${s.badge} ${good ? s.good : ''}`}>{children}</span>; }
function Modal({ title, children, onClose }: {
    title: string;
    children: ReactNode;
    onClose: () => void;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    useEffect(() => { ref.current?.showModal(); const prevHtml = document.documentElement.style.overflow; const prevBody = document.body.style.overflow; document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; return () => { document.documentElement.style.overflow = prevHtml; document.body.style.overflow = prevBody; }; }, []);
    return <dialog ref={ref} className={s.modal} aria-labelledby={titleId} onCancel={onClose} onClick={e => {
            if (e.target === ref.current)
                onClose();
        }}><div className={s.cardHead}><h2 id={titleId}>{title}</h2><button aria-label="ปิด" className={s.iconButton} onClick={onClose}><X size={20}/></button></div>{children}</dialog>;
}
function CustomSelect({ value, options, onChange, ariaLabel, className }: {
    value: string;
    options: {
        value: string;
        label: string;
    }[] | string[];
    onChange: (value: string) => void;
    ariaLabel?: string;
    className?: string;
}) { return <ProviderSelect value={value} options={options.map(o => typeof o === 'string' ? { value: o, label: o } : o)} onChange={e => onChange(e.target.value)} ariaLabel={ariaLabel} className={className}/>; }
function CustomDateTimePicker({ value, onChange, withTime = true, placeholder = 'เลือกวันและเวลา' }: {
    value: string;
    onChange: (value: string) => void;
    withTime?: boolean;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const [viewYear, setViewYear] = useState(2026);
    const [viewMonth, setViewMonth] = useState(10);
    const [selectedDate, setSelectedDate] = useState(() => value ? value.split('T')[0] : '2026-11-12');
    const [selectedTime, setSelectedTime] = useState(() => value && value.includes('T') ? value.split('T')[1].slice(0, 5) : '10:30');
    const monthsTh = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const monthsThShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        }
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [open]);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const displayText = (() => {
        if (!value)
            return null;
        const parts = value.split('T');
        const dParts = parts[0].split('-');
        if (dParts.length === 3) {
            const d = Number(dParts[2]);
            const m = Number(dParts[1]) - 1;
            const y = Number(dParts[0]) + 543;
            const timeStr = parts[1] ? ` · ${parts[1].slice(0, 5)} น.` : '';
            return `${d} ${monthsThShort[m] || ''} ${y}${withTime ? timeStr : ''}`;
        }
        return value;
    })();
    const pickDay = (dayNum: number) => {
        const mm = String(viewMonth + 1).padStart(2, '0');
        const dd = String(dayNum).padStart(2, '0');
        const dStr = `${viewYear}-${mm}-${dd}`;
        setSelectedDate(dStr);
        const result = withTime ? `${dStr}T${selectedTime}` : dStr;
        onChange(result);
        if (!withTime)
            setOpen(false);
    };
    const pickTime = (timeStr: string) => {
        setSelectedTime(timeStr);
        const result = `${selectedDate}T${timeStr}`;
        onChange(result);
    };
    return <div ref={ref} className={s.customDateWrap}>
    <button type="button" aria-haspopup="dialog" aria-expanded={open} className={s.customDateTrigger} onClick={() => setOpen(!open)}>
      {displayText ? <span className={s.customDateTriggerText}>{displayText}</span> : <span className={s.customDateTriggerPlaceholder}>{placeholder}</span>}
      <CalendarDays size={17} className={s.customDateTriggerIcon}/>
    </button>
    {open && <div className={s.customDatePickerCard} role="dialog" aria-label="เลือกวันที่และเวลา">
      <div className={s.customDateHeader}>
        <button type="button" className={s.customDateNavBtn} onClick={() => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1)} aria-label="เดือนก่อนหน้า"><ChevronLeft size={16}/></button>
        <span className={s.customDateHeaderTitle}>{monthsTh[viewMonth]} {viewYear + 543}</span>
        <button type="button" className={s.customDateNavBtn} onClick={() => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1)} aria-label="เดือนถัดไป"><ChevronRight size={16}/></button>
      </div>
      <div className={s.customDateGrid}>
        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => <span key={d} className={s.customDateDOW}>{d}</span>)}
        {Array.from({ length: firstDayOfWeek }, (_, i) => <span key={`empty-${i}`} className={s.customDateDayBtnEmpty}/>)}
        {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const mm = String(viewMonth + 1).padStart(2, '0');
                const dd = String(dayNum).padStart(2, '0');
                const isSelected = selectedDate === `${viewYear}-${mm}-${dd}`;
                const isToday = viewYear === 2026 && viewMonth === 10 && dayNum === 5;
                return <button type="button" key={dayNum} className={`${s.customDateDayBtn} ${isSelected ? s.customDateDayBtnSelected : ''} ${isToday ? s.customDateDayBtnToday : ''}`} onClick={() => pickDay(dayNum)}>{dayNum}</button>;
            })}
      </div>
      {withTime && <div className={s.customTimeSection}>
        <div className={s.customTimeTitle}><Clock3 size={13}/><span>เวลาที่ต้องการนัดหมาย</span></div>
        <div className={s.customTimeSlots}>
          {['09:00', '10:30', '13:00', '14:30', '16:00'].map(t => <button type="button" key={t} className={`${s.customTimePill} ${selectedTime === t ? s.customTimePillActive : ''}`} onClick={() => pickTime(t)}>{t} น.</button>)}
        </div>
      </div>}
      <div className={s.customDateFooter}>
        <button type="button" className={s.todayLink} onClick={() => { setViewYear(2026); setViewMonth(10); pickDay(5); }}>วันนี้</button>
        <button type="button" className={s.confirmBtn} onClick={() => setOpen(false)}>ตกลง</button>
      </div>
    </div>}
  </div>;
}
function AppointmentAgenda({ appointments, selectedDate, onSelectDate, monthIdx, year, onPrevMonth, onNextMonth, onGoToday, onOpen }: {
    appointments: Appointment[];
    selectedDate: {
        day: number;
        month: number;
        year: number;
    } | null;
    onSelectDate: (d: {
        day: number;
        month: number;
        year: number;
    } | null) => void;
    monthIdx: number;
    year: number;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onGoToday: () => void;
    onOpen: (a: Appointment) => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
    const monthsTh = [{ name: 'มกราคม', days: 31 }, { name: 'กุมภาพันธ์', days: 28 }, { name: 'มีนาคม', days: 31 }, { name: 'เมษายน', days: 30 }, { name: 'พฤษภาคม', days: 31 }, { name: 'มิถุนายน', days: 30 }, { name: 'กรกฎาคม', days: 31 }, { name: 'สิงหาคม', days: 31 }, { name: 'กันยายน', days: 30 }, { name: 'ตุลาคม', days: 31 }, { name: 'พฤศจิกายน', days: 30 }, { name: 'ธันวาคม', days: 31 }];
    const daysInCurrentMonth = new Date(year - 543, monthIdx + 1, 0).getDate();
    const firstDayOfWeek = new Date(year - 543, monthIdx, 1).getDay();
    const isCurrentMonthToday = monthIdx === 10 && year === 2569;
    const prevMonthIdx = monthIdx === 0 ? 11 : monthIdx - 1;
    const prevYear = monthIdx === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear - 543, prevMonthIdx + 1, 0).getDate();
    const totalCellsSoFar = firstDayOfWeek + daysInCurrentMonth;
    const remainingInWeek = (7 - (totalCellsSoFar % 7)) % 7;
    const monthAppts = appointments.filter(a => (a.month ?? 10) === monthIdx && (a.year ?? 2569) === year);
    const remaining = monthAppts.filter(a => a.status !== 'ยกเลิก').sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
    function handlePrev() {
        setSlideDir('left');
        onSelectDate(null);
        onPrevMonth();
    }
    function handleNext() {
        setSlideDir('right');
        onSelectDate(null);
        onNextMonth();
    }
    function handleGoToday() {
        onGoToday();
        const box = scrollRef.current;
        if (box) {
            const target = box.querySelector<HTMLElement>('[data-agenda-day="5"]');
            if (target)
                box.scrollTo({ top: target.offsetTop - 12, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        }
    }
    function scrollToDay(dayNum: number) {
        onSelectDate({ day: dayNum, month: monthIdx, year });
        const box = scrollRef.current;
        if (!box)
            return;
        const target = box.querySelector<HTMLElement>(`[data-agenda-day="${dayNum}"]`);
        if (target) {
            box.scrollTo({ top: target.offsetTop - 12, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        }
        else {
            const allDays = Array.from(box.querySelectorAll<HTMLElement>('[data-agenda-day]'));
            const nextClosest = allDays.find(el => Number(el.dataset.agendaDay) >= dayNum) || allDays[allDays.length - 1];
            if (nextClosest) {
                box.scrollTo({ top: nextClosest.offsetTop - 12, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
            }
        }
    }
    useEffect(() => {
        const box = scrollRef.current;
        if (!box)
            return;
        if (isCurrentMonthToday && selectedDate?.month === 10 && selectedDate?.day === 5) {
            const target = box.querySelector<HTMLElement>('[data-agenda-day="5"]');
            if (target)
                box.scrollTop = target.offsetTop - 12;
        }
        else if (!selectedDate) {
            box.scrollTop = 0;
        }
    }, [monthIdx, year, isCurrentMonthToday, selectedDate]);
    return <section className={s.calendarPanel}><div className={s.calendarBox}><div className={s.calendarHeader}><h2>{monthsTh[monthIdx].name} {year}</h2><div className={s.calendarControls}><button type="button" className={s.todayBtn} onClick={handleGoToday} title="กลับไปดูนัดวันนี้ (5 พ.ย.)">วันนี้</button><div className={s.monthButtons}><button type="button" className={s.iconButtonSm} onClick={handlePrev} aria-label="เดือนก่อนหน้า" title="ย้อนไปเดือนก่อนหน้า"><ChevronLeft size={16}/></button><button type="button" className={s.iconButtonSm} onClick={handleNext} aria-label="เดือนถัดไป" title="ไปดูนัดหมายเดือนถัดไป"><ChevronRight size={16}/></button></div></div></div><div key={`${monthIdx}-${year}`} className={`${s.calendar} ${slideDir === 'left' ? s.calendarSlideLeft : slideDir === 'right' ? s.calendarSlideRight : ''}`}>{['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => <span key={d}>{d}</span>)}{Array.from({ length: firstDayOfWeek }, (_, i) => { const faintNum = daysInPrevMonth - firstDayOfWeek + 1 + i; return <span key={`prev-${i}`} className={s.calendarFaintDay} aria-hidden="true">{faintNum}</span>; })}{Array.from({ length: daysInCurrentMonth }, (_, i) => { const dayNum = i + 1; const isSelected = selectedDate !== null && selectedDate.day === dayNum && selectedDate.month === monthIdx && selectedDate.year === year; const isToday = isCurrentMonthToday && dayNum === 5; const hasAppt = monthAppts.some(a => a.day === dayNum && a.status !== 'ยกเลิก'); return <button key={dayNum} type="button" className={`${isSelected ? s.selectedDay : ''} ${isToday ? s.todayDay : ''}`} aria-pressed={isSelected} aria-label={`${dayNum} ${monthsTh[monthIdx].name} ${year}${isToday ? ' วันนี้' : ''}`} onClick={() => scrollToDay(dayNum)}>{dayNum}{hasAppt && <i />}</button>; })}{Array.from({ length: remainingInWeek }, (_, i) => { const faintNum = i + 1; return <span key={`next-${i}`} className={s.calendarFaintDay} aria-hidden="true">{faintNum}</span>; })}</div></div><div className={s.activityLog}><div className={s.logHeader}><h2>กิจกรรมนัดหมาย</h2><span className={s.secondary}>{remaining.length} รายการ</span></div><div className={s.agendaViewport}><div ref={scrollRef} className={s.agendaScroller} role="region" aria-label="กิจกรรมนัดหมาย เลื่อนเพื่อดูวันอื่น" tabIndex={0}>{remaining.length === 0 ? <div className={s.agendaEmptyBox}><CalendarDays size={28}/><p>ไม่มีนัดหมายในเดือน{monthsTh[monthIdx].name} {year}</p><button type="button" className={s.link} onClick={handleGoToday}>กลับมาดูนัดวันนี้ (5 พ.ย.)</button></div> : Array.from(new Set(remaining.map(a => a.day))).map(date => { const items = remaining.filter(a => a.day === date); return <section className={s.agendaDay} data-agenda-day={date} key={date}><h3>{date} {monthsTh[monthIdx].name}</h3><div className={s.timeline}>{items.map(a => <article className={s.activity} key={a.id}><Illus kind={a.illustration}/><div className={s.activityContent}><div className={s.appointmentTitle}><strong>คุณแม่ {a.name || a.id}</strong><time>{a.time} น.</time></div><span className={s.description}>{a.services}</span><span className={s.description}>{a.doctor || 'ยังไม่ระบุแพทย์'}</span>{a.phone && <a className={s.description} href={`tel:${a.phone}`}>{a.phone}</a>}<button className={s.appointmentAction} onClick={() => onOpen(a)} aria-label={`${a.status === 'รอยืนยันนัด' ? 'ตรวจสอบนัด' : a.status === 'รอประเมิน' ? 'เริ่มประเมิน' : a.status === 'บันทึกแล้ว' ? 'ดูบันทึก' : 'ดูประวัติ'}คุณแม่ ${a.name || a.id}`}>{a.status === 'รอยืนยันนัด' ? 'ตรวจสอบนัด' : a.status === 'รอประเมิน' ? 'เริ่มประเมิน' : a.status === 'บันทึกแล้ว' ? 'ดูบันทึก' : 'ดูประวัติ'}<ChevronRight size={14}/></button></div></article>)}</div></section>; })}</div></div></div></section>;
}
export default function ProviderDesignPreview() {
    const router = useRouter();
    const overviewRef = useRef<HTMLDivElement>(null);
    const overviewPositions = useRef(new Map<string, number>());
    const [overviewEdges, setOverviewEdges] = useState({ start: true, end: false });
    function syncOverview() {
        const e = overviewRef.current;
        if (e)
            setOverviewEdges({ start: e.scrollLeft <= 2, end: e.scrollLeft + e.clientWidth >= e.scrollWidth - 2 });
    }
    function slideOverview(direction: number) {
        const e = overviewRef.current;
        const card = e?.querySelector('article');
        if (!e || !card)
            return;
        const cardWidth = card.getBoundingClientRect().width + 16;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            e.scrollBy({ left: direction * cardWidth, behavior: 'instant' });
            syncOverview();
            return;
        }
        e.style.scrollSnapType = 'none';
        e.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
        setTimeout(() => {
            if (e) {
                e.style.scrollSnapType = 'x mandatory';
                syncOverview();
            }
        }, 360);
    }
    const [view, setView] = useState<View>('dashboard');
    const [calendarCreateRequest, setCalendarCreateRequest] = useState(0);
    const [collapsed, setCollapsed] = useState(true);
    type AppointmentSortKey = 'date' | 'time' | 'name' | 'services' | 'doctor' | 'status';
    const [appointmentSort, setAppointmentSort] = useState<{
        key: AppointmentSortKey;
        direction: 'asc' | 'desc';
    }>({ key: 'date', direction: 'asc' });
    function sortAppointments(rows: Appointment[]) {
        const dateValue = (a: Appointment) => (a.year ?? 2569) * 10000 + ((a.month ?? 10) + 1) * 100 + a.day;
        return [...rows].sort((a, b) => {
            const key = appointmentSort.key;
            const value = (x: Appointment) => key === 'name' ? (x.name || x.id) : key === 'status' ? (x.status === 'บันทึกแล้ว' ? 'เสร็จสิ้น' : x.status) : key === 'doctor' ? (x.doctor || '') : key === 'time' ? x.time : x.services;
            const result = key === 'date' ? dateValue(a) - dateValue(b) || a.time.localeCompare(b.time) : value(a).localeCompare(value(b), 'th', { numeric: true });
            return (appointmentSort.direction === 'asc' ? result : -result) || a.id.localeCompare(b.id);
        });
    }
    function AppointmentSortHeader({ column, label }: {
        column: AppointmentSortKey;
        label: string;
    }) {
        const active = appointmentSort.key === column;
        return <th aria-sort={active ? (appointmentSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button className={s.appointmentSortButton} onClick={() => { setAppointmentSort(old => ({ key: column, direction: old.key === column && old.direction === 'asc' ? 'desc' : 'asc' })); setDashboardPage(1); }} aria-label={`เรียงตาม${label}`}><span>{label}</span>{active ? (appointmentSort.direction === 'asc' ? <ArrowUp size={14} className={s.sortIconActive}/> : <ArrowDown size={14} className={s.sortIconActive}/>) : <ArrowUpDown size={13} className={s.sortIconMuted}/>}</button></th>;
    }
    const [appointmentScope, setAppointmentScope] = useState<'all' | 'overdue' | 'today'>('all');
    const [hideCompleted, setHideCompleted] = useState(true);
    const [hideCancelled, setHideCancelled] = useState(true);
    type SelectedDate = {
        day: number;
        month: number;
        year: number;
    } | null;
    const [selectedDate, setSelectedDate] = useState<SelectedDate>({ day: 5, month: 10, year: 2569 });
    const care=useCareDemo();
    const appointments=care.appointments;
    const previewDay=(a:Appointment)=>(a.year??2569)*10000+((a.month??10)+1)*100+a.day;
    const previewToday=25691105;
    function setAppointments(update:Appointment[]|((old:Appointment[])=>Appointment[])){careDemo.set(old=>({...old,appointments:typeof update==='function'?update(old.appointments):update}));}
    const [monthIdx, setMonthIdx] = useState(10);
    const [year, setYear] = useState(2569);
    function prevMonth() {
        if (monthIdx === 0) {
            setMonthIdx(11);
            setYear(y => y - 1);
        }
        else {
            setMonthIdx(m => m - 1);
        }
    }
    function nextMonth() {
        if (monthIdx === 11) {
            setMonthIdx(0);
            setYear(y => y + 1);
        }
        else {
            setMonthIdx(m => m + 1);
        }
    }
    function goToday() { setMonthIdx(10); setYear(2569); setSelectedDate({ day: 5, month: 10, year: 2569 }); }
    const [selected, setSelected] = useState('B07');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ทั้งหมด');
    const medicines=care.medicines;
    function setMedicines(update:Medicine[]|((old:Medicine[])=>Medicine[])){careDemo.set(old=>({...old,medicines:typeof update==='function'?update(old.medicines):update}));}
    const [medicine, setMedicine] = useState('ยาเลือดงาม');
    const [medicineSearch, setMedicineSearch] = useState('');
    type MedSortKey = 'name' | 'quantity' | 'lot' | 'expiry' | 'days' | 'threshold' | 'status';
    const [sortKey, setSortKey] = useState<MedSortKey>('days');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    function toggleSort(k: MedSortKey) {
        if (sortKey === k) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortKey(k);
            setSortDir('asc');
        }
    }
    const sortedMedicines = [...medicines].sort((a, b) => {
        let diff = 0;
        if (sortKey === 'name')
            diff = a.name.localeCompare(b.name, 'th');
        else if (sortKey === 'quantity')
            diff = a.quantity - b.quantity;
        else if (sortKey === 'lot')
            diff = a.lot.localeCompare(b.lot);
        else if (sortKey === 'expiry')
            diff = a.expiry.localeCompare(b.expiry);
        else if (sortKey === 'days')
            diff = a.days - b.days;
        else if (sortKey === 'threshold')
            diff = a.threshold - b.threshold;
        else if (sortKey === 'status') {
            const score = (m: typeof a) => m.quantity <= LOW_STOCK_LIMIT ? 0 : m.days < 60 ? 1 : 2;
            diff = score(a) - score(b);
        }
        return sortDir === 'asc' ? diff : -diff;
    });
    const [drafts, setDrafts] = useState<Record<string, Draft>>({});
    const [notice, setNotice] = useState('');
    const [tipDismissed, setTipDismissed] = useState(false);
    const [modal, setModal] = useState<'stock' | 'history' | 'report' | 'leave' | 'newMedicine' | 'editMedicine' | 'newAppointment' | null>(null);
    const [appointmentName, setAppointmentName] = useState('');
    const [appointmentPhone, setAppointmentPhone] = useState('');
    const [appointmentDay, setAppointmentDay] = useState(5);
    const [appointmentTime, setAppointmentTime] = useState('09:00');
    const [appointmentServices, setAppointmentServices] = useState<string[]>(['นัดประเมิน']);
    const [appointmentDoctor, setAppointmentDoctor] = useState(doctors[0]);
    const [appointmentBirth, setAppointmentBirth] = useState('คลอดทางช่องคลอด');
    const [appointmentPostpartum, setAppointmentPostpartum] = useState(0);
    const [contacted, setContacted] = useState(false);
    const [confirmDoctor, setConfirmDoctor] = useState('');
    const [stockHistory, setStockHistory] = useState<string[]>([]);
    const [stockName, setStockName] = useState('ยาเลือดงาม');
    const [stockMode, setStockMode] = useState('รับยาเข้า');
    const [stockPhoto, setStockPhoto] = useState<string | null>(null);
    const [newBenefits, setNewBenefits] = useState('');
    const [editingMedicine, setEditingMedicine] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newUnit, setNewUnit] = useState('ซอง');
    const [newPhoto, setNewPhoto] = useState<string | null>(null);
    const stockMedicine = medicines.find(m => m.name === stockName)!;
    const [stockAmount, setStockAmount] = useState(10);
    const [stockLot, setStockLot] = useState('');
    const [stockExpiry, setStockExpiry] = useState('');
    const [stockReason, setStockReason] = useState('');
    const [dose, setDose] = useState('');
    const [frequency, setFrequency] = useState('');
    const [duration, setDuration] = useState(3);
    const [amount, setAmount] = useState(6);
    const [courseStart, setCourseStart] = useState('2026-11-12');
    const [leaveDate, setLeaveDate] = useState('2026-11-13');
    const [leaves, setLeaves] = useState<string[]>([]);
    useLayoutEffect(() => {
        const track = overviewRef.current;
        if (!track) {
            overviewPositions.current.clear();
            return;
        }
        const previous = overviewPositions.current;
        const next = new Map<string, number>();
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const cards = Array.from(track.querySelectorAll<HTMLElement>('article'));
        cards.forEach(card => {
            const key = card.dataset.overviewKey || card.querySelector('h3')?.textContent || '';
            const left = card.offsetLeft;
            next.set(key, left);
            if (!reduced && previous.size) {
                const old = previous.get(key);
                card.getAnimations().forEach(a => a.cancel());
                if (old === undefined)
                    card.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, easing: 'ease-out' });
                else if (old !== left)
                    card.animate([{ transform: `translateX(${old - left}px)` }, { transform: 'translateX(0)' }], { duration: 260, easing: 'cubic-bezier(.2,0,0,1)' });
            }
        });
        overviewPositions.current = next;
        track.scrollLeft = Math.min(track.scrollLeft, Math.max(0, track.scrollWidth - track.clientWidth));
        syncOverview();
    }, [view, appointments, medicines, contacted]);
    const patient = appointments.find(a => a.id === selected)!;
    // Mother bookings (requestedAt set) show their own timeline; seeded cases keep the fixed demo history.
    const motherHistory = patient.requestedAt ? [
        ...appointments.filter(a => a.requestedAt && a.id !== patient.id && a.status === 'บันทึกแล้ว').map(a => [isoDay(a), `รับบริการ ${a.services}`]).sort(([a], [b]) => a.localeCompare(b)),
        [patient.requestedAt, `ส่งคำขอจอง ${patient.services}`],
        ...(patient.confirmedAt ? [[patient.confirmedAt, `หน่วยบริการยืนยันนัด · ${patient.doctor}`]] : []),
    ].reverse() : null;
    const draft = drafts[selected] || newDraft();
    const pickedMed = medicines.find(m => m.name === medicine)!;
    const contraindicated = patient.birth === 'ผ่าคลอด' && medicine === 'ยาไฟประลัยกัลป์';
    const low = medicines.filter(m => m.quantity <= LOW_STOCK_LIMIT);
    const expiring = medicines.filter(m => m.expiry && m.days < 60);
    const [dashboardPage, setDashboardPage] = useState(1);
    const [dashboardPageSize, setDashboardPageSize] = useState(6);
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            try {
                const saved = Number(localStorage.getItem('reuanfai.provider.dashboard.pageSize'));
                if ([6, 8, 12].includes(saved))
                    setDashboardPageSize(saved);
            }
            catch { }
        });
        return () => cancelAnimationFrame(frame);
    }, []);
    function changeDashboardPageSize(value: string) {
        const size = Number(value);
        if (![6, 8, 12].includes(size))
            return;
        setDashboardPageSize(size);
        setDashboardPage(1);
        try {
            localStorage.setItem('reuanfai.provider.dashboard.pageSize', String(size));
        }
        catch { }
    }
    const dashboardAppointments = appointments.filter(a => a.day >= 5 || (a.status !== 'บันทึกแล้ว' && a.status !== 'ยกเลิก')).sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
    const dashboardPageCount = Math.max(1, Math.ceil(dashboardAppointments.length / dashboardPageSize));
    const activeDashboardPage = Math.min(dashboardPage, dashboardPageCount);
    function editMedicine(m: Medicine) { setEditingMedicine(m.name); setNewBenefits(m.benefits || ''); setNewName(m.name); setNewUnit(m.unit); setNewPhoto(medicineImage(m)); setModal('editMedicine'); }
    function go(v: View) { setAppointmentScope('all'); setView(v); setSearch(''); setFilter('ทั้งหมด'); window.scrollTo({ top: 0, behavior: 'instant' }); }
    function openCase(a: Appointment) { setSelected(a.id); go('case'); }
    function updateDraft(part: Partial<Draft>) { setDrafts(old => ({ ...old, [selected]: { ...(old[selected] || newDraft()), ...part } })); }
    function updateAppointment(part: Partial<Appointment>) { setAppointments(old => old.map(a => a.id === selected ? { ...a, ...part } : a)); }
    // Mother bookings must get a doctor before confirming; same service/leave/overlap checks as "เพิ่มนัดหมาย".
    function confirmAppointment() {
        const doctor = patient.doctor || confirmDoctor;
        if (!doctor) return notify('เลือกแพทย์ผู้ดูแลก่อนยืนยันนัด');
        const settings = readCalendarSettings();
        if (!supportsServices(doctor, patient.services, settings?.capabilities || {})) return notify('แพทย์ไม่ให้บริการที่เลือก กรุณาเลือกแพทย์อื่น');
        const date = isoDay(patient);
        const [endDate, endTime] = patient.endTime ? [patient.endDate || date, patient.endTime] : new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(Date.parse(`${date}T${patient.time}:00+07:00`) + 3600000).split(' ');
        const conflict = appointmentConflict(appointments, settings?.leaves || [], doctor, date, patient.time, endTime, patient.id, endDate);
        if (conflict) return notify(conflict);
        updateAppointment({ status: 'ยืนยันแล้ว', doctor, confirmedAt: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date()) });
        setConfirmDoctor('');
        notify('ยืนยันนัดแล้ว');
    }
    function notify(text: string) { setNotice(text); }
    useEffect(() => {
        if (!notice)
            return;
        const timer = setTimeout(() => setNotice(''), 4000);
        return () => clearTimeout(timer);
    }, [notice]);
    const nav = [{ view: 'dashboard' as View, label: 'ภาพรวม', Icon: LayoutDashboard }, { view: 'appointments' as View, label: 'นัดหมาย', Icon: CalendarDays }, { view: 'schedule' as View, label: 'ปฏิทินแพทย์', Icon: ClipboardCheck }, { view: 'inventory' as View, label: 'คลังยา', Icon: Package }, { view: 'reviews' as View, label: 'รีวิวหน่วยบริการ', Icon: MessageSquare }];
    function AppointmentTable({ compact = false }: {
        compact?: boolean;
    }) {
        const rows = sortAppointments(dashboardAppointments);
        const visible = compact ? rows.slice((activeDashboardPage - 1) * dashboardPageSize, activeDashboardPage * dashboardPageSize) : rows;
        return <><TableScroll><table className={s.dashboardTable}><colgroup><col style={{ width: 112 }}/><col style={{ width: "28%" }}/><col /><col style={{ width: 132 }}/><col style={{ width: 80 }}/></colgroup><thead><tr><AppointmentSortHeader column="date" label="วันที่ / เวลา"/><AppointmentSortHeader column="name" label="คุณแม่"/><AppointmentSortHeader column="services" label="บริการ / แพทย์"/><AppointmentSortHeader column="status" label="สถานะ"/><th><span className={s.srOnly}>เปิดข้อมูล</span></th></tr></thead><tbody>{visible.map(a => <tr key={a.id}><td className={s.nowrap}>{a.day} {['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][a.month??10]}<small className={s.appointmentDoctor}>{a.time} น.</small></td><td><button className={s.nameButton} onClick={() => openCase(a)}><Illus kind={a.illustration} small/><span>คุณแม่ {a.name || a.id}<small className={s.appointmentDoctor}>{a.phone || 'ยังไม่ระบุเบอร์'}</small></span></button></td><td>{a.services}<small className={s.appointmentDoctor}>{a.doctor || 'ยังไม่ระบุแพทย์'}</small></td><td><Badge good={a.status === 'ยืนยันแล้ว' || a.status === 'บันทึกแล้ว'}>{a.status === 'บันทึกแล้ว' ? 'เสร็จสิ้น' : a.status}</Badge></td><td><button className={s.iconButton} aria-label={`เปิดเคสคุณแม่ ${a.name || a.id}`} onClick={() => openCase(a)}><ChevronRight size={17}/></button></td></tr>)}</tbody></table></TableScroll>{!rows.length && <div className={s.empty}>ไม่มีนัดหมายที่รอดำเนินการ</div>}</>;
    }
    function AppointmentRecords({ history = false }: {
        history?: boolean;
    }) {
        const rows = sortAppointments(appointments.filter(a => (history || appointmentScope === 'all' || (appointmentScope === 'today' ? previewDay(a) === previewToday : previewDay(a) < previewToday && a.status !== 'บันทึกแล้ว' && a.status !== 'ยกเลิก')) && (history ? a.status === 'บันทึกแล้ว' : (!hideCompleted || a.status !== 'บันทึกแล้ว') && (!hideCancelled || a.status !== 'ยกเลิก')) && (`คุณแม่ ${a.name || a.id} ${a.services} ${a.doctor || ''} ${a.phone || ''}`.includes(search)) && (filter === 'ทั้งหมด' || a.status === filter)));
        return <><TableScroll><table className={s.appointmentsTable}><colgroup><col style={{ width: 144 }}/><col style={{ width: 104 }}/><col style={{ width: "20%" }}/><col /><col style={{ width: "21%" }}/><col style={{ width: 140 }}/><col style={{ width: 80 }}/></colgroup><thead><tr><AppointmentSortHeader column="date" label="วันที่"/><AppointmentSortHeader column="time" label="เวลา"/><AppointmentSortHeader column="name" label="คุณแม่"/><AppointmentSortHeader column="services" label="บริการที่นัด"/><AppointmentSortHeader column="doctor" label="แพทย์ผู้ดูแล"/><AppointmentSortHeader column="status" label="สถานะ"/><th><span className={s.srOnly}>เปิดข้อมูล</span></th></tr></thead><tbody>{rows.map(a => <tr key={a.id}><td className={s.nowrap}>{a.day} {['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][a.month??10]} {a.year??2569}</td><td className={s.nowrap}>{a.time} น.</td><td><button className={s.nameButton} onClick={() => openCase(a)}><Illus kind={a.illustration} small/><span>คุณแม่ {a.name || a.id}<small className={s.appointmentDoctor}>{a.phone || 'ยังไม่ระบุเบอร์'}</small></span></button></td><td>{a.services}</td><td>{a.doctor || 'ยังไม่ระบุแพทย์'}</td><td><Badge good={a.status === 'ยืนยันแล้ว' || a.status === 'บันทึกแล้ว'}>{a.status === 'บันทึกแล้ว' ? 'เสร็จสิ้น' : a.status}</Badge></td><td><button className={s.iconButton} aria-label={`เปิดเคสคุณแม่ ${a.name || a.id}`} onClick={() => openCase(a)}><ChevronRight size={17}/></button></td></tr>)}</tbody></table></TableScroll>{!rows.length && <div className={s.empty}>{history ? 'ยังไม่มีประวัติกิจกรรมที่ตรงกับการค้นหา' : 'ไม่พบนัดหมายที่ตรงกับตัวกรอง'}</div>}</>;
    }
    function CaseHeader() { return <><div className={s.patientHeader}><Illus kind={patient.illustration}/><div><h1>คุณแม่ {patient.name || patient.id}</h1><p>{patient.birth} · {patient.postpartum} วันหลังคลอด · ครั้งที่ {patient.visit} จาก 5</p></div><Badge>{patient.status}</Badge></div><div className={s.tabs}>{([['case', 'ใบสรุปเคส'], ['treatment', 'บันทึกการรักษา'], ['prescribe', 'สั่งยา']] as const).map(([v, t]) => <button className={view === v ? s.activeTab : ''} key={v} onClick={() => go(v)}>{t}</button>)}</div></>; }
    return <div className={`${s.shell} ${collapsed ? s.collapsed : ''}`} style={tokenStyle}>
    <aside className={s.sidebar}>
      <div className={s.sidebarHeader}>
        <button type="button" className={s.logo} onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'กาง Sidebar' : 'ย่อ Sidebar'} title={collapsed ? 'คลิกเพื่อกาง Sidebar' : 'คลิกเพื่อย่อ Sidebar'} aria-expanded={!collapsed}>
          <div className={s.logoMedia}>
            <Image src="/images/logo-dtam.png" width={40} height={40} alt="เรือนไฟ" className={s.logoImg} priority/>
            <span className={s.logoHoverOverlay} aria-hidden="true">
              {collapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}
            </span>
          </div>
          <div className={s.brandText}>
            <strong>เรือนไฟ</strong>
            <small className={s.unitName}>ศูนย์แพทย์แผนไทย</small>
          </div>
        </button>
        <button type="button" className={s.collapseHeaderBtn} onClick={() => setCollapsed(true)} aria-label="ย่อ Sidebar" title="ย่อ Sidebar">
          <PanelLeftClose size={18}/>
        </button>
      </div>

      <div className={s.sidebarDivider} role="separator"/>

      <nav className={s.sidebarNav} aria-label="เมนูหน่วยบริการ">
        {nav.map(({ view: v, label, Icon }) => (<button key={v} title={collapsed ? label : undefined} aria-label={label} aria-current={view === v ? 'page' : undefined} className={`${s.navButton} ${view === v || (v === 'appointments' && ['case', 'treatment', 'prescribe'].includes(view)) ? s.activeNav : ''}`} onClick={() => go(v)}>
            <span className={s.navIconWrap}><Icon size={20}/></span>
            <span className={s.navLabel}>{label}</span>
          </button>))}
      </nav>

      <div className={s.sidebarFooter}>
        <button type="button" className={s.logoutButton} onClick={() => { router.push('/login'); }} title={collapsed ? 'ออกจากระบบ' : undefined} aria-label="ออกจากระบบ">
          <span className={s.navIconWrap}><LogOut size={20}/></span>
          <span className={s.navLabel}>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
    <div className={s.workspace}><header className={`${s.header} ${view === 'schedule' ? s.calendarHeader : ''}`}><div className={s.headerTitle}>{(['case', 'treatment', 'prescribe'].includes(view)) && <button type="button" className={s.backButton} onClick={() => go('appointments')} aria-label="ย้อนกลับไปหน้านัดหมาย" title="ย้อนกลับ"><ArrowLeft size={18}/></button>}<h1>{({ dashboard: 'ภาพรวมหน่วยบริการ', appointments: 'นัดหมาย', schedule: 'ปฏิทินแพทย์', inventory: 'คลังยา', reviews: 'รีวิวหน่วยบริการ', case: `คุณแม่ ${patient.name || patient.id}`, treatment: `คุณแม่ ${patient.name || patient.id}`, prescribe: `คุณแม่ ${patient.name || patient.id}` })[view]}</h1></div>{view === 'schedule' && <div id="calendar-header-controls" className={s.calendarHeaderHost}/>}<div className={s.headerActions}>{view === 'reviews' && <div id="reviews-header-controls"/>}{view === 'schedule' && <div id="calendar-management-actions"/>}{view === 'schedule' && <button className={s.primary} onClick={() => setCalendarCreateRequest(x => x + 1)}><Plus size={17}/> เพิ่มนัดหมาย</button>}{view === 'appointments' && <button className={s.primary} onClick={() => { setAppointmentName(''); setAppointmentPhone(''); setAppointmentDay(selectedDate?.day ?? 5); setAppointmentServices(['นัดประเมิน']); setModal('newAppointment'); }}><Plus size={17}/> เพิ่มนัดหมาย</button>}{view === 'dashboard' && <span className={s.date}><CalendarDays size={18}/> 5 พฤศจิกายน 2569</span>}{view === 'inventory' && <div className={s.buttons}><button onClick={() => setModal('history')}><History size={17}/> ประวัติการจ่าย</button><button className={s.primary} onClick={() => { setStockMode('รับยาเข้า'); setStockPhoto(null); setModal('stock'); }}><Plus size={17}/> รับยาเข้า</button><button onClick={() => { setStockMode('ปรับยอด'); setStockPhoto(null); setModal('stock'); }}>ปรับยอด</button><button onClick={() => { setEditingMedicine(null); setNewBenefits(''); setNewName(''); setNewUnit('ซอง'); setNewPhoto(null); setModal('newMedicine'); }}><Plus size={17}/> เพิ่มยาใหม่</button></div>}</div></header><main className={s.main}>
    {view === 'dashboard' && <><div className={s.bento}><div className={s.left}><section className={s.summary} aria-label="สรุปนัดหมาย">
      {[{ value: appointments.filter(a => previewDay(a) === previewToday && a.status !== 'ยกเลิก').length, label: 'นัดหมายวันนี้' }, { value: appointments.filter(a => previewDay(a) < previewToday && a.status !== 'บันทึกแล้ว' && a.status !== 'ยกเลิก').length, label: 'นัดหมายที่ค้าง' }, { value: appointments.length, label: 'นัดหมายทั้งหมด' }].map(({ value, label }, index) => <div className={s.summaryCard} key={label}><span aria-hidden="true" className={s.summaryIllus} style={{ backgroundPosition: `${(index % 3) * 50}% center` }}/><span><small>{label}</small><strong>{value}</strong></span></div>)}</section>
      <section className={s.overviewTips} aria-label="สรุปสถานการณ์"><div className={s.overviewHead}><div className={s.overviewTitleWrap}><h2>ภาพรวมที่ควรดู</h2><span className={s.overviewCountBadge}>{(appointments.some(a => previewDay(a) < previewToday && a.status !== 'บันทึกแล้ว' && a.status !== 'ยกเลิก') ? 1 : 0) + 1 + (!contacted ? 1 : 0) + low.length + expiring.length + appointments.filter(a => previewDay(a) === previewToday && a.status === 'รอประเมิน').length + appointments.filter(a => a.day > 5 && a.status === 'ยืนยันแล้ว').length}</span></div><div className={s.buttons}><button className={s.iconButtonSm} aria-label="ภาพรวมก่อนหน้า" disabled={overviewEdges.start} onClick={() => slideOverview(-1)}><ChevronLeft size={20}/></button><button className={s.iconButtonSm} aria-label="ภาพรวมถัดไป" disabled={overviewEdges.end} onClick={() => slideOverview(1)}><ChevronRight size={20}/></button></div></div><div className={s.overviewTrack} ref={overviewRef} onScroll={syncOverview} tabIndex={0} aria-label="รายการภาพรวม เลื่อนซ้ายขวา">
      {appointments.some(a => previewDay(a) < previewToday && a.status !== 'บันทึกแล้ว' && a.status !== 'ยกเลิก') && <article className={`${s.overviewTip} ${s.tipAmber}`}><span className={s.summaryIllus} aria-hidden="true" style={{ backgroundPosition: '50% center' }}/><div><h3>นัดหมายค้าง {appointments.filter(a => previewDay(a) < previewToday && a.status !== 'บันทึกแล้ว' && a.status !== 'ยกเลิก').length} รายการ</h3><p>เลยวันนัดและยังไม่เสร็จสิ้น เปิดรายการเพื่อดำเนินการต่อ</p><button onClick={() => { go('appointments'); setHideCompleted(true); setHideCancelled(true); setAppointmentScope('overdue'); }}>ดูนัดหมายค้าง<ChevronRight size={18}/></button></div></article>}
      <article className={s.overviewTip}><Illus kind={0}/><div><h3>นัดหมายวันนี้ {appointments.filter(a => previewDay(a) === previewToday && a.status !== 'ยกเลิก').length} รายการ</h3><p>ตรวจเวลาและข้อมูลคุณแม่ เตรียมพร้อมก่อนให้บริการ</p><button onClick={() => { go('appointments'); setAppointmentScope('today'); }}>ดูนัดหมายวันนี้<ChevronRight size={18}/></button></div></article>
      {!contacted && <article className={`${s.overviewTip} ${s.tipAmber}`}><Illus kind={2}/><div><h3>รายงานรอติดตาม</h3><p>คุณแม่ H08 แจ้งผิวแดงหลังประคบ รอเจ้าหน้าที่ติดต่อกลับ</p><button onClick={() => setModal('report')}>ติดตามรายงาน<ChevronRight size={18}/></button></div></article>}
      {low.map(m => <article key={`low-${m.name}`} data-overview-key={`low-${m.name}`} className={s.overviewTip}><MedicinePhoto medicine={m}/><div><h3>ยาใกล้หมด</h3><p>{m.name} เหลือ {m.quantity} {m.unit} ตรวจสต็อกเพื่อเตรียมเติมยา</p><button onClick={() => { go('inventory'); setSearch(m.name); setFilter('ใกล้หมด'); }}>ตรวจสต็อกยา<ChevronRight size={18}/></button></div></article>)}
      {expiring.map(m => <article key={`expiry-${m.name}`} data-overview-key={`expiry-${m.name}`} className={`${s.overviewTip} ${s.tipAmber}`}><MedicinePhoto medicine={m}/><div><h3>ยาใกล้หมดอายุ</h3><p>{m.name} เหลือ {m.days} วัน · Lot {m.lot}</p><button onClick={() => { go('inventory'); setSearch(m.name); setFilter('ใกล้หมดอายุ'); }}>ตรวจวันหมดอายุ<ChevronRight size={18}/></button></div></article>)}
      {appointments.filter(a => previewDay(a) === previewToday && a.status === 'รอประเมิน').map(a => <article key={`assess-${a.id}`} className={s.overviewTip}><Illus kind={2}/><div><h3>คุณแม่ {a.name || a.id} รอประเมิน</h3><p>นัด {a.time} น. ตรวจข้อมูลคัดกรองก่อนเริ่มให้บริการ</p><button onClick={() => { setSelected(a.id); go('case'); }}>เปิดข้อมูลเคส<ChevronRight size={18}/></button></div></article>)}
      {appointments.filter(a => a.day > 5 && a.status === 'ยืนยันแล้ว').map(a => <article key={`next-${a.id}`} className={s.overviewTip}><Illus kind={a.illustration}/><div><h3>นัดถัดไป · คุณแม่ {a.name || a.id}</h3><p>{a.day} พ.ย. {a.time} น. · {a.services}</p><button onClick={() => openCase(a)}>เตรียมข้อมูลนัด<ChevronRight size={18}/></button></div></article>)}
      </div></section>

      <section className={s.queueTable} aria-label="นัดหมายในภาพรวม"><div className={s.overviewHead}><div className={s.overviewTitleWrap}><h2>นัดหมาย</h2><span className={s.overviewCountBadge}>{dashboardAppointments.length}</span></div><button className={s.link} onClick={() => { go('appointments'); setHideCompleted(false); setHideCancelled(false); }}>ดูทั้งหมด <ChevronRight size={16}/></button></div><div className={s.tableCard}>{AppointmentTable({ compact: true })}</div><div className={s.paginationFooter}><p className={s.tableCount}>แสดง {dashboardAppointments.length ? ((activeDashboardPage - 1) * dashboardPageSize + 1) : 0}–{Math.min(activeDashboardPage * dashboardPageSize, dashboardAppointments.length)} จาก {dashboardAppointments.length} นัดหมาย</p><div className={s.paginationControls}><div className={s.pageSizeLabel}><span>รายการต่อหน้า</span><CustomSelect ariaLabel="จำนวนรายการต่อหน้า" value={String(dashboardPageSize)} onChange={changeDashboardPageSize} options={[6, 8, 12].map(x => ({ value: String(x), label: String(x) }))}/></div><nav className={s.pagination} aria-label="หน้าตารางนัดหมาย"><button className={s.iconButtonSm} aria-label="นัดหมายหน้าก่อนหน้า" disabled={activeDashboardPage === 1} onClick={() => setDashboardPage(activeDashboardPage - 1)}><ChevronLeft size={18}/></button>{Array.from({ length: dashboardPageCount }, (_, i) => <button key={i} aria-label={`นัดหมายหน้า ${i + 1}`} aria-current={activeDashboardPage === i + 1 ? 'page' : undefined} className={activeDashboardPage === i + 1 ? s.paginationActive : ''} onClick={() => setDashboardPage(i + 1)}>{i + 1}</button>)}<button className={s.iconButtonSm} aria-label="นัดหมายหน้าถัดไป" disabled={activeDashboardPage === dashboardPageCount} onClick={() => setDashboardPage(activeDashboardPage + 1)}><ChevronRight size={18}/></button></nav></div></div></section>
    </div><AppointmentAgenda appointments={appointments} selectedDate={selectedDate} onSelectDate={setSelectedDate} monthIdx={monthIdx} year={year} onPrevMonth={prevMonth} onNextMonth={nextMonth} onGoToday={goToday} onOpen={openCase}/></div></>}
    {view === 'appointments' && <section><div className={s.toolbar}><div className={s.search}><Search size={18} aria-hidden="true"/><input placeholder="ค้นหาคุณแม่ บริการ หรือแพทย์" value={search} onChange={e => setSearch(e.target.value)} aria-label="ค้นหา"/>{search && <button type="button" className={s.searchClear} onClick={() => setSearch('')} aria-label="ล้างการค้นหา"><X size={12}/></button>}</div><div className={s.appointmentFilters}><Checkbox checked={hideCompleted} onChange={c => { setHideCompleted(c); setFilter('ทั้งหมด'); }}>ซ่อนที่เสร็จสิ้น</Checkbox><Checkbox checked={hideCancelled} onChange={c => { setHideCancelled(c); setFilter('ทั้งหมด'); }}>ซ่อนที่ยกเลิก</Checkbox><CustomSelect ariaLabel="กรองสถานะนัดหมาย" value={filter} onChange={setFilter} options={['ทั้งหมด', 'รอยืนยันนัด', 'ยืนยันแล้ว', 'รอประเมิน', ...(!hideCompleted ? ['บันทึกแล้ว'] : []), ...(!hideCancelled ? ['ยกเลิก'] : [])].map(x => ({ value: x, label: x === 'บันทึกแล้ว' ? 'เสร็จสิ้น' : x }))}/></div></div>{appointmentScope !== 'all' && <div className={s.scopeNotice}><span>{appointmentScope === 'overdue' ? 'กำลังแสดงนัดหมายค้าง' : 'กำลังแสดงนัดหมายวันนี้'}</span><button className={s.link} onClick={() => setAppointmentScope('all')}>แสดงทุกวัน<X size={16}/></button></div>}<div className={s.tableCard}>{AppointmentRecords({ history: false })}</div></section>}
    {view === 'case' && <>{CaseHeader()}<div className={s.twoColumns}><section className={s.card}><h2>ข้อมูลก่อนรับบริการ</h2>{patient.screening !== 'ผ่าน' && <div className={s.clinicalNotice}><CircleAlert size={20}/><div><strong>{patient.id === 'B07' ? 'น้ำคาวปลา: ไม่แน่ใจ' : 'ต้องประเมินก่อนรับบริการ'}</strong><p>{patient.id === 'B07' ? 'คุณแม่แจ้งว่า “สีเข้มขึ้นตั้งแต่เมื่อวาน”' : 'นัดประเมินครั้งแรก ข้อมูลคัดกรองต้องตรวจยืนยัน'}</p>{patient.id === 'B07' && <p>แผลผ่าคลอดยังมีส่วนที่ไม่หายสนิท</p>}</div></div>}<dl className={s.details}>{[['เบอร์ติดต่อ', patient.phone || 'ยังไม่ระบุเบอร์'], ['การคลอด', patient.birth], ['ระยะหลังคลอด', `${patient.postpartum} วัน`], ['บริการที่นัด', patient.services], ['แพทย์ผู้ดูแล', patient.doctor || 'ยังไม่ระบุแพทย์'], ['โรคประจำตัว', reported(patient.conditions)], ['ยาที่ใช้อยู่', reported(patient.medicines)], ['ประวัติแพ้สมุนไพร', reported(patient.herbAllergy)], ['สิทธิ์การรักษา', patient.rights ? 'เจ้าหน้าที่ตรวจแล้ว' : 'ยังไม่ตรวจ — ต้องตรวจโดยเจ้าหน้าที่']].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><div className={s.actions}>{patient.status === 'รอยืนยันนัด' && <>{!patient.doctor && <ProviderSelect className={s.doctorPick} ariaLabel="แพทย์ผู้ดูแล" value={confirmDoctor} onChange={e => setConfirmDoctor(e.target.value)} options={[{ value: '', label: 'เลือกแพทย์ผู้ดูแล' }, ...doctors.map(name => ({ value: name, label: name }))]}/>}<button className={s.primary} disabled={!patient.doctor && !confirmDoctor} onClick={confirmAppointment}>ยืนยันนัด</button></>}<button className={s.primary} onClick={() => go('treatment')}>บันทึกการประเมินและการรักษา <ChevronRight size={16}/></button></div></section><section className={s.card}><h2>ประวัติรับบริการ</h2><div className={s.history}>{motherHistory ? motherHistory.map(([day, text]) => <div key={day + text}><strong>{thaiDay.format(new Date(`${day}T12:00:00+07:00`))}</strong><p>{text}</p></div>) : <><div><strong>4 พฤศจิกายน</strong><p>เช็กอิน · {patient.screening}</p></div><div><strong>1 พฤศจิกายน</strong><p>{patient.visit > 1 ? 'รับบริการครั้งก่อน' : 'ส่งคำขอนัดประเมิน'}</p></div><div><strong>28 ตุลาคม</strong><p>คัดกรองครั้งแรก</p></div></>}</div><h3>ความปวดครั้งก่อน</h3>{patient.visit > 1 ? <><div className={s.pain}><span>ก่อน</span><meter min={0} max={10} value={6}/><strong>6</strong></div><div className={s.pain}><span>หลัง</span><meter min={0} max={10} value={4}/><strong>4</strong></div></> : <p>ยังไม่มีประวัติรับบริการ</p>}</section></div></>}
    {view === 'treatment' && <>{CaseHeader()}<section className={s.card}><div className={s.checkRow}><Checkbox checked={draft.rights} onChange={v => updateDraft({ rights: v })}><strong>ตรวจสอบสิทธิ์ผู้รับบริการแล้ว</strong> <span className={s.checkNote}>ระบบไม่ได้ตรวจสิทธิ์แทนเจ้าหน้าที่</span></Checkbox></div><div className={s.twoColumns}><div><h2>ตัดสินรายหัตถการ</h2>{services.slice(0, 4).map(x => <div className={s.decision} key={x}><strong>{x}</strong><div className={s.segment}>{['ทำ', 'ไม่ทำ'].map(v => <button key={v} aria-pressed={draft.decisions[x] === v} className={draft.decisions[x] === v ? s.selectedSegment : ''} onClick={() => updateDraft({ decisions: { ...draft.decisions, [x]: v } })}>{v}</button>)}</div></div>)}<label>เหตุผลประกอบการตัดสินใจ<textarea value={draft.reason} onChange={e => updateDraft({ reason: e.target.value })} placeholder="ระบุเหตุผลเมื่อไม่ทำหัตถการ"/></label><div className={s.fields}><label>ความปวดก่อน (0–10)<input type="number" min={0} max={10} value={draft.before} onChange={e => updateDraft({ before: Number(e.target.value) })}/></label><label>ความปวดหลัง (0–10)<input type="number" min={0} max={10} value={draft.after} onChange={e => updateDraft({ after: Number(e.target.value) })}/></label></div><label>ICD-10-TM<input value={draft.icd} onChange={e => updateDraft({ icd: e.target.value })} placeholder="แพทย์ระบุรหัสจากรายการที่ตรวจสอบแล้ว"/></label></div><div><h2>กิจกรรมที่ทำจริง</h2>{activities.map(x => <div className={s.checkRow} key={x}><Checkbox checked={draft.done.includes(x)} onChange={v => updateDraft({ done: v ? [...draft.done, x] : draft.done.filter(z => z !== x) })}>{x}</Checkbox></div>)}{draft.done.length < 5 && <p className={s.warning}>บันทึกไม่ครบชุด 5 กิจกรรม — ยังบันทึกได้</p>}<h3>คอร์สอบสมุนไพร</h3><div className={s.fields}><label>วันเริ่ม<CustomDateTimePicker withTime={false} value={courseStart} onChange={setCourseStart} placeholder="เลือกวันเริ่มคอร์ส"/></label><label>จำนวนวัน<input type="number" min={0} max={7} value={draft.course} onChange={e => updateDraft({ course: Number(e.target.value) })}/></label></div>{draft.course > 5 - patient.visit && <p className={s.warning}>คอร์สยาวกว่าสิทธิ์ที่เหลือ {5 - patient.visit} ครั้ง — แพทย์ต้องพิจารณา</p>}<label>นัดครั้งถัดไป<CustomDateTimePicker withTime={true} value={draft.next} onChange={v => updateDraft({ next: v })} placeholder="เลือกวันและเวลานัดหมาย"/></label></div></div><div className={s.actions}><span>{!draft.rights ? 'ตรวจสิทธิ์ก่อนบันทึก' : !services.slice(0, 4).every(x => draft.decisions[x]) ? 'เลือกทำหรือไม่ทำให้ครบ' : 'พร้อมบันทึก'}</span><button className={s.primary} disabled={!draft.rights || !services.slice(0, 4).every(x => draft.decisions[x]) || (Object.values(draft.decisions).includes('ไม่ทำ') && !draft.reason.trim())} onClick={() => { updateAppointment({ status: 'บันทึกแล้ว', rights: true }); notify('บันทึกการรักษาแล้ว'); go('case'); }}><Check size={17}/> บันทึกการรักษา</button></div></section></>}
    {view === 'prescribe' && <>{CaseHeader()}<div className={s.prescriptionLayout}><section className={s.card}><div className={s.cardHead}><h2>รายการยา</h2><span className={s.secondary}>{medicines.length} รายการ</span></div><label className={s.search}><Search size={17}/><input placeholder="ค้นหายา" value={medicineSearch} onChange={e => setMedicineSearch(e.target.value)}/></label><div className={s.medList}>{medicines.filter(m => m.name.includes(medicineSearch)).map(m => <button className={medicine === m.name ? s.selectedMed : ''} key={m.name} onClick={() => setMedicine(m.name)} aria-pressed={medicine === m.name}><MedicinePhoto medicine={m}/><span className={s.medListText}><strong>{m.name}</strong><small>คงเหลือ {m.quantity} {m.unit}</small></span><ChevronRight size={16}/></button>)}</div></section><section className={s.card}><div className={`${s.cardHead} ${s.selectedMedicineHead}`}><MedicinePhoto medicine={pickedMed}/><div><h2>{medicine}</h2><span className={s.secondary}>คงเหลือ {pickedMed.quantity} {pickedMed.unit} · Lot {pickedMed.lot || "—"}</span></div></div>{contraindicated && <div className={s.clinicalNotice}><CircleAlert size={20}/><div><strong className={s.danger}>ห้ามใช้กับผู้รับบริการผ่าคลอด</strong><p>อ้างอิง UX brief ตารางที่ 4.1 หน้า 81–89 ต้องตรวจคู่มือก่อนสั่งจริง</p><button className={s.link} onClick={() => setMedicine('ยาเลือดงาม')}>เปลี่ยนยา</button></div></div>}<label>ขนาด<input value={dose} onChange={e => setDose(e.target.value)} placeholder="ระบุขนาดตามแพทย์สั่ง"/></label><label>วิธีรับประทาน<input value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="ระบุวิธีและเวลารับประทาน"/></label><div className={s.fields}><label>จำนวนวัน<input type="number" min={1} value={duration} onChange={e => setDuration(Number(e.target.value))}/></label><label>จำนวนจ่าย ({pickedMed.unit})<input type="number" min={1} value={amount} onChange={e => setAmount(Number(e.target.value))}/></label></div>{pickedMed.quantity < amount && <p className={s.warning}>จำนวนยาในคลังไม่เพียงพอ</p>}<div className={s.actions}><button className={s.primary} disabled={contraindicated || !dose.trim() || !frequency.trim() || !Number.isSafeInteger(duration) || duration < 1 || !Number.isSafeInteger(amount) || amount < 1 || amount > pickedMed.quantity} onClick={() => { if(!savePrescription({patient:patient.name||patient.id,medicine,dose,frequency,duration,amount}))return; setStockHistory(old => [`จ่าย ${medicine} ${amount} ${pickedMed.unit} · คุณแม่ ${selected}`, ...old]); notify('บันทึกใบสั่งและปรับคลังในพรีวิวแล้ว'); }}>บันทึกใบสั่ง</button></div></section></div></>}
    {view === 'schedule' && <ScheduleCalendar appointments={appointments} onChange={setAppointments} createRequest={calendarCreateRequest}/>}
    {view === 'inventory' && <><div className={s.toolbar}><div className={s.search}><Search size={18} aria-hidden="true"/><input placeholder="ค้นหาชื่อยา หรือ Lot" value={search} onChange={e => setSearch(e.target.value)} aria-label="ค้นหาชื่อยา หรือ Lot"/>{search && <button type="button" className={s.searchClear} onClick={() => setSearch('')} aria-label="ล้างการค้นหา" title="ล้างการค้นหา"><X size={12}/></button>}</div><CustomSelect ariaLabel="สถานะยา" value={filter} onChange={setFilter} options={['ทั้งหมด', 'ปกติ', 'ใกล้หมด', 'หมด', 'ใกล้หมดอายุ']}/></div>{!tipDismissed && (low.length > 0 || expiring.length > 0) && <div className={s.tip}><CircleAlert size={17}/><span>{low.length > 0 ? `${low.length} รายการใกล้หมด` : ''}{low.length > 0 && expiring.length > 0 ? ' · ' : ''}{expiring.length > 0 ? `${expiring.length} รายการใกล้หมดอายุ` : ''}</span><button type="button" className={s.tipClose} onClick={() => setTipDismissed(true)} aria-label="ปิดการแจ้งเตือน" title="ปิด"><X size={15}/></button></div>}<div className={s.tableCard}><TableScroll><table className={s.inventoryTable}><colgroup>{['24%', undefined, 96, 88, 144, 128, 140, 80].map((width, i) => <col key={i} style={{ width }}/>)}</colgroup><thead><tr>{([['name', 'ยา'], ['benefits', 'สรรพคุณ'], ['quantity', 'คงเหลือ'], ['lot', 'Lot'], ['expiry', 'วันหมดอายุ'], ['days', 'เหลืออีก (วัน)'], ['status', 'สถานะ']] as const).map(([k, label]) => {
                if (k === 'benefits')
                    return <th key={k}>สรรพคุณ</th>;
                const active = sortKey === k;
                return <th key={k} className={s.thSortable} onClick={() => toggleSort(k)} title={`คลิกเพื่อจัดเรียงตาม ${label}`}><span className={s.thSortContent}><span>{label}</span>{active ? (sortDir === 'asc' ? <ArrowUp size={14} className={s.sortIconActive} aria-label="เรียงจากน้อยไปมาก"/> : <ArrowDown size={14} className={s.sortIconActive} aria-label="เรียงจากมากไปน้อย"/>) : <ArrowUpDown size={13} className={s.sortIconMuted} aria-hidden="true"/>}</span></th>;
            })}<th><span className={s.srOnly}>แก้ไขยา</span></th></tr></thead><tbody>{sortedMedicines.filter(m => { const matchSearch = (m.name + ' ' + m.lot).includes(search); const matchFilter = filter === 'ทั้งหมด' || (filter === 'หมด' && m.quantity === 0) || (filter === 'ปกติ' && m.quantity > LOW_STOCK_LIMIT && (!m.expiry || m.days >= 60)) || (filter === 'ใกล้หมด' && m.quantity > 0 && m.quantity <= LOW_STOCK_LIMIT) || (filter === 'ใกล้หมดอายุ' && m.expiry && m.days < 60); return matchSearch && matchFilter; }).map(m => { const status = filter === 'ใกล้หมดอายุ' && m.expiry && m.days < 60 ? 'ใกล้หมดอายุ' : m.quantity <= LOW_STOCK_LIMIT ? 'ใกล้หมด' : m.expiry && m.days < 60 ? 'ใกล้หมดอายุ' : 'ปกติ'; return <tr key={m.name}><td><button className={s.nameButton} title="ดูรูปและปรับข้อมูลยา" onClick={() => editMedicine(m)}><MedicinePhoto medicine={m}/><strong>{m.name}</strong></button></td><td className={s.medicineBenefits} title={m.benefits || undefined}><span>{m.benefits || '—'}</span></td><td>{m.quantity} {m.unit}</td><td>{m.lot || '—'}</td><td className={s.nowrap}>{m.expiry ? m.expiry.split('-').reverse().map((x, i) => i === 2 ? Number(x) + 543 : x).join('/') : '—'}</td><td>{!m.expiry ? '—' : <span className={m.days < 60 ? s.daysWarning : s.daysNormal}>{m.days} วัน</span>}</td><td><Badge good={status === 'ปกติ'}>{m.quantity === 0 ? 'หมด' : status}</Badge></td><td><button className={s.iconButtonSm} onClick={() => editMedicine(m)} aria-label={`แก้ไข${m.name}`} title={`แก้ไข${m.name}`}><ChevronRight size={20}/></button></td></tr>; })}</tbody></table></TableScroll></div></>}
    {view === 'reviews' && <ReviewsPanel onContacted={setContacted}/>}

    </main></div>
    {notice && <div role="status" className={s.toast}><Check size={18}/>{notice}</div>}
    {modal && <Modal title={modal === 'newAppointment' ? 'เพิ่มนัดหมาย' : modal === 'newMedicine' ? 'เพิ่มยาใหม่' : modal === 'editMedicine' ? 'แก้ไขข้อมูลยา' : modal === 'stock' ? stockMode : modal === 'history' ? 'ประวัติคลังยา' : modal === 'leave' ? 'เพิ่มวันหยุด / วันลา' : 'รายงานหลังรับบริการ'} onClose={() => setModal(null)}>
    {modal === 'newAppointment' && <form onSubmit={e => { e.preventDefault(); const name = appointmentName.trim(); const settings=readCalendarSettings(); if(!supportsServices(appointmentDoctor,appointmentServices.join(', '),settings?.capabilities||{})){notify('แพทย์ไม่ให้บริการที่เลือก กรุณาเลือกแพทย์อื่น');return;} const date=`2026-11-${String(appointmentDay).padStart(2,'0')}`; const end=new Date(Date.parse(`${date}T${appointmentTime}:00+07:00`)+3600000); const parts=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(end).split(' '); const conflict=appointmentConflict(appointments,settings?.leaves||[],appointmentDoctor,date,appointmentTime,parts[1],undefined,parts[0]); if(conflict){notify(conflict);return;} const id = appointments.some(a => a.id === name) ? name + '-' + Date.now() : name; const source = appointments.find(a => (a.name || a.id) === name); setAppointments(old => [...old, { id, name, phone: appointmentPhone.trim(), day: appointmentDay, time: appointmentTime, services: appointmentServices.join(', '), birth: source?.birth || appointmentBirth, postpartum: source?.postpartum || appointmentPostpartum, visit: source?.visit || 1, rights: false, status: 'รอยืนยันนัด', screening: 'ให้ประเมิน', illustration: appointmentServices[0] === 'นัดประเมิน' ? 2 : appointmentServices[0] === 'ประคบสมุนไพร' ? 1 : 0, doctor: appointmentDoctor }]); setModal(null); setSearch(''); setFilter('ทั้งหมด'); notify('เพิ่มนัดหมายแล้ว'); }}><label>คุณแม่<input required value={appointmentName} onChange={e => setAppointmentName(e.target.value)} placeholder="ชื่อหรือรหัสคุณแม่ เช่น A13"/></label><label>เบอร์ติดต่อ<input required type="tel" autoComplete="tel" value={appointmentPhone} onChange={e => setAppointmentPhone(e.target.value)} placeholder="เช่น 081 234 5678"/></label><div className={s.fields}><label>วันที่<span className={s.selectWrap}><ProviderSelect value={appointmentDay} onChange={e => setAppointmentDay(Number(e.target.value))}>{Array.from({ length: 30 }, (_, i) => <option key={i} value={i + 1}>{i + 1} พฤศจิกายน 2569</option>)}</ProviderSelect><ChevronDown size={16}/></span></label><label>เวลา<input required type="time" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)}/></label></div><fieldset className={s.appointmentServices}><legend>บริการที่นัด</legend><div className={s.serviceChips}>{Array.from(new Set(['นัดประเมิน', ...services])).map(x => { const checked = appointmentServices.includes(x); return <div className={`${s.serviceChip} ${checked ? s.serviceChipActive : ''}`} key={x}><Checkbox checked={checked} onChange={c => setAppointmentServices(old => c ? [...old, x] : old.filter(y => y !== x))}><span>{x}</span></Checkbox></div>; })}</div></fieldset><label>แพทย์ผู้ดูแล<span className={s.selectWrap}><ProviderSelect value={appointmentDoctor} onChange={e => setAppointmentDoctor(e.target.value)}>{doctors.map(name => <option key={name}>{name}</option>)}</ProviderSelect><ChevronDown size={16}/></span></label><div className={s.fields}><label>การคลอด<span className={s.selectWrap}><ProviderSelect value={appointmentBirth} onChange={e => setAppointmentBirth(e.target.value)}><option>คลอดทางช่องคลอด</option><option>ผ่าคลอด</option></ProviderSelect><ChevronDown size={16}/></span></label><label>หลังคลอด (วัน)<input type="number" required min={0} value={appointmentPostpartum} onChange={e => setAppointmentPostpartum(Number(e.target.value))}/></label></div><div className={s.actions}><button type="button" onClick={() => setModal(null)}>ยกเลิก</button><button className={s.primary} type="submit" disabled={!appointmentName.trim() || !appointmentTime || !appointmentServices.length || !appointmentDoctor.trim() || !Number.isSafeInteger(appointmentPostpartum) || appointmentPostpartum < 0}>เพิ่มนัดหมาย</button></div></form>}
    {modal === 'report' && <><Badge good={contacted}>{contacted ? 'ติดต่อแล้ว' : 'ยังไม่ได้ติดต่อ'}</Badge><h3>คุณแม่ H08 · ผิวแดงหลังประคบ</h3><p>รายงานวันที่ 4 พฤศจิกายน 2569 เวลา 18:20 น.</p><p>“ผิวบริเวณที่ประคบแดงหลังกลับบ้าน อยากให้เจ้าหน้าที่ติดต่อกลับ”</p><p className={s.secondary}>รายงานจากผู้รับบริการ ต้องติดตามและตรวจยืนยัน ไม่ใช่การวินิจฉัย</p><div className={s.actions}><button className={s.primary} onClick={() => { setContacted(!contacted); setModal(null); notify(contacted ? 'เปลี่ยนเป็นยังไม่ได้ติดต่อ' : 'บันทึกสถานะติดต่อแล้ว'); }}>{contacted ? 'เปลี่ยนเป็นยังไม่ได้ติดต่อ' : 'ทำเครื่องหมายติดต่อแล้ว'}</button></div></>}
    {modal === 'history' && <>{stockHistory.length ? stockHistory.map((x, i) => <div className={`${s.historyRow} ${s.medicineInline}`} key={i}>{medicines.find(m => x.includes(m.name)) && <MedicinePhoto medicine={medicines.find(m => x.includes(m.name))!}/>}<span>{x}</span></div>) : <p>ยังไม่มีการเปลี่ยนแปลงคลังในพรีวิวรอบนี้</p>}</>}
    {modal === 'leave' && <><label>วันหยุด<span className={s.dateWrap}><input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)}/><CalendarDays size={17} aria-hidden="true"/></span></label><div className={s.actions}><button className={s.primary} onClick={() => { setLeaves([...leaves, leaveDate]); setModal(null); notify('เพิ่มวันหยุดแล้ว'); }}>เพิ่มวันหยุด</button></div></>}
    {(modal === 'newMedicine' || modal === 'editMedicine') && <><PhotoEditor src={newPhoto || medicineImage({ unit: newUnit })} onChange={setNewPhoto}/><label>ชื่อยา<input value={newName} onChange={e => setNewName(e.target.value)}/></label><label>สรรพคุณ<textarea value={newBenefits} onChange={e => setNewBenefits(e.target.value)} placeholder="ระบุสรรพคุณตามฉลากหรือข้อมูลยาที่ตรวจสอบแล้ว"/></label><div className={s.fields}><label>หน่วย<span className={s.selectWrap}><ProviderSelect value={newUnit} onChange={e => setNewUnit(e.target.value)}>{['ซอง', 'ขวด', 'ห่อ', 'กล่อง', 'เม็ด'].map(x => <option key={x}>{x}</option>)}</ProviderSelect><ChevronDown size={16}/></span></label></div>{medicines.some(m => m.name === newName.trim() && m.name !== editingMedicine) && <p className={s.warning}>มีชื่อนี้ในคลังแล้ว</p>}<div className={s.actions}><button className={s.primary} disabled={!newName.trim() || medicines.some(m => m.name === newName.trim() && m.name !== editingMedicine)} onClick={() => {
                    if (modal === 'editMedicine') {
                        setMedicines(old => old.map(m => m.name === editingMedicine ? { ...m, name: newName.trim(), unit: newUnit, threshold: LOW_STOCK_LIMIT, benefits: newBenefits.trim(), image: newPhoto || medicineImage({ unit: newUnit }) } : m));
                        if (medicine === editingMedicine)
                            setMedicine(newName.trim());
                        if (stockName === editingMedicine)
                            setStockName(newName.trim());
                    }
                    else {
                        setMedicines(old => [...old, { name: newName.trim(), unit: newUnit, quantity: 0, benefits: newBenefits.trim(), threshold: LOW_STOCK_LIMIT, lot: '', expiry: '', days: 0, image: newPhoto || medicineImage({ unit: newUnit }) }]);
                    }
                    setSearch('');
                    setFilter('ทั้งหมด');
                    setModal(null);
                    notify(modal === 'editMedicine' ? 'แก้ไขข้อมูลยาแล้ว' : 'เพิ่มยาใหม่แล้ว');
                }}>{modal === 'editMedicine' ? 'บันทึกการแก้ไข' : 'เพิ่มยา'}</button></div></>}
    {modal === 'stock' && <><PhotoEditor src={stockPhoto || medicineImage(stockMedicine)} onChange={setStockPhoto}/><label>ยา<span className={s.selectWrap}><ProviderSelect value={stockName} onChange={e => { setStockName(e.target.value); setStockPhoto(null); }}>{medicines.map(m => <option key={m.name}>{m.name}</option>)}</ProviderSelect><ChevronDown size={16} aria-hidden="true"/></span></label><label>{stockMode === 'รับยาเข้า' ? 'จำนวนรับเข้า' : 'ยอดใหม่'}<input type="number" min={stockMode === 'รับยาเข้า' ? 1 : 0} value={stockAmount} onChange={e => setStockAmount(Number(e.target.value))}/></label>{stockMode === 'รับยาเข้า' ? <div className={s.fields}><label>Lot<input value={stockLot} onChange={e => setStockLot(e.target.value)}/></label><label>วันหมดอายุ<span className={s.dateWrap}><input type="date" value={stockExpiry} onChange={e => setStockExpiry(e.target.value)}/><CalendarDays size={17} aria-hidden="true"/></span></label></div> : <label>เหตุผล<textarea value={stockReason} onChange={e => setStockReason(e.target.value)}/></label>}<div className={s.actions}><button className={s.primary} disabled={!Number.isSafeInteger(stockAmount) || stockAmount < 0 || (stockMode === 'รับยาเข้า' ? (stockAmount < 1 || !stockLot.trim() || !stockExpiry) : !stockReason.trim())} onClick={() => { setMedicines(old => old.map(m => m.name === stockName ? { ...m, image: stockPhoto || m.image, quantity: stockMode === 'รับยาเข้า' ? m.quantity + stockAmount : stockAmount, ...(stockMode === 'รับยาเข้า' ? { lot: stockLot, expiry: stockExpiry, days: Math.ceil((Date.parse(stockExpiry) - Date.parse('2026-11-05')) / 86400000) } : {}) } : m)); setStockHistory(old => [`${stockMode} ${stockName} ${stockAmount} · ${stockMode === 'รับยาเข้า' ? stockLot : stockReason}`, ...old]); setModal(null); notify('ปรับคลังแล้ว'); }}>บันทึก</button></div></>}
    </Modal>}
  </div>;
}
