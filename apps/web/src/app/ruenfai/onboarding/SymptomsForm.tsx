'use client';
import {useRef,useState} from 'react';
import {ChevronLeft} from 'lucide-react';
import {Choices,focusFirstInvalid} from './MotherForm';
import s from './onboarding.module.css';
import j from '../journal/journal.module.css';
const symptomQuestions=[
 'สองวันนี้มีไข้เกิน 37.5 องศาเซลเซียสไหม',
 'ตอนมีไข้ มีอาการเต้านมคัดตึงร่วมด้วยไหม',
 'มีอาการติดเชื้อไหม เช่น หนาวสั่น แผลบวมแดงร้อน หรือมีหนอง',
 'น้ำคาวปลามีกลิ่นเหม็น สีหรือปริมาณผิดปกติไหม',
 'แผลที่ช่องคลอดมีอะไรผิดปกติไหม',
 'มีเลือดออกมากผิดปกติ (ตกเลือด) ไหม',
 'มีฝีหรือก้อนบวมแดงและเจ็บที่เต้านมไหม',
];
const precautionQuestions=[
 'มีแผลพุพองที่ผิวหนังไหม',
 'ช่วงนี้มีเรื่องไหนในนี้บ้างไหม เพิ่งหายไข้ เพิ่งหายท้องเสีย อ่อนเพลีย อดนอน หรืออดอาหาร',
 'มีความดันต่ำ เวียนหัว คลื่นไส้ หรืออาเจียนไหม',
 'ตอนนี้มีประจำเดือนพร้อมกับมีไข้ไหม',
 'ตอนนี้มีแผลที่อักเสบอยู่ไหม ไม่ว่าจะเป็นแผลที่ไหน',
 'แผลผ่าคลอดยังมีส่วนที่ไม่หายสนิทไหม',
 'ตอนนี้มีประจำเดือนมามากกว่าปกติไหม',
];
const conditionQuestions=[
 'ตอนนี้มีโรคติดเชื้อเฉียบพลันอยู่ไหม เช่น ไข้หวัดใหญ่',
 'มีกระดูกเชิงกรานแตก ร้าว หรือแยกจากการคลอดไหม',
 'ตอนนี้มีโรคติดต่อร้ายแรงอยู่ไหม เช่น วัณโรค',
 'มีภาวะซึมเศร้าหลังคลอดที่รุนแรงและยังคุมอาการไม่ได้ไหม',
 'ความดันโลหิตสูงที่คุณแม่แจ้งไว้ ตอนนี้ยังมีปัญหาคุมไม่ได้อยู่ไหม',
 'มีผื่นหรือแผลที่ผิวหนังที่ติดเชื้อหรือติดต่อได้ไหม',
];
const stages={
 2:{questions:symptomQuestions,formId:'mother-symptoms',headingId:'symptoms-heading',title:'อาการหลังคลอด',description:'บอกอาการที่คุณแม่กำลังพบ หากไม่แน่ใจ สามารถเล่าเพิ่มเติมได้',back:'กลับไปข้อมูลคุณแม่'},
 3:{questions:conditionQuestions,formId:'mother-conditions',headingId:'conditions-heading',title:'ภาวะที่อาจมีผลต่อการรับบริการ',description:'บอกภาวะสุขภาพในปัจจุบัน ตามข้อมูลที่แพทย์เคยแจ้ง หากไม่แน่ใจ สามารถเล่าเพิ่มเติมได้',back:'กลับไปอาการหลังคลอด'},
 4:{questions:precautionQuestions,formId:'mother-precautions',headingId:'precautions-heading',title:'เรื่องที่ต้องระวังก่อนทำหัตถการ',description:'บอกอาการและสภาพร่างกายในช่วงนี้ เพื่อประกอบการประเมินความพร้อมก่อนทำหัตถการ',back:'กลับไปภาวะที่อาจมีผลต่อการรับบริการ'},
};
export default function SymptomsForm({onBack,onSaved,stage=2}:{onBack:()=>void;onSaved:()=>void;stage?:2|3|4}){
 const config=stages[stage];
 const {questions}=config;
 const [answers,setAnswers]=useState<string[]>(questions.map(()=>''));
 const [notes,setNotes]=useState<string[]>(questions.map(()=>''));
 const valid=answers.every(Boolean);
 const [submitted,setSubmitted]=useState(false);const form=useRef<HTMLFormElement>(null);
 return <form ref={form} id={config.formId} className={`${s.wizard} ${s.stageForm}`} onSubmit={e=>{e.preventDefault();if(valid){onSaved();return;}setSubmitted(true);focusFirstInvalid(form.current);}}>
 <header className={s.flowHeader}><div className={s.flowHeaderRow}><button type="button" aria-label={config.back} onClick={onBack}><ChevronLeft size={18}/></button><div className={s.flowProgress} role="progressbar" aria-label={`ช่วงที่ ${stage} จาก 4`} aria-valuemin={0} aria-valuemax={4} aria-valuenow={stage}><span style={{width:`${stage*25}%`}}/></div><small>{stage} จาก 4</small></div></header>
 <div className={s.stepTitle}><h1 id={config.headingId} tabIndex={-1}>{config.title}</h1><p>{config.description}</p></div>
 <div className={`${j.form} ${s.wizardFields}`}>{questions.map((question,index)=><div key={question} className={s.questionBlock}><Choices title={question} options={['มี','ไม่มี','ไม่แน่ใจ']} value={answers[index]?[answers[index]]:[]} onChange={value=>setAnswers(current=>current.map((answer,i)=>i===index?value[0]:answer))} error={submitted&&!answers[index]&&'กรุณาตอบข้อนี้'}/><div className={s.explanation} data-open={answers[index]==='ไม่แน่ใจ'} inert={answers[index]!=='ไม่แน่ใจ'}><div><label><textarea aria-label={`รายละเอียดเพิ่มเติม: ${question}`} value={notes[index]} onChange={e=>setNotes(current=>current.map((note,i)=>i===index?e.target.value:note))} placeholder="เล่าอาการหรือข้อมูลที่จำได้เพิ่มเติม (ไม่บังคับ)" rows={3}/></label></div></div></div>)}</div>
 </form>;
}
