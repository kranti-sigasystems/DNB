"use client";

import { useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import useAuth from "@/hooks/use-auth";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const userRole = user?.userRole || "guest";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const noSidebarRoutes = [
    "/",
    "/checkout",
    "/success",
    "/login",
    "/contact",
    "/paymentsuccess",
    "/onboard-process",
    "/forgot-password",
  ];

  const noNavbarRoutes = ["/"];

  const isBuyer = userRole === "buyer";
  const shouldShowSidebar = !isBuyer && !noSidebarRoutes.includes(pathname);
  const shouldShowNavbar = !noNavbarRoutes.includes(pathname);

  const contentPadding = sidebarCollapsed ? "lg:pl-16" : "lg:pl-64";
  const shouldHavePadding =
    shouldShowSidebar && !["/", "/login"].includes(pathname);
  const isNoSidebarRoute = noSidebarRoutes.includes(pathname);

  return (
    <div className="flex min-h-screen bg-background">
      {shouldShowSidebar && (
        <div className="hidden lg:block">
          <Sidebar
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
          />
        </div>
      )}

      {shouldShowSidebar && (
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden",
            mobileSidebarOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          )}
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div
            className={cn(
              "absolute top-0 left-0 w-64 h-full bg-sidebar shadow-2xl transform transition-transform duration-300 z-50",
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              collapsed={false}
              setCollapsed={() => {}}
              onClose={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content with enhanced light theme styling */}
      <div
        className={cn(
          "flex flex-col flex-1 w-full transition-all duration-300 bg-background/95",
          shouldShowSidebar && contentPadding
        )}
      >
        {shouldShowNavbar && (
          <Navbar
            onMenuClick={() => setMobileSidebarOpen(true)}
            showSidebarButton={shouldShowSidebar}
            isNoSidebarRoute={isNoSidebarRoute}
          />
        )}
        <main
          className={cn(
            "flex-1 overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20",
            shouldHavePadding && "pt-4 px-8",
            !shouldHavePadding && "px-0"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
