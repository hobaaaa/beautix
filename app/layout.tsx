import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beautix",
  description: "Beautix yönetim paneli",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
