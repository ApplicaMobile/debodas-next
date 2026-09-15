import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { DevPerformanceMeasurePatch } from "@/components/dev/DevPerformanceMeasurePatch";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { LOCALE_HTML } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-locale";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getDictionary();
  return {
    title: {
      default: "DeBodas",
      template: "%s | DeBodas",
    },
    description: messages.meta.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, messages } = await getDictionary();

  return (
    <html
      lang={LOCALE_HTML[locale]}
      className={`${montserrat.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {process.env.NODE_ENV === "development" ? (
          <DevPerformanceMeasurePatch />
        ) : null}
        <LocaleProvider key={locale} locale={locale} messages={messages}>
          <ToastProvider>{children}</ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
