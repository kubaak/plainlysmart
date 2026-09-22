/* This shared component renders the document for both App Router root layouts. */
/* eslint-disable @next/next/no-head-element */
import { ThemeProvider } from "@/components/ThemeProvider";
interface RootLayoutProps {
  locale: string;
  children: React.ReactNode;
}

export default function SiteDocument({ children, locale }: Readonly<RootLayoutProps>) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* React hoists and deduplicates external async scripts across locale changes. */}
        <script id="theme-preference" src="/theme-preference.js" async blocking="render" />
      </head>
      <body>
        <ThemeProvider locale={locale}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
