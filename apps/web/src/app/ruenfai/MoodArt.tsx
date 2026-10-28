import type {SVGProps} from 'react';
export const moods=['เครียด','เหนื่อย','เรื่อย ๆ','สบายใจ','มีความสุข'] as const;
const surfaces:Record<string,string>={เครียด:'#EFA18F',เหนื่อย:'#C6CDEC','เรื่อย ๆ':'#E7D6C2',สบายใจ:'#D7CAF1',มีความสุข:'#F6D982'};
/** Existing round ReuanFai face family: expressions carry meaning as well as color. */
export default function MoodArt({mood,...props}:{mood:string}&SVGProps<SVGSVGElement>){
 mood=({'แย่มาก':'เครียด','ไม่ค่อยดี':'เหนื่อย','เฉย ๆ':'เรื่อย ๆ','ดี':'สบายใจ','ดีมาก':'มีความสุข'} as Record<string,string>)[mood]??mood;
 const tired=mood==='เหนื่อย',stressed=mood==='เครียด',happy=mood==='มีความสุข',calm=mood==='สบายใจ';
 return <svg width={64} height={64} viewBox="0 0 96 96" fill="none" aria-hidden="true" {...props}>
 <circle cx="48" cy="48" r="48" fill={surfaces[mood]??surfaces['เรื่อย ๆ']}/>
 <ellipse cx="27" cy="54" rx="6" ry="4" fill="#F3B7BB"/><ellipse cx="69" cy="54" rx="6" ry="4" fill="#F3B7BB"/>
 {stressed?<g stroke="#473080" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="m30 31 12 5m12 0 12-5M31 43l9 3-9 4m34-7-9 3 9 4m-27 12 5-3 5 3 5-3 5 3"/></g>:tired?<g stroke="#473080" strokeWidth="3.5" strokeLinecap="round"><path d="m31 33 10 3m14 0 10-3M30 44q6 5 12 0m12 0q6 5 12 0m-23 16q5-3 10 0"/></g>:happy?<g stroke="#473080" strokeWidth="3.5" strokeLinecap="round"><path d="M30 43q6-10 12 0m12 0q6-10 12 0"/><path d="M37 53h22c-1 17-21 17-22 0Z" fill="#473080" strokeLinejoin="round"/></g>:<g><circle cx="36" cy="43" r="3.5" fill="#473080"/><circle cx="60" cy="43" r="3.5" fill="#473080"/>{calm?<path d="M39 55q9 10 18 0" stroke="#473080" strokeWidth="3.5" strokeLinecap="round"/>:<path d="M42 59h12" stroke="#473080" strokeWidth="3.5" strokeLinecap="round"/>}</g>}
 </svg>
}
