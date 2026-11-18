import type { Metadata, Viewport } from "next";

import { Toaster } from "@/components/ui/sonner";
import { WorkspaceProvider } from "@/components/workspace-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "هم‌تیم — مدیریت تسک و تیم",
  description:
    "برد ساده‌ی تسک‌ها با وضعیت بک‌لاگ، در حال انجام، در انتظار و مسدود؛ همراه با اعضای تیم، اهداف، سررسید و کامنت‌های همفکری.",
  applicationName: "هم‌تیم",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className="h-full">
      <body className="min-h-full antialiased">
        <WorkspaceProvider>{children}</WorkspaceProvider>
        <Toaster position="top-center" dir="rtl" theme="light" closeButton />
      </body>
    </html>
  );
}
