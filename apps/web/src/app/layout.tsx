import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const font = Noto_Sans_Thai({ subsets: ["thai", "latin"], variable: "--font-noto-thai" });

export const metadata: Metadata = {
  title: "เรือนไฟ",
  description: "เพื่อนคู่ใจแม่หลังคลอด",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={cn("h-full antialiased font-sans", font.variable)}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
