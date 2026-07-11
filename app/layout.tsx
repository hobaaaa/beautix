import type { Metadata } from "next";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Beautix",
  title: {
    default: "Beautix",
    template: "%s | Beautix",
  },
  description: "Randevu ve işletme yönetim sistemi",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Beautix",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  themeColor: "#171717",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className="antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
