"use client";

import "./globals.css";
import { ReactNode, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { LoadingBar } from "@/components/ui/loading-bar";
import { ReduxProvider } from "@/providers/ReduxProvider";
import { useToastContext } from "@/providers/ToastProvider";
import { setGlobalToastFunctions } from "@/utils/toast";
import { usePerformanceOptimizations } from "@/hooks/use-performance";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

function ToastInitializer() {
  const toastFunctions = useToastContext();

  useEffect(() => {
    setGlobalToastFunctions(toastFunctions);
  }, [toastFunctions]);

  return null;
}

function PerformanceProvider({ children }: { children: ReactNode }) {
  usePerformanceOptimizations();
  return <>{children}</>;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  // Keep QueryClient stable across renders with optimized config
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <html lang="en">
      <head>
        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/dashboard"
          as="fetch"
          crossOrigin="anonymous"
        />
        <link rel="preload" href="/users" as="fetch" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <ToastProvider>
                <PerformanceProvider>
                  <ToastInitializer />
                  <LoadingBar />
                  <AuthProvider>{children}</AuthProvider>
                  {/* React Hot Toast configuration */}
                  <Toaster
                    position="top-center"
                    toastOptions={{
                      duration: 3000, // Shorter duration for faster UX
                      style: {
                        background: "#fff",
                        color: "#333",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow:
                          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      },
                      success: {
                        style: {
                          background: "#f0fdf4",
                          color: "#166534",
                          border: "1px solid #bbf7d0",
                        },
                      },
                      error: {
                        style: {
                          background: "#fef2f2",
                          color: "#dc2626",
                          border: "1px solid #fecaca",
                        },
                      },
                    }}
                  />
                </PerformanceProvider>
              </ToastProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
