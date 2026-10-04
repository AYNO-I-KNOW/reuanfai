'use client';
import type {ReactNode} from 'react';
import s from '@/app/provider/design-preview/preview.module.css';
export default function Checkbox({checked,onChange,children,ariaLabel,disabled=false,className}:{checked:boolean;onChange:(checked:boolean)=>void;children?:ReactNode;ariaLabel?:string;disabled?:boolean;className?:string}){
  return <label className={`${s.checkboxLabel} ${disabled?s.checkboxDisabled:''} ${className||''}`}>
    <span className={s.checkboxWrap}>
      <input
        type="checkbox"
        className={s.checkboxNative}
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={e=>onChange(e.target.checked)}
      />
      <span className={`${s.checkboxBox} ${checked?s.checkboxChecked:''}`} aria-hidden="true">
        <svg className={s.checkboxSvg} viewBox="0 0 16 16" fill="none">
          <path
            className={s.checkboxCheck}
            d="M3.2 8.4L6.4 11.4L12.8 4.6"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </span>
    </span>
    {children&&<span className={s.checkboxText}>{children}</span>}
  </label>;
}
