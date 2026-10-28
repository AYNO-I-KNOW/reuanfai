import {NextResponse,type NextRequest} from 'next/server';
import {onboardedCookie} from './app/ruenfai/onboarding/onboarded';

export function proxy(request:NextRequest){
 if(request.cookies.has(onboardedCookie))return NextResponse.next();
 return NextResponse.redirect(new URL('/ruenfai/onboarding',request.url));
}

export const config={matcher:['/ruenfai','/ruenfai/((?!onboarding).*)']};
