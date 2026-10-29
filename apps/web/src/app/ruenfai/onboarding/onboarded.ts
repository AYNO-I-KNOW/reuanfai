export const onboardedCookie='rf_onboarded';
const oneYear=60*60*24*365;
export function markOnboarded(){document.cookie=`${onboardedCookie}=1; path=/; max-age=${oneYear}; samesite=lax`;}
export const isOnboarded=()=>document.cookie.split('; ').some(cookie=>cookie.startsWith(`${onboardedCookie}=`));
