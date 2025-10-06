import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AdminHeader } from "@/components/layout/admin-header";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AdminGuard } from "@/components/auth/admin-guard-fixed";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MatchDay Admin - League Management Portal",
  description: "Administrative portal for MatchDay league administrators. Manage leagues, approve teams, and oversee competitions.",
  keywords: "football, soccer, league, admin, management, administration",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased admin-theme`}
      >
        <QueryProvider>
          <AuthProvider>
            <AdminGuard>
              <AdminHeader />
              <main>
                {children}
              </main>
            </AdminGuard>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
