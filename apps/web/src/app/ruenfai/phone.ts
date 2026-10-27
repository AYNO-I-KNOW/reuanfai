export const phoneDigits=(value:string)=>value.replace(/[^0-9]/g,'').slice(0,10);
export const formatPhone=(value:string)=>{const digits=phoneDigits(value);return [digits.slice(0,3),digits.slice(3,6),digits.slice(6)].filter(Boolean).join(' ');};
export const phoneValid=(value:string)=>/^0[0-9]{8,9}$/.test(phoneDigits(value));
