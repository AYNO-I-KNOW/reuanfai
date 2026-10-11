'use client';
import ProviderSelect from './ProviderSelect';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ChevronDown, X, Camera, Check, CalendarDays, Clock3 } from 'lucide-react';
import { doctors, services, type Appointment } from './mock-data';
import s from './calendar.module.css';
import { calendarColumns, bangkokClock, overlaps } from './calendar-logic';
import {appointmentConflict,supportsServices,validCalendarSettings} from './appointment-validation';
const initialClinicians = [...doctors, 'พท. อรทัย สุขสวัสดิ์'];
const colors = ['#e8dffc', '#dfd5f5', '#eee6ff', '#d8cbed'];
const palette = [{ color: '#e8dffc', name: 'ม่วง' }, { color: '#cfe5fc', name: 'ฟ้า' }, { color: '#d3ecdf', name: 'เขียว' }, { color: '#fbe7bc', name: 'เหลือง' }, { color: '#f8dacb', name: 'ส้ม' }, { color: '#f4d7e5', name: 'ชมพู' }, { color: '#dae9ea', name: 'เขียวอมฟ้า' }, { color: '#e3e4ec', name: 'เทา' }, { color: '#d7ddfa', name: 'คราม' }, { color: '#f5d0d0', name: 'แดง' }, { color: '#e0edc9', name: 'เขียวมะนาว' }, { color: '#ead9cc', name: 'น้ำตาล' }];
const minutes = (v: string) => Number(v.split(':')[0]) * 60 + Number(v.split(':')[1]);
const time = (v: number) => `${String(Math.floor(v / 60) % 24).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
const dateOf = (a: Appointment) => new Date((a.year ?? 2569) - 543, a.month ?? 10, a.day);
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const stamp = (date: string, t: string) => new Date(date + 'T' + t + ':00').getTime();
const bangkokNow = () => bangkokClock(new Date());
const mondayOf = (date: string) => { const d = new Date(date + 'T12:00:00'); return new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)); };
const finish = (a: Appointment) => a.endTime ? stamp(a.endDate || key(dateOf(a)), a.endTime) : stamp(key(dateOf(a)), a.time) + 3600000;
const endFields = (value: number) => { const d = new Date(value); return { endDate: key(d), endTime: time(d.getHours() * 60 + d.getMinutes()) }; };
type Draft = {
    kind: 'appointment' | 'leave';
    leaveIndex?: number;
    leaveReason: string;
    id?: string;
    name: string;
    phone: string;
    date: string;
    endDate: string;
    start: string;
    end: string;
    doctor: string;
    service: string;
};
export default function ScheduleCalendar({ appointments, onChange, createRequest }: {
    appointments: Appointment[];
    onChange: (a: Appointment[]) => void;
    createRequest: number;
}) {
    const [eventHint, setEventHint] = useState<{
        a: Appointment;
        x: number;
        y: number;
    } | null>(null);
    useEffect(() => { const hide = () => setEventHint(null); window.addEventListener('resize', hide); window.addEventListener('scroll', hide, true); return () => { window.removeEventListener('resize', hide); window.removeEventListener('scroll', hide, true); }; }, []);
    const [now, setNow] = useState<ReturnType<typeof bangkokNow> | null>(null);
    const followedDate = useRef<string | null>(null);
    const [clinicians, setClinicians] = useState(initialClinicians);
    const [photos, setPhotos] = useState<Record<string, string>>({});
    const [management, setManagement] = useState<'doctor' | null>(null);
    const [editingDoctor, setEditingDoctor] = useState<string | null>(null);
    const [doctorServices, setDoctorServices] = useState<string[]>([...services]);
    const [capabilities, setCapabilities] = useState<Record<string, string[]>>({});
    const [doctorName, setDoctorName] = useState('');
    const [doctorPhoto, setDoctorPhoto] = useState('');
    const [photoLoading, setPhotoLoading] = useState(false);
    const [doctorColor, setDoctorColor] = useState(palette[0].color);
    const [leaves, setLeaves] = useState<{
        doctor: string;
        from: string;
        to: string;
        reason: string;
    }[]>([]);
    const [settingsReady, setSettingsReady] = useState(false);
    const [actionHost, setActionHost] = useState<HTMLElement | null>(null);
    const autoScrollFrame = useRef<number | null>(null);
    const pointerPosition = useRef<{
        x: number;
        y: number;
        update: () => void;
    } | null>(null);
    const gesture = useRef<{
        id: string;
        mode: 'move' | 'resize';
        x: number;
        y: number;
        offset: number;
        date: string;
        active: boolean;
        continuation: boolean;
    } | null>(null);
    const suppressClick = useRef(false);
    const createGesture = useRef<{
        date: string;
        start: number;
        initialY: number;
        active: boolean;
    } | null>(null);
    const [createRange, setCreateRange] = useState<{
        date: string;
        start: number;
        end: number;
    } | null>(null);
    const createRangeRef = useRef<{
        date: string;
        start: number;
        end: number;
    } | null>(null);
    const landingRef = useRef<{
        date: string;
        start: number;
        end: number;
        conflict: string;
    } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [doctorColors, setDoctorColors] = useState<Record<string, string>>({});
    const [colorsReady, setColorsReady] = useState(false);
    const [headerHost, setHeaderHost] = useState<HTMLElement | null>(null);
    const [weekMotion, setWeekMotion] = useState({ direction: 1, revision: 0 });
    const [week, setWeek] = useState(new Date(2026, 10, 2));
    const [visible, setVisible] = useState(initialClinicians);
    const [draft, setDraft] = useState<Draft | null>(null);
    const [error, setError] = useState('');
    const [dragging, setDragging] = useState<string | null>(null);
    const [landing, setLanding] = useState<{
        date: string;
        start: number;
        end: number;
        conflict: string;
    } | null>(null);
    const [undo, setUndo] = useState<{
        appointments: Appointment[];
        leaves: typeof leaves;
    } | null>(null);
    const [feedbackClosing, setFeedbackClosing] = useState(false);
    const [feedbackPaused, setFeedbackPaused] = useState(false);
    const [modalClosing, setModalClosing] = useState(false);
    const modalCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [lastRequest, setLastRequest] = useState(createRequest);
    useEffect(() => { const update = () => setNow(bangkokNow()); update(); const timer = setInterval(update, 1000); return () => clearInterval(timer); }, []);
    const nowDate = now?.date;
    useEffect(() => {
        if (!nowDate)
            return;
        const previous = followedDate.current;
        if (previous && previous !== nowDate) {
            setWeek(old => key(old) === key(mondayOf(previous)) ? mondayOf(nowDate) : old);
            scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
        }
        followedDate.current = nowDate;
    }, [nowDate]);
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                const saved = JSON.parse(sessionStorage.getItem('provider-calendar-settings') || 'null');
                if (validCalendarSettings(saved)) {
                    setClinicians(saved.clinicians);
                    setVisible(saved.clinicians);
                    setPhotos(saved.photos || {});
                    setCapabilities(saved.capabilities || {});
                    setLeaves(saved.leaves || []);
                }
            }
            catch { }
            setSettingsReady(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);
    useEffect(() => {
        if (settingsReady) {
            try {
                sessionStorage.setItem('provider-calendar-settings', JSON.stringify({ clinicians, photos, capabilities, leaves }));
            }
            catch { }
        }
    }, [settingsReady, clinicians, photos, capabilities, leaves]);
    useEffect(() => { const timer = setTimeout(() => setActionHost(document.getElementById('calendar-management-actions')), 0); return () => clearTimeout(timer); }, []);
    function startAutoScroll() {
        if (autoScrollFrame.current !== null)
            return;
        const tick = () => {
            if (!gesture.current && !createGesture.current) {
                autoScrollFrame.current = null;
                return;
            }
            const p = pointerPosition.current, scroller = scrollRef.current;
            if (p && scroller && (gesture.current?.active || createGesture.current?.active)) {
                const box = scroller.getBoundingClientRect(), heading = scroller.querySelector('[class*="days"]')?.getBoundingClientRect();
                const top = heading?.bottom || box.top;
                const velocity = p.y > box.bottom - 40 ? Math.min(14, (p.y - box.bottom + 40) / 3) : p.y < top + 32 ? -Math.min(14, (top + 32 - p.y) / 3) : 0;
                if (velocity) {
                    const previous = scroller.scrollTop;
                    scroller.scrollTop += velocity;
                    if (previous !== scroller.scrollTop)
                        p.update();
                }
            }
            autoScrollFrame.current = requestAnimationFrame(tick);
        };
        autoScrollFrame.current = requestAnimationFrame(tick);
    }
    useEffect(() => () => {
        if (autoScrollFrame.current !== null)
            cancelAnimationFrame(autoScrollFrame.current);
    }, []);
    function startRange(e: React.PointerEvent<HTMLButtonElement>, d: Date) {
        if (e.button !== 0)
            return;
        const day = e.currentTarget.parentElement!.getBoundingClientRect();
        const start = Math.max(0, Math.min(1425, Math.floor((e.clientY - day.top) / 20) * 15));
        createGesture.current = { date: key(d), start, initialY: e.clientY, active: false };
        createRangeRef.current = { date: key(d), start, end: start + 60 };
        e.currentTarget.setPointerCapture(e.pointerId);
        startAutoScroll();
    }
    function updateRange(e: Pick<React.PointerEvent<HTMLButtonElement>, 'clientY' | 'clientX' | 'currentTarget' | 'preventDefault'>) {
        const g = createGesture.current;
        if (!g)
            return;
        const target = e.currentTarget, x = e.clientX, y = e.clientY;
        pointerPosition.current = { x, y, update: () => updateRange({ currentTarget: target, clientX: x, clientY: y, preventDefault: () => { } }) };
        if (!g.active && Math.abs(e.clientY - g.initialY) < 5)
            return;
        g.active = true;
        e.preventDefault();
        const day = e.currentTarget.parentElement!.getBoundingClientRect();
        const point = Math.max(0, Math.min(1440, Math.round((e.clientY - day.top) / 20) * 15));
        const range = { date: g.date, start: Math.min(g.start, point), end: Math.max(g.start + 15, point) };
        createRangeRef.current = range;
        setCreateRange(range);
    }
    function endRange(e: React.PointerEvent<HTMLButtonElement>, cancel = false) {
        const range = createRangeRef.current;
        if (range && !cancel) {
            open(new Date(range.date + 'T12:00:00'), time(range.start));
            const end = endFields(stamp(range.date, '00:00') + range.end * 60000);
            setDraft(old => old ? { ...old, end: end.endTime, endDate: end.endDate } : old);
        }
        createGesture.current = null;
        createRangeRef.current = null;
        setCreateRange(null);
        if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
    }
    function pointerStart(e: React.PointerEvent<HTMLElement>, a: Appointment, d: Date, mode: 'move' | 'resize') {
        if (e.button !== 0)
            return;
        e.stopPropagation();
        gesture.current = { id: a.id, mode, x: e.clientX, y: e.clientY, offset: mode === 'move' ? e.clientY - e.currentTarget.getBoundingClientRect().top + Math.max(0, (stamp(key(d), '00:00') - stamp(key(dateOf(a)), a.time)) / 60000) / 60 * 80 : 0, date: key(d), active: false, continuation: stamp(key(d), '00:00') > stamp(key(dateOf(a)), a.time) };
        e.currentTarget.setPointerCapture(e.pointerId);
        startAutoScroll();
    }
    function pointerMove(e: Pick<React.PointerEvent<HTMLElement>, 'clientY' | 'clientX' | 'currentTarget' | 'preventDefault'>) {
        const g = gesture.current;
        if (!g)
            return;
        const target = e.currentTarget, x = e.clientX, y = e.clientY;
        pointerPosition.current = { x, y, update: () => pointerMove({ currentTarget: target, clientX: x, clientY: y, preventDefault: () => { } }) };
        if (!g.active && Math.hypot(e.clientX - g.x, e.clientY - g.y) < 5)
            return;
        g.active = true;
        suppressClick.current = true;
        e.preventDefault();
        setDragging(g.id);
        const a = appointments.find(x => x.id === g.id);
        if (!a)
            return;
        const nodes = Array.from(scrollRef.current?.querySelectorAll<HTMLElement>('[data-calendar-date]') || []);
        const day = g.mode === 'resize' ? nodes.find(x => x.dataset.calendarDate === g.date) : nodes.find(x => { const r = x.getBoundingClientRect(); return e.clientX >= r.left && e.clientX < r.right; });
        if (!day)
            return;
        const box = day.getBoundingClientRect();
        let date = day.dataset.calendarDate!;
        const rawPoint = Math.round((e.clientY - box.top - g.offset) / 20) * 15;
        const point = g.mode === 'move' && g.continuation ? Math.min(1440, rawPoint) : Math.max(0, Math.min(1440, rawPoint));
        let start = g.mode === 'move' ? Math.min(1425, point) : Math.max(0, (stamp(key(dateOf(a)), a.time) - stamp(date, '00:00')) / 60000);
        if (g.mode === 'move' && start < 0) {
            const normalized = endFields(stamp(date, '00:00') + start * 60000);
            date = normalized.endDate;
            start = minutes(normalized.endTime);
        }
        const end = g.mode === 'move' ? start + (finish(a) - stamp(key(dateOf(a)), a.time)) / 60000 : Math.max(start + 15, point);
        const fields = endFields(stamp(date, '00:00') + end * 60000);
        const conflict = reason(a.doctor || '', g.mode === 'move' ? date : key(dateOf(a)), g.mode === 'move' ? time(start) : a.time, fields.endTime, a.id, fields.endDate);
        const next = { date, start, end, conflict };
        landingRef.current = next;
        setLanding(next);
    }
    function pointerEnd(e: React.PointerEvent<HTMLElement>, cancel = false) {
        const g = gesture.current, next = landingRef.current;
        if (g?.active && next && !cancel) {
            const d = new Date(next.date + 'T12:00:00');
            if (g.mode === 'move')
                move(g.id, d, next.start);
            else
                resize(g.id, next.end, d);
        }
        gesture.current = null;
        landingRef.current = null;
        setDragging(null);
        setLanding(null);
        setTimeout(() => { suppressClick.current = false; }, 0);
        if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
    }
    useEffect(() => { scrollRef.current?.scrollTo({ top: 9 * 80, behavior: 'instant' }); }, []);
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                const saved = JSON.parse(localStorage.getItem('provider-calendar-doctor-colors') || '{}');
                if (saved && typeof saved === 'object')
                    setDoctorColors(Object.fromEntries(Object.entries(saved).filter(([, v]) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) as [
                        string,
                        string
                    ][]));
            }
            catch { }
            setColorsReady(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);
    useEffect(() => {
        if (colorsReady) {
            try {
                localStorage.setItem('provider-calendar-doctor-colors', JSON.stringify(doctorColors));
            }
            catch { }
        }
    }, [doctorColors, colorsReady]);
    const colorFor = (doctor: string) => doctorColors[doctor] || colors[clinicians.indexOf(doctor)] || colors[0];
    const inkFor = (color: string) => { const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2] > .179 ? '#221b30' : '#ffffff'; };
    useEffect(() => { const timer = setTimeout(() => setHeaderHost(document.getElementById('calendar-header-controls')), 0); return () => clearTimeout(timer); }, []);
    function navigateWeek(offset: number) { setWeekMotion(x => ({ direction: offset > 0 ? 1 : -1, revision: x.revision + 1 })); setWeek(old => new Date(old.getFullYear(), old.getMonth(), old.getDate() + offset)); }
    function recordUndo() { setUndo({ appointments, leaves }); setFeedbackClosing(false); setFeedbackPaused(false); }
    useEffect(() => {
        if (!undo || feedbackPaused)
            return;
        const timer = setTimeout(() => setFeedbackClosing(true), 5000);
        return () => clearTimeout(timer);
    }, [undo, feedbackPaused]);
    useEffect(() => {
        if (!feedbackClosing)
            return;
        const timer = setTimeout(() => setUndo(null), 220);
        return () => clearTimeout(timer);
    }, [feedbackClosing]);
    function closeEditor() {
        if (modalCloseTimer.current)
            return;
        setModalClosing(true);
        modalCloseTimer.current = setTimeout(() => { setDraft(null); setManagement(null); setModalClosing(false); modalCloseTimer.current = null; }, 160);
    }
    useEffect(() => () => {
        if (modalCloseTimer.current)
            clearTimeout(modalCloseTimer.current);
    }, []);
    useEffect(() => {
        const dismissMenu = (event: PointerEvent) => {
            actionHost?.querySelectorAll('details[open]').forEach(menu => {
                if (!menu.contains(event.target as Node))
                    menu.removeAttribute('open');
            });
        };
        document.addEventListener('pointerdown', dismissMenu);
        return () => document.removeEventListener('pointerdown', dismissMenu);
    }, [actionHost]);
    const hasDraft = !!draft;
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        const modal = document.querySelector<HTMLElement>('[role="dialog"]');
        if (modal)
            modal.querySelector<HTMLElement>('input:not([type=file]),select,textarea,button')?.focus();
        const keyboard = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                createGesture.current = null;
                createRangeRef.current = null;
                setCreateRange(null);
                closeEditor();
                actionHost?.querySelectorAll('details[open]').forEach(x => x.removeAttribute('open'));
                gesture.current = null;
                landingRef.current = null;
                setDragging(null);
                setLanding(null);
            }
            if (e.key === 'Tab' && modal) {
                const fields = Array.from(modal.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')).filter(x => x.getClientRects().length);
                const first = fields[0], last = fields[fields.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last?.focus();
                }
                else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first?.focus();
                }
            }
        };
        document.addEventListener('keydown', keyboard);
        return () => {
            document.removeEventListener('keydown', keyboard);
            if (modal)
                previous?.focus();
        };
    }, [hasDraft, management, actionHost]);
    const days = Array.from({ length: 7 }, (_, i) => new Date(week.getFullYear(), week.getMonth(), week.getDate() + i));
    function open(d: Date, start = '10:00', a?: Appointment) { setError(''); setDraft({ kind: 'appointment', leaveReason: '', id: a?.id, name: a?.name || a?.id || '', phone: a?.phone || '', date: key(d), endDate: a?.endDate || endFields(a ? finish(a) : stamp(key(d), start) + 3600000).endDate, start: a?.time || start, end: a?.endTime || time(minutes(a?.time || start) + 60), doctor: a?.doctor || '', service: a?.services || services[4] }); }
    if (createRequest !== lastRequest) {
        setLastRequest(createRequest);
        open(days[0]);
    }
    const active = appointments.filter(a => a.status !== 'ยกเลิก');
    const leaveConflicts = active.filter(a => !!draft && a.doctor === draft?.doctor && overlaps({ start: stamp(key(dateOf(a)), a.time), end: finish(a) }, { start: stamp(draft.date, draft.start), end: stamp(draft.endDate, draft.end) })).sort((a, b) => stamp(key(dateOf(a)), a.time) - stamp(key(dateOf(b)), b.time));
    function reason(doctor: string, date: string, start: string, end: string, id?: string, endDate = date, leaveIndex?: number) {
        return appointmentConflict(appointments,leaves,doctor,date,start,end,id,endDate,leaveIndex);
    }
    function move(id: string, d: Date, start: number) {
        const a = appointments.find(x => x.id === id);
        if (!a)
            return;
        const duration = finish(a) - stamp(key(dateOf(a)), a.time);
        const end = endFields(stamp(key(d), time(start)) + duration);
        if (reason(a.doctor || '', key(d), time(start), end.endTime, id, end.endDate)) {
            setError('แพทย์มีนัดหมายซ้อนในช่วงนี้ กรุณาเลือกช่วงอื่น');
            return;
        }
        recordUndo();
        onChange(appointments.map(x => x.id === id ? { ...x, day: d.getDate(), month: d.getMonth(), year: d.getFullYear() + 543, time: time(start), ...end } : x));
        setError('');
    }
    function resize(id: string, end: number, d: Date) {
        const a = appointments.find(x => x.id === id);
        if (!a)
            return;
        const value = Math.max(stamp(key(dateOf(a)), a.time) + 900000, stamp(key(d), '00:00') + end * 60000);
        const fields = endFields(value);
        if (reason(a.doctor || '', key(dateOf(a)), a.time, fields.endTime, id, fields.endDate)) {
            setError('ปรับเวลาไม่ได้ เพราะแพทย์มีนัดหมายซ้อน');
            return;
        }
        recordUndo();
        onChange(appointments.map(x => x.id === id ? { ...x, ...fields } : x));
        setError('');
    }
    function openLeave(index?: number) { const l = index === undefined ? null : leaves[index], date = l?.from.slice(0, 10) || key(days[0]); setError(''); setDraft({ kind: 'leave', leaveIndex: index, leaveReason: l?.reason || '', name: '', phone: '', date, endDate: l?.to.slice(0, 10) || date, start: l?.from.slice(11, 16) || '10:00', end: l?.to.slice(11, 16) || '18:00', doctor: l?.doctor || clinicians[0], service: '' }); }
    function supportsService(doctor: string, service: string) { return supportsServices(doctor,service,capabilities); }
    function save(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!draft || modalClosing)
            return;
        if (draft.kind === 'appointment' && !supportsService(draft.doctor, draft.service)) {
            setError('แพทย์ไม่ให้บริการที่เลือก กรุณาเลือกแพทย์อื่น');
            return;
        }
        if (stamp(draft.endDate, draft.end) <= stamp(draft.date, draft.start)) {
            setError('วันและเวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม');
            return;
        }
        if (reason(draft.doctor, draft.date, draft.start, draft.end, draft.id, draft.endDate, draft.leaveIndex)) {
            setError('แพทย์มีนัดหมายซ้อน กรุณาเลือกแพทย์หรือเวลาอื่น');
            return;
        }
        if (draft.kind === 'leave') {
            if (!draft.leaveReason.trim() || leaveConflicts.length)
                return;
            const l = { doctor: draft.doctor, from: draft.date + 'T' + draft.start, to: draft.endDate + 'T' + draft.end, reason: draft.leaveReason.trim() };
            recordUndo();
            setLeaves(old => draft.leaveIndex === undefined ? [...old, l] : old.map((x, i) => i === draft.leaveIndex ? l : x));
            closeEditor();
            setError('');
            return;
        }
        const d = new Date(draft.date + 'T12:00:00');
        const old = appointments.find(a => a.id === draft.id);
        const a: Appointment = { birth: 'คลอดทางช่องคลอด', postpartum: 0, visit: 1, rights: false, status: 'รอยืนยันนัด', screening: 'ให้ประเมิน', illustration: 0, ...old, id: old?.id || `calendar-${Math.round(event.timeStamp * 1000)}`, name: draft.name, phone: draft.phone.trim(), day: d.getDate(), month: d.getMonth(), year: d.getFullYear() + 543, time: draft.start, endTime: draft.end, endDate: draft.endDate, doctor: draft.doctor, services: draft.service };
        recordUndo();
        onChange(old ? appointments.map(x => x.id === old.id ? a : x) : [...appointments, a]);
        closeEditor();
        setError('');
    }
    return <section className={`${s.calendar} ${dragging ? s.gestureActive : ''}`} aria-label="ปฏิทินแพทย์รายสัปดาห์">{actionHost && createPortal(<div className={s.managementActions}><details className={s.doctorMenu}><summary><span className={s.avatars}>{clinicians.map(d => <span key={d} title={d}>{photos[d] ? <Image src={photos[d]} alt={d} width={28} height={28} unoptimized/> : d.replace('พท. ', '').slice(0, 1)}</span>)}</span> แพทย์ {clinicians.length}</summary><div className={s.legend}>{clinicians.map(d => <div className={s.doctorRow} key={d}><input aria-label={`แสดงนัดหมาย ${d}`} type="checkbox" checked={visible.includes(d)} onChange={e => setVisible(e.target.checked ? [...visible, d] : visible.filter(x => x !== d))}/><button type="button" className={s.editDoctor} aria-label={`แก้ไขแพทย์ ${d}`} onClick={() => { setEditingDoctor(d); setDoctorName(d); setDoctorPhoto(photos[d] || ''); setDoctorColor(colorFor(d)); setDoctorServices(capabilities[d] || [...services]); setError(''); setManagement('doctor'); actionHost?.querySelectorAll('details[open]').forEach(x => x.removeAttribute('open')); }}><span className={s.doctorName}>{d}</span><i style={{ background: colorFor(d) }}/></button></div>)}</div></details><button onClick={() => { setManagement('doctor'); setEditingDoctor(null); setError(''); setDoctorName(''); setDoctorPhoto(''); setDoctorColor(palette[0].color); setDoctorServices([]); }}>เพิ่มแพทย์</button><button onClick={() => openLeave()}>แจ้งลาหยุด</button></div>, actionHost)}{headerHost && createPortal(<div className={s.headerControls}><button onClick={() => {
                const current = bangkokNow();
                setWeek(mondayOf(current.date));
                if (scrollRef.current)
                    scrollRef.current.scrollTo({ top: Math.max(0, current.minute / 60 * 80 - 120), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
            }}>วันนี้</button><button className={s.arrow} aria-label="สัปดาห์ก่อน" onClick={() => navigateWeek(-7)}><ChevronLeft size={20}/></button><button className={s.arrow} aria-label="สัปดาห์ถัดไป" onClick={() => navigateWeek(7)}><ChevronRight size={20}/></button><h2>{days[0].toLocaleDateString('th-TH', { month: 'short' })}{days[0].getMonth() !== days[6].getMonth() ? ` – ${days[6].toLocaleDateString('th-TH', { month: 'short' })}` : ''} {days[6].getFullYear() + 543}</h2></div>, headerHost)}{error && <p role="alert" className={s.error}>{error}</p>}{undo && <div role="status" className={`${s.feedback} ${feedbackClosing ? s.feedbackClosing : ''}`} onMouseEnter={() => setFeedbackPaused(true)} onMouseLeave={() => setFeedbackPaused(false)} onFocus={() => setFeedbackPaused(true)} onBlur={e => {
                if (!e.currentTarget.contains(e.relatedTarget))
                    setFeedbackPaused(false);
            }}>อัปเดตนัดหมายแล้ว <button disabled={feedbackClosing} onClick={() => { onChange(undo.appointments); setLeaves(undo.leaves); setFeedbackClosing(true); }}>เลิกทำ</button></div>}<div className={s.scroll} ref={scrollRef}><div key={weekMotion.revision} className={`${s.grid} ${weekMotion.revision ? (weekMotion.direction > 0 ? s.weekForward : s.weekBack) : ''}`}><div className={s.days}><span>GMT+7</span>{days.map(d => <div key={key(d)}><span>{d.toLocaleDateString('th-TH', { weekday: 'short' })}</span><strong className={key(d) === now?.date ? s.today : ''}>{d.getDate()}</strong></div>)}</div><div className={s.body}>{now && days.some(d => key(d) === now.date) && <div className={s.currentTime} style={{ top: 10 + now.minute / 60 * 80 }} aria-label={`เวลาปัจจุบัน ${time(Math.floor(now.minute))} ประเทศไทย`}><span>{time(Math.floor(now.minute))}</span><i style={{ left: `calc(64px + (100% - 64px) * ${days.findIndex(d => key(d) === now.date)}/7)` }}/></div>}<div className={s.hours}>{Array.from({ length: 25 }, (_, i) => <span key={i} style={{ top: `${i * 80}px` }}>{String(i).padStart(2, '0')}:00</span>)}</div>{days.map(d => {
            const dayStart = stamp(key(d), '00:00');
            const events = active.filter(a => stamp(key(dateOf(a)), a.time) < dayStart + 86400000 && finish(a) > dayStart && visible.includes(a.doctor || ''));
            const segmentStart = (a: Appointment) => Math.max(0, (stamp(key(dateOf(a)), a.time) - dayStart) / 60000);
            const segmentEnd = (a: Appointment) => Math.min(1440, (finish(a) - dayStart) / 60000);
            const previewFrom = landing ? stamp(landing.date, '00:00') + landing.start * 60000 : 0, previewTo = landing ? stamp(landing.date, '00:00') + landing.end * 60000 : 0;
            const previewHere = !!landing && !!dragging && previewFrom < dayStart + 86400000 && previewTo > dayStart;
            const previewStart = Math.max(0, (previewFrom - dayStart) / 60000), previewEnd = Math.min(1440, (previewTo - dayStart) / 60000);
            const layoutItems = events.filter(a => !landing || a.id !== dragging).map(a => ({ id: a.id, start: segmentStart(a), end: segmentEnd(a) }));
            if (previewHere && landing)
                layoutItems.push({ id: dragging!, start: previewStart, end: previewEnd });
            leaves.forEach((l, i) => {
                const start = Math.max(0, (new Date(l.from).getTime() - dayStart) / 60000), end = Math.min(1440, (new Date(l.to).getTime() - dayStart) / 60000);
                if (start < end && visible.includes(l.doctor))
                    layoutItems.push({ id: `leave-${i}`, start, end });
            });
            const columns = calendarColumns(layoutItems);
            const columnFor = (id: string) => columns[id] || { left: '0%', width: 'calc(100% - 4px)' };
            return <div className={s.day} data-calendar-date={key(d)} key={key(d)}>{Array.from({ length: 24 }, (_, i) => <button className={s.empty} key={i} aria-label={`เพิ่มนัดหมาย ${d.getDate()} ${String(i).padStart(2, '0')}:00`} onPointerDown={e => startRange(e, d)} onPointerMove={updateRange} onPointerUp={e => endRange(e)} onPointerCancel={e => endRange(e, true)} onClick={e => {
                        if (e.detail === 0)
                            open(d, time(i * 60));
                    }}/>)}{events.map(a => {
                    return <button key={a.id} aria-label={`${a.name || a.id} ${a.time}–${a.endTime || time(minutes(a.time) + 60)} ${a.services} ${a.doctor || ''}`} onMouseEnter={e => {
                            if (dragging)
                                return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            setEventHint({ a, x: Math.max(8, Math.min(rect.right + 8, window.innerWidth - 288)), y: Math.max(8, Math.min(rect.top, window.innerHeight - 180)) });
                        }} onMouseLeave={() => setEventHint(null)} onFocus={e => { const rect = e.currentTarget.getBoundingClientRect(); setEventHint({ a, x: Math.max(8, Math.min(rect.right + 8, window.innerWidth - 288)), y: Math.max(8, Math.min(rect.top, window.innerHeight - 180)) }); }} onBlur={() => setEventHint(null)} onPointerDown={e => { setEventHint(null); pointerStart(e, a, d, 'move'); }} onPointerMove={pointerMove} onPointerUp={e => pointerEnd(e)} onPointerCancel={e => pointerEnd(e, true)} onClick={() => {
                            if (suppressClick.current) {
                                suppressClick.current = false;
                                return;
                            }
                            open(dateOf(a), a.time, a);
                        }} className={`${s.event} ${dragging === a.id ? s.dragging : ''}`} style={{ top: segmentStart(a) / 60 * 80, height: Math.max(16, (segmentEnd(a) - segmentStart(a)) / 60 * 80 - 4), ...columnFor(a.id), background: colorFor(a.doctor || ''), color: inkFor(colorFor(a.doctor || '')) }}><strong>{a.name || a.id}</strong><span>{a.time}–{a.endTime || time(minutes(a.time) + 60)}{finish(a) >= stamp(key(dateOf(a)), '00:00') + 86400000 ? ' · ข้ามวัน' : ''}</span><span className={s.eventDetails}>{a.services}</span><span className={s.eventDetails}>{a.doctor}</span>{a.phone && <span className={s.eventDetails}>{a.phone}</span>}<span className={s.resizeHandle} role="slider" tabIndex={0} aria-label={`ปรับเวลาสิ้นสุด ${a.name || a.id}`} aria-valuemin={15} aria-valuemax={Math.max(1440, (finish(a) - stamp(key(dateOf(a)), a.time)) / 60000)} aria-valuenow={(finish(a) - stamp(key(dateOf(a)), a.time)) / 60000} aria-valuetext={a.endTime || time(minutes(a.time) + 60)} onClick={e => e.stopPropagation()} onPointerDown={e => pointerStart(e, a, d, 'resize')} onPointerMove={pointerMove} onPointerUp={e => { e.stopPropagation(); pointerEnd(e); }} onPointerCancel={e => pointerEnd(e, true)} onKeyDown={e => {
                            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                e.preventDefault();
                                e.stopPropagation();
                                resize(a.id, (finish(a) - stamp(key(d), '00:00')) / 60000 + (e.key === 'ArrowDown' ? 15 : -15), d);
                            }
                        }}/></button>;
                })}{leaves.map((l, i) => {
                    const start = Math.max(0, (new Date(l.from).getTime() - dayStart) / 60000), end = Math.min(1440, (new Date(l.to).getTime() - dayStart) / 60000);
                    if (start >= end || !visible.includes(l.doctor))
                        return null;
                    return <button key={`leave-${i}`} className={`${s.event} ${s.leaveEvent}`} style={{ top: start / 60 * 80, height: Math.max(20, (end - start) / 60 * 80 - 4), ...columnFor(`leave-${i}`), background: colorFor(l.doctor), color: inkFor(colorFor(l.doctor)) }} onClick={() => openLeave(i)}><strong>ลาหยุด</strong><span>{l.doctor}</span><span>{l.from.slice(11, 16)}–{l.to.slice(11, 16)}</span><span>{l.reason}</span></button>;
                })}{createRange?.date === key(d) && <div className={`${s.landing} ${s.createRange}`} style={{ top: createRange.start / 60 * 80, height: (createRange.end - createRange.start) / 60 * 80, left: 0, width: 'calc(100% - 4px)' }}><strong>นัดหมายใหม่</strong><span>{time(createRange.start)}–{createRange.end === 1440 ? '24:00' : time(createRange.end)}</span></div>}{previewHere && landing && <div className={`${s.landing} ${landing.conflict ? s.conflict : ''}`} style={{ ...columnFor(dragging!), background: colorFor(appointments.find(a => a.id === dragging)?.doctor || ''), color: inkFor(colorFor(appointments.find(a => a.id === dragging)?.doctor || '')), top: previewStart / 60 * 80, height: (previewEnd - previewStart) / 60 * 80 - 4 }}><strong>{appointments.find(a => a.id === dragging)?.name || dragging}</strong><strong>{time(landing.start)}–{time(landing.end)}{landing.end >= 1440 ? ' · ข้ามวัน' : ''}</strong><span>{landing.conflict || appointments.find(a => a.id === dragging)?.services}</span></div>}</div>;
        })}</div></div></div>{draft && <div className={`${s.backdrop} ${modalClosing ? s.modalClosing : ''}`}><form role="dialog" aria-modal="true" aria-label={draft?.kind === 'leave' ? 'ลาหยุดแพทย์' : draft ? draft.id ? 'แก้ไขนัดหมาย' : 'เพิ่มนัดหมาย' : editingDoctor ? 'แก้ไขแพทย์' : 'เพิ่มแพทย์'} className={s.modal} onSubmit={save}><div className={s.modalHead}><h2>{draft.kind === 'leave' ? 'ลาหยุดแพทย์' : draft.id ? 'แก้ไขนัดหมาย' : 'เพิ่มนัดหมาย'}</h2><button type="button" aria-label="ปิด" onClick={() => { closeEditor(); setError(''); }}><X size={20}/></button></div><div className={s.modalBody}><fieldset className={s.entryType}><legend>ประเภทรายการ</legend>{(['appointment', 'leave'] as const).map(kind => <button type="button" key={kind} aria-pressed={draft.kind === kind} disabled={!!draft.id || draft.leaveIndex !== undefined} onClick={() => { setError(''); setDraft({ ...draft, kind, service: draft.service || services[4], doctor: draft.doctor || (kind === 'leave' ? clinicians[0] : '') }); }}>{kind === 'appointment' ? 'นัดหมาย' : 'ลาหยุด'}</button>)}</fieldset>{draft.kind === 'appointment' && <><label>คุณแม่<input required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label><label>เบอร์ติดต่อ<input required type="tel" autoComplete="tel" value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} placeholder="เช่น 081 234 5678"/></label></>}<label>วันที่<span className={s.dateTimeField}><input required type="date" value={draft.date} onInput={e => setDraft({ ...draft, date: e.currentTarget.value, endDate: draft.endDate === draft.date || draft.endDate < e.currentTarget.value ? e.currentTarget.value : draft.endDate })} onChange={e => setDraft({ ...draft, date: e.target.value, endDate: draft.endDate === draft.date || draft.endDate < e.target.value ? e.target.value : draft.endDate })}/><CalendarDays size={18} strokeWidth={1.7} aria-hidden="true"/></span></label><div className={s.times}><label>เริ่ม<span className={s.dateTimeField}><input required type="time" value={draft.start} onInput={e => setDraft({ ...draft, start: e.currentTarget.value })} onChange={e => setDraft({ ...draft, start: e.target.value })}/><Clock3 size={18} strokeWidth={1.7} aria-hidden="true"/></span></label><label>สิ้นสุด<span className={s.dateTimeField}><input required type="time" value={draft.end} onInput={e => setDraft({ ...draft, end: e.currentTarget.value })} onChange={e => setDraft({ ...draft, end: e.target.value })}/><Clock3 size={18} strokeWidth={1.7} aria-hidden="true"/></span></label></div><details className={s.endDate} open={draft.endDate !== draft.date || undefined}><summary>ข้ามวัน / กำหนดวันที่สิ้นสุด</summary><label>วันที่สิ้นสุด<span className={s.dateTimeField}><input required type="date" min={draft.date} value={draft.endDate} onInput={e => setDraft({ ...draft, endDate: e.currentTarget.value })} onChange={e => setDraft({ ...draft, endDate: e.target.value })}/><CalendarDays size={18} strokeWidth={1.7} aria-hidden="true"/></span></label></details>{draft.kind === 'appointment' && <label>บริการ<span className={s.selectField}><ProviderSelect value={draft.service} onChange={e => setDraft({ ...draft, service: e.target.value })}>{Array.from(new Set([...services, draft.service])).map(x => <option key={x}>{x}</option>)}</ProviderSelect><ChevronDown size={18} strokeWidth={1.7} aria-hidden="true"/></span></label>}<label>แพทย์<span className={s.selectField}><ProviderSelect required value={draft.doctor} onChange={e => setDraft({ ...draft, doctor: e.target.value })}><option value="">เลือกแพทย์</option>{clinicians.map(d => { const offered = capabilities[d] || services; const unsupported = draft.service.split(/[,·]/).map(x => x.trim()).filter(Boolean).some(x => !offered.includes(x)); const r = unsupported ? 'ไม่ให้บริการที่เลือก' : reason(d, draft.date, draft.start, draft.end, draft.id, draft.endDate, draft.leaveIndex); return <option key={d} disabled={draft.kind === 'appointment' && !!r} value={d}>{d}{draft.kind === 'appointment' ? (r ? ` — ${r}` : ' — ว่าง') : ''}</option>; })}</ProviderSelect><ChevronDown size={18} strokeWidth={1.7} aria-hidden="true"/></span></label>{draft.kind === 'appointment' && draft.doctor && !supportsService(draft.doctor, draft.service) && <p role="alert" className={s.error}>แพทย์ไม่ให้บริการที่เลือก กรุณาเลือกแพทย์อื่น</p>}{draft.doctor && reason(draft.doctor, draft.date, draft.start, draft.end, draft.id, draft.endDate, draft.leaveIndex) && <p role="alert" className={s.error}>{reason(draft.doctor, draft.date, draft.start, draft.end, draft.id, draft.endDate, draft.leaveIndex)}</p>}{draft.kind === 'leave' && <><label>เหตุผลการลา<textarea required value={draft.leaveReason} onChange={e => setDraft({ ...draft, leaveReason: e.target.value })}/></label>{leaveConflicts.length > 0 && <section className={s.leaveConflicts} style={{ background: colorFor(draft.doctor), color: inkFor(colorFor(draft.doctor)) }} aria-label="นัดหมายที่ชนกับการลา"><div className={s.conflictHeading}><strong>ชนกับนัดหมาย {leaveConflicts.length} รายการ</strong><span>(ย้ายนัดให้ครบก่อนบันทึกการลา)</span></div>{leaveConflicts.map(a => <div key={a.id}><div><strong>คุณแม่ {a.name || a.id}</strong><span>{dateOf(a).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} · {a.time}–{a.endTime || time(minutes(a.time) + 60)}</span><span className={s.conflictDetails}>{a.services}{a.phone ? ` · ${a.phone}` : ''}</span></div><button type="button" onClick={() => {
                            const d = dateOf(a);
                            const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
                            setWeek(monday);
                            closeEditor();
                            setError('');
                            setVisible(old => old.includes(a.doctor || '') ? old : [...old, a.doctor || '']);
                            requestAnimationFrame(() => {
                                if (scrollRef.current)
                                    scrollRef.current.scrollTo({ top: Math.max(0, minutes(a.time) / 60 * 80 - 120), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
                            });
                        }}>ดูนัด<ChevronRight size={16}/></button></div>)}</section>}</>}{error && <p role="alert" className={s.error}>{error}</p>}</div><div className={s.modalActions}>{draft.kind === 'leave' && draft.leaveIndex !== undefined && <button type="button" onClick={() => { recordUndo(); setLeaves(old => old.filter((_, i) => i !== draft.leaveIndex)); closeEditor(); }}>ยกเลิกการลา</button>}<button type="button" onClick={() => closeEditor()}>ยกเลิก</button><button className={s.primary} type="submit" disabled={!draft.doctor || !Number.isFinite(stamp(draft.date, draft.start)) || stamp(draft.endDate, draft.end) <= stamp(draft.date, draft.start) || (draft.kind === 'appointment' && !supportsService(draft.doctor, draft.service)) || (draft.kind === 'leave' && (!draft.leaveReason.trim() || leaveConflicts.length > 0)) || !!draft.doctor && !!reason(draft.doctor, draft.date, draft.start, draft.end, draft.id, draft.endDate, draft.leaveIndex)}>{draft.kind === 'leave' ? 'บันทึกการลา' : 'บันทึกนัดหมาย'}</button></div></form></div>}{management && <div className={`${s.backdrop} ${modalClosing ? s.modalClosing : ''}`}><form role="dialog" aria-modal="true" aria-label={draft?.kind === 'leave' ? 'ลาหยุดแพทย์' : draft ? draft.id ? 'แก้ไขนัดหมาย' : 'เพิ่มนัดหมาย' : editingDoctor ? 'แก้ไขแพทย์' : 'เพิ่มแพทย์'} className={s.modal} onSubmit={e => {
                e.preventDefault();
                if (management === 'doctor') {
                    const name = doctorName.trim();
                    if (!name || !doctorServices.length || photoLoading || modalClosing)
                        return;
                    if (clinicians.includes(name) && name !== editingDoctor) {
                        setError('มีชื่อแพทย์นี้แล้ว');
                        return;
                    }
                    setCapabilities(prev => {
                        const next = { ...prev, [name]: doctorServices };
                        if (editingDoctor && editingDoctor !== name)
                            delete next[editingDoctor];
                        return next;
                    });
                    if (editingDoctor) {
                        const old = editingDoctor;
                        setClinicians(clinicians.map(d => d === old ? name : d));
                        setVisible(visible.map(d => d === old ? name : d));
                        setDoctorColors(prev => {
                            const next = { ...prev, [name]: doctorColor };
                            if (old !== name)
                                delete next[old];
                            return next;
                        });
                        setPhotos(prev => {
                            const next = { ...prev, [name]: doctorPhoto };
                            if (old !== name)
                                delete next[old];
                            return next;
                        });
                        setLeaves(leaves.map(l => l.doctor === old ? { ...l, doctor: name } : l));
                        if (old !== name)
                            onChange(appointments.map(a => a.doctor === old ? { ...a, doctor: name } : a));
                    }
                    else {
                        setClinicians([...clinicians, name]);
                        setDoctorColors({ ...doctorColors, [name]: doctorColor });
                        setVisible([...visible, name]);
                        if (doctorPhoto)
                            setPhotos({ ...photos, [name]: doctorPhoto });
                    }
                    closeEditor();
                }
            }}><div className={s.modalHead}><h2>{management === 'doctor' ? (editingDoctor ? 'แก้ไขแพทย์' : 'เพิ่มแพทย์') : 'แจ้งลาหยุดแพทย์'}</h2><button type="button" aria-label="ปิด" onClick={() => closeEditor()}><X size={20}/></button></div><div className={s.modalBody}>{management === 'doctor' ? <><label className={s.photoUpload}><span className={s.photoCircle}>{doctorPhoto ? <Image src={doctorPhoto} alt="รูปแพทย์ที่เลือก" width={88} height={88} unoptimized/> : <Camera size={28}/>}<span className={s.cameraBadge}><Camera size={14}/></span></span><span>{doctorPhoto ? 'เปลี่ยนรูปแพทย์' : 'เพิ่มรูปแพทย์'}</span><input className={s.hiddenFile} type="file" accept="image/*" aria-label="รูปแพทย์" onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file)
                        return;
                    if (!file.type.startsWith('image/')) {
                        setError('กรุณาเลือกไฟล์รูปภาพ');
                        return;
                    }
                    if (file.size > 2 * 1024 * 1024) {
                        setError('เลือกรูปขนาดไม่เกิน 2 MB');
                        return;
                    }
                    setPhotoLoading(true);
                    const reader = new FileReader();
                    reader.onload = () => { setDoctorPhoto(String(reader.result)); setPhotoLoading(false); setError(''); };
                    reader.onerror = () => { setPhotoLoading(false); setError('อ่านรูปภาพไม่สำเร็จ กรุณาเลือกใหม่'); };
                    reader.onabort = () => setPhotoLoading(false);
                    reader.readAsDataURL(file);
                }}/></label><label>ชื่อแพทย์<input required value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="พท. ชื่อ นามสกุล"/></label><fieldset className={s.serviceChoices}><legend>บริการที่แพทย์ทำได้</legend><div>{services.map(service => <button type="button" key={service} aria-pressed={doctorServices.includes(service)} onClick={() => setDoctorServices(old => old.includes(service) ? old.filter(x => x !== service) : [...old, service])}>{doctorServices.includes(service) && <Check size={14}/>}<span>{service}</span></button>)}</div></fieldset><fieldset className={s.palette}><legend>สีการ์ดนัดหมาย</legend><div className={s.paletteGrid}>{palette.map(p => <button type="button" key={p.color} className={s.colorSwatch} aria-label={`เลือกสี${p.name}`} aria-pressed={doctorColor === p.color} style={{ background: p.color }} onClick={() => setDoctorColor(p.color)}>{doctorColor === p.color && <Check size={18} strokeWidth={2.5}/>}</button>)}</div></fieldset></> : null}{error && <p role="alert" className={s.error}>{error}</p>}</div><div className={s.modalActions}><button type="button" onClick={() => closeEditor()}>ยกเลิก</button><button type="submit" className={s.primary} disabled={!doctorServices.length || photoLoading || modalClosing}>{management === 'doctor' ? (editingDoctor ? 'บันทึกการแก้ไข' : 'เพิ่มแพทย์') : 'บันทึกการลา'}</button></div></form></div>}{eventHint && !dragging && !draft && !management && createPortal(<div role="tooltip" className={s.eventHint} style={{ left: eventHint.x, top: eventHint.y }}><strong>{eventHint.a.name || eventHint.a.id}</strong><span>{eventHint.a.time}–{eventHint.a.endTime || time(minutes(eventHint.a.time) + 60)}</span><span>{eventHint.a.services}</span><span>{eventHint.a.doctor}</span><span>{eventHint.a.phone || 'ยังไม่ระบุเบอร์ติดต่อ'}</span></div>, document.body)}</section>;
}
