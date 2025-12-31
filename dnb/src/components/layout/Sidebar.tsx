"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LogoutDialog from "../common/LogoutModal";
import {
  LayoutDashboard,
  Users,
  LogOut,
  ChevronRight,
  Fish,
  X,
  ClipboardList,
  CreditCard,
  Tag,
  Globe,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useAuth from "@/hooks/use-auth";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onClose?: () => void;
}

export default function Sidebar({
  collapsed,
  setCollapsed,
  onClose,
}: SidebarProps) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const userRole = user?.userRole || user?.role || "guest";

  if (userRole === "buyer") {
    return null;
  }

  const businessName = user?.businessName || "";

  const handleLogout = () => {
    logout();
    router.push("/login");
    if (onClose) onClose();
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    ...(userRole === "super_admin"
      ? [{ name: "Business Owners", icon: Users, path: "/users" }]
      : userRole === "business_owner"
        ? [{ name: "Buyers", icon: Users, path: "/users" }]
        : []),
    ...(userRole === "business_owner"
      ? [
          { name: "Products", icon: Fish, path: "/products" },
          { name: "Offer Drafts", icon: ClipboardList, path: "/offer-draft" },
          { name: "Offers", icon: Tag, path: "/offers" },
          { name: "Locations", icon: Globe, path: "/locations" },
          { name: "Profile", icon: User, path: "/profile" },
        ]
      : []),
    ...(userRole === "super_admin"
      ? [{ name: "Payment List", icon: CreditCard, path: "/payments-list" }]
      : []),
  ];

  // Temporary: Show default navigation if no items (for debugging)
  const finalNavItems = navItems.length > 1 ? navItems : [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Users", icon: Users, path: "/users" },
    { name: "Products", icon: Fish, path: "/products" },
    { name: "Offers", icon: Tag, path: "/offers" },
    { name: "Locations", icon: Globe, path: "/locations" },
  ];

  // Function to check if a navigation item is active
  const isNavItemActive = (navPath: string) => {
    if (pathname === navPath) return true;

    // Check if current path starts with the nav path (for sub-pages)
    if (pathname.startsWith(navPath + "/")) return true;

    return false;
  };

  return (
    <>
      <TooltipProvider>
        <aside
          className={cn(
            "fixed top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border shadow-xl flex flex-col z-50",
            "transition-all duration-150 ease-out",
            collapsed ? "w-16" : "w-64"
          )}
        >
          {/* Header */}
          <div className="h-16 border-b border-sidebar-border flex items-center justify-between px-4">
            {!collapsed && (
              <div className="flex flex-col max-w-[180px] truncate">
                <h2 className="text-2xl font-extrabold text-sidebar-primary truncate">
                  DNB
                </h2>
                {businessName &&
                  typeof businessName === "string" &&
                  businessName.length > 0 && (
                    <span className="text-sm font-medium text-sidebar-foreground/70 truncate">
                      {businessName}
                    </span>
                  )}
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground w-8 h-8"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              type="button"
            >
              <ChevronRight
                className={cn(
                  "w-4 h-4 transition-transform",
                  collapsed ? "" : "rotate-180"
                )}
                strokeWidth={2.5}
              />
            </Button>

            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="lg:hidden hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
                aria-label="Close sidebar"
                type="button"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {collapsed ? (
              <div className="flex flex-col items-center space-y-3">
                {finalNavItems.map(({ name, icon: Icon, path }) => {
                  const isActive = isNavItemActive(path);

                  return (
                    <Tooltip key={name} delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Link
                          href={path}
                          className={cn(
                            "flex items-center justify-center rounded-lg w-10 h-10 transition-all duration-200",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                          onClick={() => {
                            if (onClose) onClose();
                          }}
                        >
                          <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="bg-sidebar-popover text-sidebar-popover-foreground text-sm px-3 py-1 rounded-md shadow-lg border border-sidebar-border"
                      >
                        {name}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 space-y-1">
                {finalNavItems.map(({ name, icon: Icon, path }) => {
                  const isActive = isNavItemActive(path);

                  return (
                    <Link
                      key={name}
                      href={path}
                      className={cn(
                        "flex items-center rounded-lg text-sm font-medium w-full h-12 px-3 transition-all duration-200",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                          : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                      onClick={() => {
                        if (onClose) onClose();
                      }}
                    >
                      <Icon className="w-5 h-5 shrink-0 mr-3" strokeWidth={2} />
                      <span className="truncate font-medium flex-1">
                        {name}
                      </span>
                      {isActive && (
                        <div className="w-2 h-2 bg-sidebar-primary-foreground/70 rounded-full ml-2"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          <Separator className="my-4 bg-sidebar-border" />

          {/* Footer / Logout */}
          <div className="pb-4 pt-2">
            {collapsed ? (
              <div className="flex items-center justify-center">
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-10 h-10 justify-center text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
                      onClick={() => {
                        setLogoutOpen(true);
                      }}
                      aria-label="Logout"
                    >
                      <LogOut className="w-5 h-5" strokeWidth={2} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-sidebar-popover text-sidebar-popover-foreground text-sm px-3 py-1 rounded-md shadow-lg border border-sidebar-border"
                  >
                    Logout
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <div className="px-4">
                <Button
                  variant="ghost"
                  className="w-full h-12 justify-start text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg px-3"
                  onClick={() => {
                    setLogoutOpen(true);
                  }}
                  aria-label="Logout"
                  type="button"
                >
                  <LogOut className="w-5 h-5 shrink-0 mr-3" strokeWidth={2} />
                  <span className="font-medium flex-1">Logout</span>
                </Button>
              </div>
            )}
          </div>
        </aside>
      </TooltipProvider>

      {/* Logout Confirmation Modal */}
      <LogoutDialog
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onLogout={handleLogout}
      />
    </>
  );
}
