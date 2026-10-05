"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ArrowUpRight, Search, Plus, CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react";
import { colorGroups, fontWeights, foundationTokens, references, weightSource } from "@/design/tokens";
import styles from "./page.module.css";

type Tab = "colors" | "type" | "components" | "tokens" | "references";
function luminance(hex: string) {
  const rgb = hex.replace("#", "").match(/.{2}/g)!.map(c => parseInt(c,16)/255).map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
function contrast(a:string,b:string) { const x=luminance(a),y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
const tabs: {id:Tab;label:string}[] = [{id:"colors",label:"สี"},{id:"type",label:"ตัวอักษร"},{id:"components",label:"คอมโพเนนต์"},{id:"tokens",label:"โทเคน"},{id:"references",label:"References"}];

export default function DesignSystemPage() {
  const [tab,setTab]=useState<Tab>("colors");
  const [copied,setCopied]=useState("");
  const [query,setQuery]=useState("");
  const [selected,setSelected]=useState<{name:string;hex:string;usage:string;token:string}>(colorGroups[0].colors[0]);
  const [message,setMessage]=useState("");
  const [custom,setCustom]=useState("#6549F7");
  const [draft,setDraft]=useState("#6549F7");
  const [foreground,setForeground]=useState("#FFFFFF");
  const [sample,setSample]=useState("เรือนไฟ ดูแลทุกวันให้เบาสบาย");
  const [weight,setWeight]=useState(400);
  const [checked,setChecked]=useState(true);
  const [choice,setChoice]=useState("overview");
  const ratio=contrast(custom,foreground);
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [message]);
  async function copy(value:string) {
    try { await navigator.clipboard.writeText(value); setCopied(value); setMessage(value.length > 80 ? "คัดลอกโทเคนแล้ว" : `คัดลอก ${value} แล้ว`); }
    catch { setCopied(""); setMessage(`คัดลอกอัตโนมัติไม่ได้ เลือกข้อความแล้วคัดลอกเอง: ${value}`); }
  }
  const filteredGroups = colorGroups.map(group => ({...group, colors: group.colors.filter(color => `${color.name} ${color.hex} ${color.token} ${color.usage}`.toLowerCase().includes(query.toLowerCase()))})).filter(group => group.colors.length);
  function selectColor(color: typeof selected) { setSelected(color); setCustom(color.hex); setDraft(color.hex); setForeground(contrast(color.hex,"#FFFFFF")>=4.5 ? "#FFFFFF" : "#242338"); void copy(color.hex); }
  function updateCustom(value:string) { setDraft(value.toUpperCase()); if(/^#[\da-f]{6}$/i.test(value))setCustom(value.toUpperCase()); }
  return (
    <div className={styles.library}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>WORKSPACE / DESIGN SYSTEM</p><h1>Design System <span>v0.2</span></h1></div>
        <button className={styles.secondaryButton} onClick={()=>copy(JSON.stringify({foundation:foundationTokens,colors:colorGroups.flatMap(g=>g.colors.map(c=>({...c})))},null,2))}><Copy size={15}/> คัดลอกโทเคน</button>
      </header>
      <nav className={styles.tabs} aria-label="หมวด Design System">{tabs.map(item=><button key={item.id} type="button" aria-pressed={tab===item.id} onClick={()=>{setTab(item.id);setMessage("");}}>{item.label}</button>)}</nav>
      {message && <p className={styles.feedback} role="status" aria-live="polite"><Check size={14}/>{message}</p>}

      {tab==="colors" && <div className={styles.colorWorkspace}>
        <section className={styles.palettePanel} aria-label="ชุดสี">
          <div className={styles.paletteToolbar}><div><h2>Color palette <span>{colorGroups.reduce((sum, group) => sum + group.colors.length, 0)}</span></h2><p>เลือกสีเพื่อดูรายละเอียดและคัดลอก HEX</p></div><label className={styles.searchInput}><Search size={16}/><input aria-label="ค้นหาสี" placeholder="ค้นหาสีหรือ HEX" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
          {filteredGroups.map(group=><div key={group.name} className={styles.colorGroup}><div className={styles.groupHeading}><h3>{group.name.split(" · ")[0]}</h3><span>{group.colors.length} colors</span></div><div className={styles.swatches}>{group.colors.map(color=><button className={styles.swatch} key={color.token} onClick={()=>selectColor(color)} aria-pressed={selected.token===color.token} aria-label={`คัดลอก ${color.name} ${color.hex}`} title={`${color.name} · ${color.usage}`}><span className={styles.color} style={{background:color.hex}}>{selected.token===color.token&&<Check size={16} style={{color:contrast(color.hex,"#FFFFFF")>=4.5?"#FFFFFF":"#242338"}}/>}</span><span className={styles.swatchMeta}><strong>{color.name}</strong><span className={styles.hex}>{color.hex}</span></span></button>)}</div></div>)}
          {!filteredGroups.length&&<div className={styles.noResults}><p>ไม่พบสี “{query}”</p><button className={styles.ghostButton} onClick={()=>setQuery("")}>ล้างการค้นหา</button></div>}
          <p className={styles.paletteNote}>Accent ใช้สำหรับกราฟและภาพประกอบ · สีสถานะใช้ร่วมกับข้อความเสมอ</p>
        </section>
        <aside className={styles.inspector} aria-label="รายละเอียดสีและทดลองสี">
          <div className={styles.inspectorHeading}><h2>Color details</h2><span className={styles.small}>Live preview</span></div>
          <div className={styles.colorPreview} style={{background:custom,color:foreground}}><span>Aa</span><p>เรือนไฟ · ReuanFai</p></div>
          <h3>{custom===selected.hex ? selected.name : "Custom color"}</h3><p className={styles.usage}>{custom===selected.hex ? selected.usage : "สีที่คุณเลือกทดลอง"}</p>
          {custom===selected.hex&&<code className={styles.tokenName}>--rf-{selected.token}</code>}
          <div className={styles.inspectorControls}><label htmlFor="custom-color">HEX</label><div className={styles.inputRow}><input id="custom-color" aria-label="เลือกสีพื้น" type="color" value={custom} onChange={e=>updateCustom(e.target.value)}/><input aria-label="รหัส HEX สีพื้น" value={draft} onChange={e=>updateCustom(e.target.value)} maxLength={7} aria-invalid={!/^#[\da-f]{6}$/i.test(draft)}/><button className={styles.iconButton} aria-label="คัดลอกสีที่เลือก" onClick={()=>copy(custom)}>{copied===custom?<Check size={16}/>:<Copy size={16}/>}</button></div>{!/^#[\da-f]{6}$/i.test(draft)&&<p className={styles.small}>HEX ต้องเป็น # ตามด้วย 6 หลัก</p>}<label htmlFor="foreground">สีตัวอักษร</label><select id="foreground" value={foreground} onChange={e=>setForeground(e.target.value)}><option value="#FFFFFF">White · #FFFFFF</option><option value="#242338">Ink · #242338</option></select></div>
          <div className={styles.contrast}><div><span>Contrast</span><strong>{ratio.toFixed(2)}:1</strong></div><p>{ratio>=4.5 ? "AA · ข้อความปกติ" : ratio>=3 ? "AA · เฉพาะข้อความใหญ่" : "ไม่ผ่าน AA สำหรับข้อความ"}</p></div>
          <button className={styles.secondaryButton} onClick={()=>copy(`สีพื้น ${custom} / ตัวอักษร ${foreground}`)}><Copy size={15}/>คัดลอกคู่สี</button>
          <p className={styles.inspectorNote}>สีทดลองมีผลเฉพาะพรีวิวนี้</p>
        </aside>
      </div>}

      {tab==="type"&&<>
        <section className={styles.section}><div className={styles.sectionHeading}><div><h2>LINE Seed Sans TH + Noto Sans Thai</h2><p>ใช้ไฟล์จริงทุกน้ำหนัก โดยไม่สร้างตัวหนาจำลอง</p></div></div><div className={styles.notice}><Info size={20}/><p>LINE Seed มี 250 / 400 / 700 / 800 / 900 ส่วน 100 / 200 / 300 / 500 / 600 ใช้ Noto Sans Thai variable เสริม ชื่อฟอนต์แต่ละน้ำหนักแสดงด้านล่าง</p></div><div className={styles.typeControls}><label>ข้อความทดลอง<input value={sample} onChange={e=>setSample(e.target.value)}/></label><label>น้ำหนัก<select value={weight} onChange={e=>setWeight(Number(e.target.value))}>{fontWeights.map(w=><option key={w} value={w}>{w} · {weightSource(w)}</option>)}</select></label></div><p className={styles.typePreview} style={{fontWeight:weight}}>{sample||"เรือนไฟ"}</p><div className={styles.weightList}>{fontWeights.map(w=><div className={styles.weightRow} key={w}><span className={styles.small}>{w}<br/>{weightSource(w)}</span><p style={{fontWeight:w}}>{sample||"เรือนไฟ"} Aa 012345</p></div>)}</div></section>
        <section className={styles.section}><h2>ขนาดตัวอักษร</h2>{[{name:"Display",size:36,weight:700},{name:"Page title",size:28,weight:700},{name:"Section title",size:20,weight:700},{name:"Body",size:16,weight:400},{name:"Label",size:14,weight:500},{name:"Caption",size:12,weight:400}].map(t=><div className={styles.typeScale} key={t.name}><span className={styles.small}>{t.name} · {t.size}px / {t.weight}</span><p style={{fontSize:t.size,fontWeight:t.weight}}>เรือนไฟ · ดูแลอย่างเข้าใจ</p></div>)}</section>
      </>}

      {tab==="components"&&<>
        <section className={styles.section}><div className={styles.sectionHeading}><div><h2>องค์ประกอบเริ่มต้น</h2><p>ตัวอย่างสำหรับตรวจดีไซน์ · การกดมีผลเฉพาะในหน้านี้</p></div></div><h3>Buttons · 40px / Radius 12px</h3><div className={styles.exampleRow}><button className={styles.primaryButton} onClick={()=>setMessage("ลองปุ่มหลักแล้ว")}>เริ่มต้น <Plus size={18}/></button><button className={styles.secondaryButton} onClick={()=>setMessage("ลองปุ่มรองแล้ว")}>ดูรายละเอียด</button><button className={styles.ghostButton} onClick={()=>setMessage("ลองปุ่มข้อความแล้ว")}>เพิ่มเติม <ArrowUpRight size={16}/></button><button className={styles.primaryButton} disabled>ยังไม่พร้อม</button></div><h3>Inputs & Selection</h3><div className={styles.exampleRow}><label className={styles.searchInput}><Search size={18}/><input placeholder="ลองพิมพ์ค้นหา" aria-label="ตัวอย่างช่องค้นหา"/></label><select aria-label="ตัวอย่างเลือกมุมมอง" value={choice} onChange={e=>setChoice(e.target.value)}><option value="overview">ภาพรวม</option><option value="month">รายเดือน</option></select><label className={styles.checkbox}><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/>เลือกตัวอย่าง</label></div><h3>Status badges</h3><div className={styles.exampleRow}>{[{key:"success",label:"สำเร็จ",icon:CheckCircle2},{key:"warning",label:"รอประเมิน",icon:AlertTriangle},{key:"danger",label:"ผิดพลาด",icon:XCircle},{key:"info",label:"ข้อมูล",icon:Info}].map(s=><span key={s.key} className={styles.badge} style={{background:`var(--rf-${s.key}-soft)`,color:`var(--rf-${s.key})`}}><s.icon size={16}/>{s.label}</span>)}</div><h3>Card & Empty state</h3><div className={styles.componentCards}><article className={styles.demoCard}><span className={styles.pill}>ตัวอย่างคอมโพเนนต์</span><h3>ตัวอย่างการ์ด</h3><p>พื้นขาว ขอบบาง Padding 24px<br/>Radius 16px และเงาเบาเฉพาะที่จำเป็น</p><button className={styles.secondaryButton} onClick={()=>setMessage("ตัวอย่างการ์ด · ยังไม่เชื่อมข้อมูล")}>ดูตัวอย่าง</button></article><article className={styles.emptyCard}><div className={styles.emptyIcon}><LayoutGlyph/></div><h3>ยังไม่มีข้อมูล</h3><p>เมื่อมีข้อมูล รายการจะแสดงที่นี่</p></article></div></section>
      </>}

      {tab==="tokens"&&<>
        <section className={styles.section}><div className={styles.sectionHeading}><div><h2>โทเคนที่ใช้ร่วมกัน</h2><p>สี ตัวอักษร ระยะห่าง ความมน ขนาด และ motion มีแหล่งเดียว</p></div><button className={styles.secondaryButton} onClick={()=>copy(JSON.stringify({foundation:foundationTokens,colors:colorGroups.flatMap(g=>g.colors.map(c=>({...c})))},null,2))}>คัดลอก JSON <Copy size={16}/></button></div><h3>Spacing</h3><div className={styles.spacing}>{[4,8,12,16,20,24,32,40,48,64].map(n=><div key={n}><span style={{width:n}}/><small>{n}px</small></div>)}</div><h3>Corner radius</h3><div className={styles.radiusRow}>{[8,12,16,24].map(n=><div key={n}><span style={{borderRadius:n}}/><small>{n}px</small></div>)}</div><div className={styles.tokenTable}><table><thead><tr><th>Token</th><th>Value</th><th>Copy</th></tr></thead><tbody>{Object.entries(foundationTokens).map(([key,value])=><tr key={key}><td><code>--rf-{key}</code></td><td>{value}</td><td><button className={styles.iconButton} onClick={()=>copy(`var(--rf-${key})`)} aria-label={`คัดลอกโทเคน ${key}`}><Copy size={16}/></button></td></tr>)}</tbody></table></div></section>
      </>}

      {tab==="references"&&<section className={styles.section}><div className={styles.sectionHeading}><div><h2>References</h2><p>Dashboard และเครื่องมือ Design System ที่ใช้เป็นแนวทาง</p></div></div><div className={styles.referenceCards}>{references.map((ref,index)=><article className={styles.referenceCard} key={ref.name}><span className={styles.referenceNumber}>0{index+1}</span><h3>{ref.name}</h3><p><strong>สิ่งที่เห็น</strong><br/>{ref.pattern}</p><p><strong>นำมาใช้กับเรา</strong><br/>{ref.adaptation}</p><a href={ref.url} target="_blank" rel="noreferrer">เปิด Reference <ArrowUpRight size={16}/></a></article>)}</div><div className={styles.notice}><Info size={20}/><p>รูปแบบหน้าเครื่องมืออ้างอิง Radix Colors และ shadcn Create · ขนาดและสีใช้โทเคนของเรือนไฟ</p></div><p className={styles.small}>ฟอนต์: <a href="https://seed.line.me/index_th.html" target="_blank" rel="noreferrer">LINE Seed</a> · <a href="https://github.com/google/fonts/tree/main/ofl/notosansthai" target="_blank" rel="noreferrer">Noto Sans Thai</a> · ทั้งสองชุดเก็บไฟล์และ OFL license ในโปรเจกต์</p></section>}

    </div>
  );
}
function LayoutGlyph(){return <span aria-hidden="true">✦</span>;}
