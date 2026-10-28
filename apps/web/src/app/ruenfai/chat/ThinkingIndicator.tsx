import Image from 'next/image';
import s from './chat.module.css';

/** A waiting state, not a claim that tools or clinical analysis have run. */
export default function ThinkingIndicator(){
 return <div className={s.thinking} role="status" aria-label="กำลังคิด">
  <Image className={s.thinkingMascot} src="/images/ruenfai/results/baby.png" alt="" width={72} height={66} loading="eager"/>
  <div className={s.thinkingCaption} aria-hidden="true">กำลังคิด<span className={s.thinkingDots}><span>.</span><span>.</span><span>.</span></span></div>
 </div>;
}
