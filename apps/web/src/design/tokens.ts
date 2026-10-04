import type { CSSProperties } from "react";

export const colorGroups = [
  { name: "Brand · สีหลัก", description: "ม่วงสำหรับจุดสำคัญ และพื้นอ่อนสำหรับพื้นที่ที่เลือก", colors: [
    { token: "primary", name: "Primary", hex: "#6549F7", usage: "ปุ่มหลัก / ลิงก์ / selected" },
    { token: "primary-hover", name: "Primary hover", hex: "#5438DB", usage: "เมื่อชี้ปุ่มหลัก" },
    { token: "primary-active", name: "Primary pressed", hex: "#4328BD", usage: "เมื่อกดปุ่มหลัก" },
    { token: "primary-soft", name: "Soft lavender", hex: "#EBEFFC", usage: "พื้นเมนู active / selected" },
    { token: "primary-tint", name: "Lavender tint", hex: "#F4F1FF", usage: "พื้น section สีอ่อน" },
    { token: "primary-border", name: "Lavender border", hex: "#C9BEFF", usage: "ขอบองค์ประกอบ selected" },
  ]},
  { name: "Neutral · พื้นและข้อความ", description: "พื้นขาวและเทาเย็น เพื่อให้สีหลักมีน้ำหนัก", colors: [
    { token: "surface", name: "White", hex: "#FFFFFF", usage: "การ์ด / sidebar" },
    { token: "canvas", name: "Canvas", hex: "#F8F9FD", usage: "พื้นหน้า Design System" },
    { token: "surface-subtle", name: "Subtle", hex: "#F1F3F9", usage: "พื้น input / hover รอง" },
    { token: "border", name: "Border", hex: "#E4E7F0", usage: "เส้นแบ่ง / ขอบการ์ด" },
    { token: "border-control", name: "Control border", hex: "#85889C", usage: "ขอบ input / select ที่ต้องเห็นชัด" },
    { token: "text", name: "Ink", hex: "#242338", usage: "หัวข้อ / ข้อความหลัก" },
    { token: "text-secondary", name: "Secondary ink", hex: "#62647A", usage: "ข้อความรอง" },
    { token: "text-muted", name: "Muted ink", hex: "#6C6E82", usage: "คำอธิบาย / metadata" },
  ]},
  { name: "Semantic · สีสถานะ", description: "ใช้ร่วมกับข้อความและไอคอนเสมอ", colors: [
    { token: "success", name: "Success", hex: "#21745C", usage: "สำเร็จ / สถานะที่ทำได้" },
    { token: "success-soft", name: "Mint", hex: "#E5F5EE", usage: "พื้นสถานะสำเร็จ" },
    { token: "warning", name: "Warning", hex: "#985018", usage: "ต้องประเมิน / คำเตือน" },
    { token: "warning-soft", name: "Peach", hex: "#FFF0DF", usage: "พื้นสถานะเตือน" },
    { token: "danger", name: "Danger", hex: "#B13D50", usage: "ข้อผิดพลาด / ข้อห้าม" },
    { token: "danger-soft", name: "Rose", hex: "#FCECF0", usage: "พื้น error ทั่วไป; ไม่ใช้แทนข้อห้ามแพทย์" },
    { token: "info", name: "Info", hex: "#3566AD", usage: "ข้อมูล / คำแนะนำ" },
    { token: "info-soft", name: "Sky", hex: "#EAF2FF", usage: "พื้นข้อมูล" },
  ]},
  { name: "Accent · ตัวเลือกเสริม", description: "ชุดทดลองสำหรับภาพประกอบและกราฟ ยังไม่ผูกกับความหมายทางการแพทย์", colors: [
    { token: "accent-lilac", name: "Lilac", hex: "#B6A4F5", usage: "ภาพประกอบ / series รอง" },
    { token: "accent-pink", name: "Pink", hex: "#EAA9C7", usage: "ภาพประกอบ / series รอง" },
    { token: "accent-mint", name: "Mint green", hex: "#A9DCCB", usage: "ภาพประกอบ / series รอง" },
    { token: "accent-peach", name: "Soft apricot", hex: "#F4C69E", usage: "ภาพประกอบ / series รอง" },
    { token: "accent-blue", name: "Periwinkle", hex: "#A8BFF4", usage: "ภาพประกอบ / series รอง" },
  ]},
] as const;

export const foundationTokens = {
  "space-1": "4px", "space-2": "8px", "space-3": "12px", "space-4": "16px", "space-5": "20px", "space-6": "24px", "space-8": "32px", "space-10": "40px", "space-12": "48px", "space-16": "64px",
  "radius-sm": "8px", "radius-md": "12px", "radius-lg": "16px", "radius-xl": "24px", "radius-pill": "999px",
  "font-ui": '"ReuanFai UI", sans-serif', "font-seed": '"LINE Seed Sans TH", sans-serif', "font-support": '"Noto Sans Thai Local", sans-serif',
  "text-xs": "12px", "text-sm": "14px", "text-md": "16px", "text-lg": "18px", "text-xl": "20px", "text-2xl": "24px", "text-3xl": "28px", "text-display": "36px",
  "leading-body": "1.6", "leading-heading": "1.4", "weight-body": "400", "weight-medium": "500", "weight-semibold": "600", "weight-bold": "700",
  "sidebar-expanded": "240px", "sidebar-collapsed": "72px", "layout-min": "1024px", "content-max": "1600px", "gutter": "24px", "page-padding": "32px",
  "control-sm": "32px", "control-md": "40px", "control-lg": "48px", "icon-sm": "16px", "icon-md": "20px", "icon-lg": "24px", "logo-size": "40px",
  "shadow-card": "0 2px 8px rgb(36 35 56 / 3%)", "shadow-popover": "0 8px 32px rgb(36 35 56 / 10%)",
  "motion-fast": "150ms", "motion-normal": "200ms", "motion-ease": "cubic-bezier(0.2, 0, 0, 1)",
  "border-width": "1px", "focus-width": "2px", "focus-offset": "3px", "z-base": "0", "z-sticky": "10", "z-popover": "30", "z-dialog": "50", "z-toast": "60",
} as const;

export const tokenStyle = Object.fromEntries([
  ...Object.entries(foundationTokens).map(([key, value]) => [`--rf-${key}`, value]),
  ...colorGroups.flatMap(group => group.colors.map(color => [`--rf-${color.token}`, color.hex])),
]) as CSSProperties;

export const fontWeights = [100, 200, 250, 300, 400, 500, 600, 700, 800, 900] as const;
export function weightSource(weight: number) {
  return [250, 400, 700, 800, 900].includes(weight) ? "LINE Seed Sans TH" : "Noto Sans Thai";
}

export const references = [
  { name: "TaskLance · Orely", url: "https://dribbble.com/shots/26370241-TaskLance-Freelance-Project-Management-Dashboard", pattern: "แถบสรุปตัวเลขร่วมกัน การ์ดขอบบาง และแผงข้อมูลด้านขวา", adaptation: "อ้างอิงความหนาแน่นและการแบ่ง main/inspector; ไม่ยกแบนเนอร์ illustration มาใส่หน้าเครื่องมือ" },
  { name: "Taskzero · Orely", url: "https://dribbble.com/shots/26089998-Taskzero-Task-Management-Dashboard", pattern: "toolbar สั้น เมนูย่อยเป็นแถว และการ์ดข้อมูลในกริด", adaptation: "ใช้ toolbar และลำดับข้อมูลที่กระชับ สำหรับ dashboard ที่จะออกแบบต่อ" },
  { name: "Radix Colors", url: "https://www.radix-ui.com/colors", pattern: "ตารางสีเป็นกลุ่มเทียบกันได้ ชื่อกลุ่มสั้น และดูรายละเอียดเมื่อเลือกสี", adaptation: "ชุดสีแบบแถวขนาดเล็ก ไม่มีกรอบการ์ดและคำอธิบายซ้ำทุกสี" },
  { name: "shadcn Create", url: "https://ui.shadcn.com/create", pattern: "แยกตัวควบคุมธีมออกจากพื้นที่ preview ที่ใช้งานจริง", adaptation: "แผงขวารวม HEX, color picker, contrast และ preview ในที่เดียว" },
] as const;
