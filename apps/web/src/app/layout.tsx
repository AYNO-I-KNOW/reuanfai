import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const font = Noto_Sans_Thai({ subsets: ["thai", "latin"], variable: "--font-noto-thai" });

// Safe-area insets resolve to 0 on iOS/in-app browsers without viewport-fit=cover
export const viewport: Viewport = { viewportFit: "cover" };

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
