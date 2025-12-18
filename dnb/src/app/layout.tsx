'use client';

import './globals.css';
import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Geist, Geist_Mono } from 'next/font/google';
import LandingNavbar from '@/components/features/home/components/Landingnavbar';
import { AuthProvider } from '@/providers/AuthProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  // Keep QueryClient stable across renders
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LandingNavbar/>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
