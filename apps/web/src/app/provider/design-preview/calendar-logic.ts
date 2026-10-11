export type Interval = {id:string;start:number;end:number};
/** Half-open intervals allow consecutive appointments at the same boundary. */
export function overlaps(a:Pick<Interval,'start'|'end'>,b:Pick<Interval,'start'|'end'>){return a.start<b.end&&b.start<a.end;}
/** Reuse free lanes within each connected overlap group. */
export function calendarColumns(items:Interval[]){
 const result:Record<string,{left:string;width:string}>={};
 const sorted=[...items].sort((a,b)=>a.start-b.start||a.id.localeCompare(b.id));
 let group:Interval[]=[],until=-Infinity;
 const flush=()=>{const ends:number[]=[];const lanes=new Map<string,number>();for(const item of group){let lane=ends.findIndex(end=>end<=item.start);if(lane<0)lane=ends.length;ends[lane]=item.end;lanes.set(item.id,lane);}for(const item of group)result[item.id]={left:`${lanes.get(item.id)!/ends.length*100}%`,width:`calc(${100/ends.length}% - 4px)`};};
 for(const item of sorted){if(group.length&&item.start>=until){flush();group=[];until=-Infinity;}group.push(item);until=Math.max(until,item.end);}if(group.length)flush();return result;
}
export function bangkokClock(value:Date){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(value).map(p=>[p.type,p.value]));return {date:`${parts.year}-${parts.month}-${parts.day}`,minute:Number(parts.hour)*60+Number(parts.minute)+Number(parts.second)/60};}
