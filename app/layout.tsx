import type { Metadata } from "next";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from "@/lib/i18n/config";
import { cookies, headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Artexo",
  title: {
    default: "Artexo",
    template: "%s | Artexo",
  },
  description: "Randevu ve işletme yönetim sistemi",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Artexo",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: [{ url: "/icons/favicon-32x32.png", type: "image/png" }],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport = {
  themeColor: "#171717",
  viewportFit: "cover",
};

async function getRequestLocale(): Promise<Locale> {
  const headerStore = await headers();
  const headerLocale = headerStore.get("x-artexo-locale");
  const normalizedHeaderLocale = headerLocale ?? undefined;

  if (isLocale(normalizedHeaderLocale)) {
    return normalizedHeaderLocale;
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;

  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  return defaultLocale;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale} className="dark">
      <body className="min-h-dvh antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

