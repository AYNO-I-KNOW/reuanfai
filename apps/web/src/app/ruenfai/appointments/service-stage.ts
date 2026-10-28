export type ServiceStage = 'book' | 'pending' | 'confirmed' | 'payment' | 'review' | 'assessment' | 'waiting' | 'unavailable';
export type StageContext = {
  stage: ServiceStage;
  firstAssessment?: boolean;
  date?: string;
  time?: string;
  clinic?: string;
  nextBookingDate?: string;
  reason?: string;
};
export const serviceStages: ServiceStage[] = ['book', 'pending', 'confirmed', 'payment', 'review', 'assessment', 'waiting', 'unavailable'];
const dayFormat = new Intl.DateTimeFormat('th-TH', {timeZone:'Asia/Bangkok', day:'numeric', month:'short'});
function validDay(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const day = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(day) && new Date(day).toISOString().slice(0,10) === value ? day : null;
}
export function serviceStageView(context: StageContext, now: number) {
  let stage = context.stage;
  let days: number | null = null;
  const next = validDay(context.nextBookingDate);
  if (stage === 'waiting') {
    const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Bangkok', year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
    const todayDay = validDay(today);
    if (next === null || todayDay === null) stage = 'assessment';
    else {
      days = Math.max(0, Math.round((next - todayDay) / 86400000));
      if (days === 0) stage = 'book';
    }
  }
  const when = validDay(context.date);
  const date = when === null ? '' : dayFormat.format(when);
  const slot = date && context.time ? `${date} เวลา ${context.time} น.` : '';
  const copy = {
    book: ['จองคิว', 'เลือกวันและเวลาที่สะดวก เพื่อเข้ารับบริการกับคลินิก'],
    pending: ['รอยืนยันนัด', slot ? `ขอนัดวันที่ ${slot} รอคลินิกตรวจสอบและยืนยันนัด` : 'ส่งคำขอนัดหมายแล้ว คลินิกจะตรวจสอบและยืนยันวันเวลาให้ทราบ'],
    confirmed: ['นัดหมายแล้ว', slot ? `ยืนยันนัดวันที่ ${slot}${context.clinic ? ` ณ ${context.clinic}` : ''}` : 'คลินิกยืนยันนัดหมายแล้ว สามารถดูวันเวลาและสถานที่ในรายละเอียดนัด'],
    payment: ['ชำระเงิน', 'ตรวจสอบค่าบริการและค่ายา ก่อนชำระเงินให้คลินิก'],
    review: ['รีวิว', 'แบ่งปันความรู้สึกหลังรับบริการ เพื่อพัฒนาการดูแล'],
    assessment: ['รอประเมิน', context.firstAssessment ? 'ประเมินกับผู้ให้บริการ เมื่อไปคลินิกตามนัดแรก' : 'รอผู้ให้บริการประเมินและวางแผน สำหรับการรับบริการครั้งถัดไป'],
    waiting: [`อีก ${days} วัน`, next === null ? '' : `ตามแผนการดูแล สามารถเริ่มจองบริการครั้งถัดไปได้ตั้งแต่วันที่ ${dayFormat.format(next)}`],
    unavailable: ['ไม่สามารถทำได้', context.reason ? `จากผลประเมิน แนะนำให้งดบริการนี้ เนื่องจาก ${context.reason}` : 'สอบถามผู้ให้บริการถึงเหตุผล และแนวทางการดูแลต่อไป'],
  } as const;
  return {stage, label:copy[stage][0], description:copy[stage][1], actionable:['book','payment','review'].includes(stage), tone:stage === 'pending' || stage === 'assessment' ? 'yellow' : stage === 'confirmed' ? 'green' : stage === 'unavailable' ? 'gray' : 'purple'};
}
