'use client';
import { createDemoStore } from './demo-store';
import { initialAppointments, initialMedicines, type Appointment, type Medicine } from '@/app/provider/design-preview/mock-data';
export type Booking = {
    id: string;
    patient: string;
    unit: string;
    services: string[];
    date: string;
    time: string;
    rights: string;
};
export type Prescription = {
    id: string;
    patient: string;
    medicine: string;
    dose: string;
    frequency: string;
    duration: number;
    amount: number;
    date: string;
};
type CareData = {
    appointments: Appointment[];
    medicines: Medicine[];
    bookings: Booking[];
    prescriptions: Prescription[];
};
const initial: CareData = { appointments: initialAppointments, medicines: initialMedicines, bookings: [], prescriptions: [] };
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === 'string');
function valid(v: unknown): v is CareData {
    if (!record(v))
        return false;
    return Array.isArray(v.appointments) && v.appointments.length > 0 && v.appointments.every(a => record(a) && typeof a.id === 'string' && typeof a.services === 'string' && typeof a.birth === 'string' && typeof a.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(a.time) && Number.isInteger(a.day) && Number(a.day) >= 1 && Number(a.day) <= 31 && Number.isInteger(a.postpartum) && Number.isInteger(a.visit) && typeof a.rights === 'boolean' && typeof a.screening === 'string' && Number.isInteger(a.illustration) && ['ยืนยันแล้ว', 'รอยืนยันนัด', 'รอประเมิน', 'บันทึกแล้ว', 'ยกเลิก'].includes(String(a.status))) &&
        Array.isArray(v.medicines) && v.medicines.length > 0 && v.medicines.every(m => record(m) && ['name', 'unit', 'lot', 'expiry'].every(k => typeof m[k] === 'string') && Number.isSafeInteger(m.quantity) && Number(m.quantity) >= 0 && Number.isFinite(m.threshold) && Number.isFinite(m.days)) &&
        Array.isArray(v.bookings) && v.bookings.every(b => record(b) && ['id', 'patient', 'unit', 'date', 'time', 'rights'].every(k => typeof b[k] === 'string') && strings(b.services)) &&
        Array.isArray(v.prescriptions) && v.prescriptions.every(p => record(p) && ['id', 'patient', 'medicine', 'dose', 'frequency', 'date'].every(k => typeof p[k] === 'string') && Number.isSafeInteger(p.amount) && Number(p.amount) > 0 && Number.isSafeInteger(p.duration) && Number(p.duration) > 0);
}
export const careDemo = createDemoStore<CareData>('reuanfai-care-demo-v1', initial, valid);
export const useCareDemo = careDemo.use;
export const motherProfile = createDemoStore('reuanfai-mother-profile-v1', { phone: '', emergencyPhone: '', birth: 'คลอดทางช่องคลอด', deliveryDate: '' }, (v): v is {
    phone: string;
    emergencyPhone: string;
    birth: string;
    deliveryDate: string;
} => record(v) && ['phone', 'emergencyPhone', 'birth', 'deliveryDate'].every(k => typeof v[k] === 'string'));
export function futureSlot(date: string, time: string, now = Date.now()) {
    const day = Date.parse(`${date}T00:00:00Z`);
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(day) && new Date(day).toISOString().slice(0, 10) === date && /^([01]\d|2[0-3]):[0-5]\d$/.test(time) && Date.parse(`${date}T${time}:00+07:00`) > now;
}
export function saveBooking(input: Omit<Booking, 'id' | 'patient'>) {
    if (!futureSlot(input.date, input.time) || !input.unit || !input.rights || !input.services.length || careDemo.snapshot().bookings.some(b => b.unit === input.unit && b.date === input.date && b.time === input.time && careDemo.snapshot().appointments.find(a => a.id === b.id)?.status !== 'ยกเลิก'))
        return false;
    const profile = motherProfile.snapshot();
    const id = `booking-${crypto.randomUUID()}`;
    const [year, month, day] = input.date.split('-').map(Number);
    const booking: Booking = { ...input, id, patient: 'M01' };
    careDemo.set(old => ({ ...old, bookings: [...old.bookings, booking], appointments: [...old.appointments, { id, name: 'M01', phone: profile.phone, day, month: month - 1, year: year + 543, time: input.time, services: input.services.join(', '), birth: profile.birth, postpartum: profile.deliveryDate ? Math.max(0, Math.floor((Date.parse(input.date) - Date.parse(profile.deliveryDate)) / 86400000)) : 0, visit: 1, rights: false, status: 'รอยืนยันนัด', screening: 'ให้ประเมิน', illustration: input.services[0] === 'ประคบสมุนไพร' ? 1 : 0 }] }));
    return true;
}
export function savePrescription(input: Omit<Prescription, 'id' | 'date'>) {
    if (!Number.isSafeInteger(input.amount) || input.amount < 1 || !Number.isSafeInteger(input.duration) || input.duration < 1 || !input.dose.trim() || !input.frequency.trim())
        return false;
    const stock = careDemo.snapshot().medicines.find(m => m.name === input.medicine);
    if (!stock || stock.quantity < input.amount)
        return false;
    careDemo.set(old => ({ ...old, medicines: old.medicines.map(m => m.name === input.medicine ? { ...m, quantity: m.quantity - input.amount } : m), prescriptions: [...old.prescriptions, { ...input, id: crypto.randomUUID(), date: new Date().toISOString() }] }));
    return true;
}
