'use client';
import { useCareDemo } from '@/design/care-demo';
import { medicines } from './data';
export type MotherMedicine = (typeof medicines)[number] & {
    instruction?: string;
};
export function useMedicines(): MotherMedicine[] {
    const care = useCareDemo();
    const result: MotherMedicine[] = medicines.map(m => ({ ...m }));
    for (const prescription of care.prescriptions.filter(p => p.patient === 'M01')) {
        const index = result.findIndex(m => m.name === prescription.medicine);
        const base = index >= 0 ? result[index] : { name: prescription.medicine, benefit: care.medicines.find(m => m.name === prescription.medicine)?.benefits || 'ใช้ตามคำแนะนำของแพทย์', times: [] as string[], form: '', art: 1 };
        // Only explicit prescribed times override the demo schedule; never infer a clinical dose.
        const times = Array.from(new Set(prescription.frequency.match(/(?:[01]\d|2[0-3]):[0-5]\d/g) || [])).sort();
        const item = { ...base, times: times.length ? times : base.times, instruction: `${prescription.dose} · ${prescription.frequency} · ${prescription.duration} วัน` };
        if (index >= 0)
            result[index] = item;
        else
            result.push(item);
    }
    return result;
}
