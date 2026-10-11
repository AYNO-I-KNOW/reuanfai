"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Columns3, LayoutDashboard, Palette, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import styles from "@/app/dtam/page.module.css";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const pathname = usePathname();
  const library = pathname.startsWith("/dtam/design-system");
  return (
    <div className={styles.shell} data-collapsed={collapsed} data-grid={showGrid} data-library={library}>
      <aside id="dashboard-sidebar" className={styles.sidebar} aria-label="แถบด้านข้าง">
        <div className={styles.sidebarHeader}>
          <Link href="/dtam" className={styles.brand} aria-label="เรือนไฟ · หน้าแดชบอร์ด" title="เรือนไฟ">
            <Image src="/images/logo-dtam.png" alt="" width={40} height={40} className={styles.logo} />
            {!collapsed && <span className={styles.brandName}>เรือนไฟ</span>}
          </Link>
          <button className={styles.control} type="button" onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "ขยายแถบด้านข้าง" : "ย่อแถบด้านข้าง"} aria-expanded={!collapsed}
            aria-controls="dashboard-sidebar" title={collapsed ? "ขยายแถบด้านข้าง" : "ย่อแถบด้านข้าง"}>
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
        <nav className={styles.nav} aria-label="พื้นที่งานดีไซน์">
          {[{href:"/dtam",label:"แดชบอร์ด",icon:LayoutDashboard},{href:"/dtam/design-system",label:"Design System",icon:Palette}].map(item => (
            <Link key={item.href} href={item.href} className={styles.navItem} aria-current={pathname === item.href ? "page" : undefined} aria-label={item.label} title={collapsed ? item.label : undefined}>
              <item.icon size={20} />{!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>
      <main className={styles.canvas} aria-label={library ? "Design System เรือนไฟ" : "พื้นที่แดชบอร์ดกรมการแพทย์แผนไทย"}>
        <div className={styles.grid}>
          <div className={styles.content}>{children}</div>
          {showGrid && <div className={styles.guides} aria-hidden="true">{Array.from({length:12},(_,index)=><div key={index}/>)}</div>}
        </div>
        <button className={`${styles.control} ${styles.gridControl}`} type="button" onClick={()=>setShowGrid(!showGrid)} aria-label="แสดงเส้นกริด" aria-pressed={showGrid} title="แสดง / ซ่อนเส้นกริด"><Columns3 size={20}/></button>
      </main>
    </div>
  );
}
