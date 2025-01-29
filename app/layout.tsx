import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NovaMind🌟",
  description: "A futuristic AI agent powered by cutting-edge LLM technology, enabling advanced analysis and intelligent data insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <ConvexClientProvider>
    <html lang="en">

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        {children}
      </body>
    </html>
        </ConvexClientProvider>
  );
}
