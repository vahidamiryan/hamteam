import type { Metadata, Viewport } from "next";

import { LocaleProvider } from "@/components/locale-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { WorkspaceProvider } from "@/components/workspace-provider";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY } from "@/lib/i18n";

import "./globals.css";

export const metadata: Metadata = {
  title: "هم‌تیم — مدیریت تسک و تیم",
  description:
    "برد ساده‌ی تسک‌ها با وضعیت بک‌لاگ، در حال انجام، در انتظار و مسدود؛ همراه با اعضای تیم، اهداف، سررسید و کامنت‌های همفکری. دوزبانه (فارسی/انگلیسی).",
  applicationName: "HamTeam",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

/**
 * زبان و جهت پیش از رنگ‌آمیزی صفحه ست می‌شوند تا پرش (FOUC) رخ ندهد.
 */
const bootstrapScript = `(function(){try{var k="${LOCALE_STORAGE_KEY}";var v=localStorage.getItem(k);var l=v==="en"?"en":"${DEFAULT_LOCALE}";var r=document.documentElement;r.lang=l;r.dir=l==="fa"?"rtl":"ltr";}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={DEFAULT_LOCALE} dir="rtl" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootstrapScript }} />
      </head>
      <body className="min-h-full antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider>
            <Toaster>
              <WorkspaceProvider>{children}</WorkspaceProvider>
            </Toaster>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
