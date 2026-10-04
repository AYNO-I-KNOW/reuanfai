import { services, type Appointment } from './mock-data';
import { overlaps } from './calendar-logic';
export type Leave = {
    doctor: string;
    from: string;
    to: string;
    reason: string;
};
export type CalendarSettings = {
    clinicians: string[];
    photos: Record<string, string>;
    capabilities: Record<string, string[]>;
    leaves: Leave[];
};
export function validCalendarSettings(v: unknown): v is CalendarSettings {
    if (!v || typeof v !== 'object')
        return false;
    const x = v as CalendarSettings;
    return Array.isArray(x.clinicians) && x.clinicians.length > 0 && x.clinicians.every(s => typeof s === 'string') && !!x.photos && typeof x.photos === 'object' && Object.values(x.photos).every(s => typeof s === 'string') && !!x.capabilities && typeof x.capabilities === 'object' && Object.values(x.capabilities).every(a => Array.isArray(a) && a.every(s => typeof s === 'string')) && Array.isArray(x.leaves) && x.leaves.every(l => l && typeof l.doctor === 'string' && typeof l.reason === 'string' && typeof l.from === 'string' && typeof l.to === 'string' && Number.isFinite(Date.parse(l.from)) && Number.isFinite(Date.parse(l.to)));
}
export function readCalendarSettings(): CalendarSettings | null {
    try {
        const value: unknown = JSON.parse(sessionStorage.getItem('provider-calendar-settings') || 'null');
        return validCalendarSettings(value) ? value : null;
    }
    catch {
        return null;
    }
}
export function supportsServices(doctor: string, service: string, capabilities: Record<string, string[]>) { return service.split(/[,·]/).map(x => x.trim()).filter(Boolean).every(s => (capabilities[doctor] || services).includes(s)); }
const stamp = (date: string, time: string) => Date.parse(`${date}T${time}:00+07:00`);
const appointmentDate = (a: Appointment) => `${(a.year ?? 2569) - 543}-${String((a.month ?? 10) + 1).padStart(2, '0')}-${String(a.day).padStart(2, '0')}`;
const leaveStamp = (value: string) => Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}+07:00`);
export function appointmentConflict(appointments: Appointment[], leaves: Leave[], doctor: string, date: string, start: string, end: string, id?: string, endDate = date, leaveIndex?: number) {
    const from = stamp(date, start), to = stamp(endDate, end);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from)
        return 'วันและเวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม';
    const leave = leaves.find((l, i) => i !== leaveIndex && l.doctor === doctor && overlaps({ start: leaveStamp(l.from), end: leaveStamp(l.to) }, { start: from, end: to }));
    if (leave)
        return `ลาหยุด: ${leave.reason}`;
    const clash = appointments.find(a => a.status !== 'ยกเลิก' && a.id !== id && a.doctor === doctor && overlaps({ start: stamp(appointmentDate(a), a.time), end: a.endTime ? stamp(a.endDate || appointmentDate(a), a.endTime) : stamp(appointmentDate(a), a.time) + 3600000 }, { start: from, end: to }));
    if (!clash)
        return '';
    const [h, m] = clash.time.split(':').map(Number);
    const finish = clash.endTime || `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return `มีนัด ${clash.time}–${finish} กรุณาเปลี่ยนเวลา`;
}
