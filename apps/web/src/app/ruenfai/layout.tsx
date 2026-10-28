import {Suspense,type ReactNode} from 'react';
import {JournalProvider} from './JournalState';
import {MedicineProvider} from './MedicineState';
import BottomNav from './BottomNav';
import TabMotion from './TabMotion';
import EntryGate from './EntryGate';
import ToastProvider from './ToastProvider';
import MobileFlowShortcuts from './MobileFlowShortcuts';
import s from './page.module.css';
import foundation from './foundation.module.css';
import '@/design/fonts.css';
// main deploys run with VERCEL_ENV=production; local + preview builds keep the test shortcuts
const showDevShortcuts=process.env.NEXT_PUBLIC_DEV_SHORTCUTS==='1'||process.env.VERCEL_ENV!=='production';

export default function Layout({children}:{children:ReactNode}){return <JournalProvider><MedicineProvider><div className={`${s.canvas} ${foundation.scope}`}><ToastProvider><EntryGate><TabMotion navigation={<BottomNav/>}>{children}</TabMotion></EntryGate></ToastProvider>{showDevShortcuts&&<Suspense fallback={null}><MobileFlowShortcuts/></Suspense>}</div></MedicineProvider></JournalProvider>}
