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
export default function Layout({children}:{children:ReactNode}){return <JournalProvider><MedicineProvider><div className={`${s.canvas} ${foundation.scope}`}><ToastProvider><EntryGate><TabMotion navigation={<BottomNav/>}>{children}</TabMotion></EntryGate></ToastProvider>{process.env.NODE_ENV!=='production'&&<Suspense fallback={null}><MobileFlowShortcuts/></Suspense>}</div></MedicineProvider></JournalProvider>}
