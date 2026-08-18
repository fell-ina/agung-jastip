 import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Wajib agar env(safe-area-inset-*) aktif di iPhone ber-notch / ber-Dynamic Island
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Manajemen Jasa Titip`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    `Aplikasi manajemen ${APP_TAGLINE.toLowerCase()}: trip, pesanan, kurs, biaya operasional, tagihan WhatsApp, dan label resi.`,
  // Pengalaman layar penuh saat "Add to Home Screen" di iPhone/iPad
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh">
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </ThemeProvider>
      </body> 
    </html>
  );
}
