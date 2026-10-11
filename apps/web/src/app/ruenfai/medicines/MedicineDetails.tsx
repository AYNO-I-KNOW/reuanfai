import type {MotherMedicine} from './useMedicines';
import s from '../page.module.css';
import m from './medicines.module.css';
export default function MedicineDetails({medicine}:{medicine:MotherMedicine}){return <dl className={`${s.medicineInstructions} ${m.details}`}><div><dt>สรรพคุณ</dt><dd>{medicine.benefit}</dd></div><div><dt>วิธีใช้/ข้อควรระวัง</dt><dd>{medicine.instruction||`${medicine.form} · ใช้ตามคำแนะนำของแพทย์หรือเภสัชกร`}<br/>เวลาในหน้านี้เป็นตัวอย่างสำหรับเดโม่</dd></div></dl>}
