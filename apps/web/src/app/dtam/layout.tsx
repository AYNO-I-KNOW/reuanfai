import "@/design/fonts.css";
import { tokenStyle } from "@/design/tokens";
import { DashboardShell } from "@/components/design/dashboard-shell";

export default function DtamLayout({ children }: { children: React.ReactNode }) {
  return <div style={tokenStyle}><DashboardShell>{children}</DashboardShell></div>;
}
