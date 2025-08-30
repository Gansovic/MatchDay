import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { QueryProvider } from "@/components/providers/query-provider";
import { DevAuthProvider } from "@/components/auth/dev-auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MatchDay - Football League Platform",
  description: "Professional-grade platform for amateur football leagues. Join teams, compete in matches, and track your football performance like a pro.",
  keywords: "football, soccer, league, amateur, competition, tournaments, teams",
  authors: [{ name: "MatchDay Team" }],
  creator: "MatchDay",
  publisher: "MatchDay",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <DevAuthProvider>
            <Header />
            <main>
              {children}
            </main>
          </DevAuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
