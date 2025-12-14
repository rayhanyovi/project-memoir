import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
// @ts-ignore: allow side-effect CSS import without module declarations
import "./globals.css";
import { AppLayout } from "@/components/layout/app-layout";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Memoir",
  description: "A personal workspace powered by Memoir.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
