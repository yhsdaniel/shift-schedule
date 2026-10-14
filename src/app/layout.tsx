import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FnB Store Shift Scheduler | Sistem Penjadwalan Shift Toko',
  description:
    'Aplikasi web manajemen jadwal shift untuk Store Manager FnB. Didukung constraint-based scheduler, PIC coverage, rest interval 11 jam, dan export PNG smartphone-ready.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-stone-950 text-stone-100 flex flex-col selection:bg-amber-500 selection:text-stone-950">
        {children}
      </body>
    </html>
  );
}
