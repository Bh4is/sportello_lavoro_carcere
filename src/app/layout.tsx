import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Navbar from "@/src/components/Navbar/Navbar";

const geistSans = Geist({
   variable: "--font-geist-sans",
   subsets: ["latin"],
});

const geistMono = Geist_Mono({
   variable: "--font-geist-mono",
   subsets: ["latin"],
});

export const metadata: Metadata = {
   description: "Sportello Lavoro Carcere",
};

export default function RootLayout({ children }: { children: ReactNode }) {
   return (
      <html lang="it" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
         <body>
            <Navbar />
            <main>{children}</main>
         </body>
      </html>
   );
}
