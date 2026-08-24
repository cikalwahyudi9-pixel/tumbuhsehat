import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TumbuhSehat - Pantau Tumbuh Kembang Anak",
  description: "Platform pemantauan tumbuh kembang anak digital terintegrasi untuk Puskesmas dan Tenaga Kesehatan di seluruh Indonesia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} bg-[#f7f9fb] text-[#191c1e] antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
