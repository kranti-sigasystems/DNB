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

export default function Sidebar({ collapsed, setCollapsed, onClose }: SidebarProps) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const toggleCollapse = () => setCollapsed(!collapsed);

  const userRole = user?.userRole || "guest";

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
          { name: "Locations", icon: Globe, path: "/location" },
          { name: "Profile", icon: User, path: "/profile" },
        ]
      : []),
    ...(userRole === "super_admin"
      ? [
          { name: "Payment List", icon: CreditCard, path: "/payments-list" },
        ]
      : []),
  ];

  return (
    <>
      <TooltipProvider>
        <aside
          className={cn(
            "fixed top-0 left-0 h-screen bg-black border-r border-gray-900 shadow-xl flex flex-col transition-all duration-300 z-40",
            collapsed ? "w-16" : "w-64"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-[0.8rem] h-16 border-b border-gray-900 select-none">
            {!collapsed && (
              <div className="flex flex-col max-w-[180px] truncate">
                <h2 className="text-2xl font-extrabold text-blue-400 truncate">
                  DNB
                </h2>
                {businessName && (
                  <span className="text-sm font-medium text-gray-400 truncate">
                    {businessName}
                  </span>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="hidden lg:flex cursor-pointer p-2 hover:bg-gray-900 rounded focus-visible:ring focus-visible:ring-blue-400"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              type="button"
            >
              <ChevronRight
                className={cn(
                  "w-5 h-5 text-gray-400 transition-transform",
                  collapsed ? "rotate-0" : "rotate-180"
                )}
                strokeWidth={2.5}
              />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="lg:hidden cursor-pointer p-2 hover:bg-gray-900 rounded"
                aria-label="Close sidebar"
                type="button"
              >
                <X className="w-5 h-5 text-gray-400" strokeWidth={2} />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav
            className={cn(
              "flex-1 overflow-y-auto py-4",
              "scrollbar-dark px-3",
              collapsed ? "flex flex-col items-center space-y-4" : "space-y-1"
            )}
          >
            {navItems.map(({ name, icon: Icon, path }) => {
              const isActive = pathname === path;
              const link = (
                <Link
                  key={name}
                  href={path}
                  onClick={() => onClose && onClose()}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium w-full transition-all duration-200 select-none cursor-pointer",
                    collapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5",
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border-r-2 border-blue-400 font-semibold"
                      : "text-gray-300 hover:text-white hover:bg-gray-900/50"
                  )}
                >
                  <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-blue-400" : "text-gray-400")} strokeWidth={2} />
                  {!collapsed && <span className="truncate">{name}</span>}
                </Link>
              );

              return collapsed ? (
                <Tooltip key={name} delayDuration={150}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-gray-800 text-white text-sm px-3 py-1 rounded-md shadow-lg select-none border border-gray-700"
                  >
                    {name}
                  </TooltipContent>
                </Tooltip>
              ) : (
                link
              );
            })}
          </nav>

          <Separator className="my-4 bg-gray-900" />

          {/* Footer / Logout */}
          <div className="px-2 pb-4 pt-2">
            {collapsed ? (
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-center text-red-400 hover:bg-red-900/30 cursor-pointer px-2 py-2 rounded-lg"
                    onClick={() => setLogoutOpen(true)}
                    aria-label="Logout"
                  >
                    <LogOut className="w-5 h-5" strokeWidth={2} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-gray-800 text-white text-sm px-3 py-1 rounded-md shadow-lg select-none border border-gray-700"
                >
                  Logout
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start text-red-400 hover:bg-red-900/30 cursor-pointer gap-2 rounded-lg px-4 py-2"
                onClick={() => setLogoutOpen(true)}
                aria-label="Logout"
                type="button"
              >
                <LogOut className="w-5 h-5" strokeWidth={2} />
                <span className="select-none">Logout</span>
              </Button>
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