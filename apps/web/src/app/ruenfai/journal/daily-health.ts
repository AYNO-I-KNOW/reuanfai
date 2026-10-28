/** Browser-local journal UI data; not a clinical assessment or API contract. */
export type DailyHealth={pain:number|null;painSite:string;lochiaAmount:string;lochiaColor:string;lochiaOdor:string;lochiaClot:string;feverSymptoms:string[];temperature:string;woundSite:string;wound:string[];breast:string[];breastSide:string};
export const blankHealth=():DailyHealth=>({pain:null,painSite:'',lochiaAmount:'',lochiaColor:'',lochiaOdor:'',lochiaClot:'',feverSymptoms:[],temperature:'',woundSite:'',wound:[],breast:[],breastSide:''});
export const dailyMoodLevels=['แย่มาก','ไม่ค่อยดี','เฉย ๆ','ดี','ดีมาก'];
export function toggleAnswer(values:string[],value:string,exclusive:string[]=[]){if(values.includes(value))return values.filter(item=>item!==value);return exclusive.includes(value)?[value]:[...values.filter(item=>!exclusive.includes(item)),value]}
export function healthRows(h?:DailyHealth):[string,string][]{const empty='ไม่ได้ระบุ';if(!h)return [['ข้อมูลอาการ','ยังไม่มีข้อมูลอาการในบันทึกนี้']];return [
 ['ความปวด',h.pain===null?empty:`${h.pain}/10${h.painSite?' · '+h.painSite:''}`],
 ['น้ำคาวปลา · ปริมาณ',h.lochiaAmount||empty],['น้ำคาวปลา · สี',h.lochiaColor||empty],['กลิ่นเหม็น',h.lochiaOdor||empty],['ลิ่มเลือดใหญ่',h.lochiaClot||empty],
 ['ไข้ / หนาวสั่น',h.feverSymptoms.join(' · ')||empty],['อุณหภูมิ',h.temperature?`${h.temperature} °C`:'ยังไม่ได้ระบุอุณหภูมิ'],
 [h.woundSite||'แผล',h.wound.join(' · ')||empty],['เต้านม',h.breast.length?`${h.breast.join(' · ')}${h.breastSide?' · '+h.breastSide:''}`:empty]
]}
export function needsCareNotice(h:DailyHealth){return h.lochiaAmount==='ผ้าอนามัยชุ่มภายใน 1 ชม.'||h.lochiaClot==='มี'||h.lochiaOdor==='มี'||(h.temperature!==''&&Number(h.temperature)>=38)}
