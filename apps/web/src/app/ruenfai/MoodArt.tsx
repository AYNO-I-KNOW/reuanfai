import type {SVGProps} from 'react';
export const moods=['เครียด','เหนื่อย','เรื่อย ๆ','สบายใจ','มีความสุข'] as const;
export default function MoodArt({mood,...props}:{mood:string}&SVGProps<SVGSVGElement>){
 const tired=mood==='เหนื่อย',stressed=mood==='เครียด',happy=mood==='มีความสุข',calm=mood==='สบายใจ';
 return <svg width={64} height={64} viewBox="0 0 96 96" fill="none" aria-hidden="true" {...props}>
 <circle cx="48" cy="48" r="41" fill="#D7CAF1"/>
 <ellipse cx="30" cy="51" rx="5" ry="3.5" fill="#F5BDC1"/><ellipse cx="66" cy="51" rx="5" ry="3.5" fill="#F5BDC1"/>
 {stressed?<g stroke="#473080" strokeWidth="3" strokeLinecap="round"><path d="m33 34 9 3m12 0 9-3M34 42l7 3-7 3m28-6-7 3 7 3m-20 9q6-5 12 0"/></g>:tired?<g stroke="#473080" strokeWidth="3" strokeLinecap="round"><path d="m33 34 8 3m14 0 8-3M33 43q4 4 8 0m14 0q4 4 8 0m-20 12q5-4 10 0"/></g>:happy?<g stroke="#473080" strokeWidth="3" strokeLinecap="round"><path d="M33 43q4-7 8 0m14 0q4-7 8 0"/><path d="M41 49h14c-1 9-13 9-14 0Z" fill="#473080" strokeLinejoin="round"/></g>:<g><circle cx="37" cy="42" r="3" fill="#473080"/><circle cx="59" cy="42" r="3" fill="#473080"/>{calm?<path d="M42 51q6 7 12 0" stroke="#473080" strokeWidth="3" strokeLinecap="round"/>:<path d="M44 53h8" stroke="#473080" strokeWidth="3" strokeLinecap="round"/>}</g>}
 </svg>
}
