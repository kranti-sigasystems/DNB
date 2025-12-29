"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Menu, LogOut, X, ChevronDown, User, Sun, Moon } from "lucide-react";
import LogoutDialog from "../common/LogoutModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/use-auth";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onMenuClick: () => void;
  showSidebarButton?: boolean;
  isNoSidebarRoute?: boolean;
}

export default function Navbar({
  onMenuClick,
  showSidebarButton = true,
  isNoSidebarRoute = false,
}: NavbarProps) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const userRole = user?.userRole || "guest";
  const isBuyer = userRole === "buyer";

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const userNameRef = useRef<HTMLButtonElement>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number | null>(null);

  const navLinks = useMemo(() => {
    if (!isAuthenticated) {
      return [
        { label: "Onboard Process", path: "/onboard-process" },
        { label: "Contact", path: "/contact" },
      ];
    }
    // When authenticated, we can add authenticated user nav links here if needed
    return [];
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    setLogoutOpen(false);
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push("/login");
  };

  const handleDashboardCTA = () => {
    router.push(isAuthenticated ? "/dashboard" : "/login");
    setMobileMenuOpen(false);
  };

  const userName = user?.first_name
    ? `${user.first_name} ${user.last_name || ""}`.trim()
    : user?.name || user?.businessName || "";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    }

    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userDropdownOpen]);

  useEffect(() => {
    if (userNameRef.current) {
      const width = userNameRef.current.getBoundingClientRect().width;
      setDropdownWidth(width);
    }
  }, [userDropdownOpen]);

  if (isBuyer) {
    return null; // You can create a BuyerNavbar component if needed
  }

  return (
    <>
      <header
        className={cn(
          "w-full h-16 bg-background border-b border-border sticky top-0 z-50 transition-colors duration-300"
        )}
      >
        <div
          className={cn(
            "h-full flex items-center justify-between",
            isNoSidebarRoute ? "app-container" : "px-4 sm:px-6 lg:px-8"
          )}
        >
          {/* LEFT: Logo and menu button */}
          <div className="flex items-center">
            {showSidebarButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="lg:hidden mr-2 text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <Menu className="w-6 h-6" />
              </Button>
            )}
            <Link
              href="/"
              className={cn(
                "text-xl font-semibold text-foreground whitespace-nowrap",
                isNoSidebarRoute ? "ml-0" : "ml-2 lg:ml-0"
              )}
            >
              Digital Negotiation Book
            </Link>
          </div>

          {/* RIGHT: Navigation links and User Section */}
          <div className="flex items-center gap-6">
            {/* Desktop Navigation Links - Only show when there are links to display */}
            {navLinks.length > 0 && (
              <nav className="hidden lg:flex items-center gap-6 mr-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className="text-muted-foreground hover:text-foreground font-medium transition whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150 ease-out"
            >
              <div className="relative w-5 h-5">
                <Moon
                  className={cn(
                    "w-5 h-5 absolute inset-0 transition-all duration-150 ease-out",
                    theme === "light"
                      ? "opacity-100 rotate-0"
                      : "opacity-0 rotate-90"
                  )}
                />
                <Sun
                  className={cn(
                    "w-5 h-5 absolute inset-0 transition-all duration-150 ease-out",
                    theme === "dark"
                      ? "opacity-100 rotate-0"
                      : "opacity-0 -rotate-90"
                  )}
                />
              </div>
            </Button>

            {/* User Section */}
            <div className="flex items-center gap-4">
              {!isAuthenticated ? (
                <Button
                  onClick={handleDashboardCTA}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Login
                </Button>
              ) : (
                <div className="relative" ref={userDropdownRef}>
                  <button
                    ref={userNameRef}
                    onClick={() => setUserDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-accent transition cursor-pointer"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      {userName}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition ${
                        userDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown */}
                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 bg-popover rounded-lg shadow-lg border border-border z-60 py-2 min-w-[180px]"
                      style={{ width: dropdownWidth || "auto" }}
                    >
                      <div className="flex flex-col">
                        <Link
                          href="/profile"
                          className="w-full flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150 cursor-pointer rounded-lg text-left"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium">Profile</span>
                        </Link>
                        <button
                          onClick={() => setLogoutOpen(true)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-destructive hover:bg-destructive/10 transition-colors duration-150 cursor-pointer rounded-lg text-left"
                        >
                          <LogOut className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden">
          <div className="absolute top-0 right-0 w-72 h-full bg-background shadow-xl p-4 border-l border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Menu</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            {/* Mobile Navigation Links - Only show when there are links to display */}
            {navLinks.length > 0 && (
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-muted-foreground text-lg font-medium hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
            {/* Mobile Theme Toggle */}
            <div className="mt-4">
              <Button
                variant="ghost"
                onClick={toggleTheme}
                className="w-full flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-150 ease-out"
              >
                <div className="relative w-4 h-4">
                  <Moon
                    className={cn(
                      "w-4 h-4 absolute inset-0 transition-all duration-150 ease-out",
                      theme === "light"
                        ? "opacity-100 rotate-0"
                        : "opacity-0 rotate-90"
                    )}
                  />
                  <Sun
                    className={cn(
                      "w-4 h-4 absolute inset-0 transition-all duration-150 ease-out",
                      theme === "dark"
                        ? "opacity-100 rotate-0"
                        : "opacity-0 -rotate-90"
                    )}
                  />
                </div>
                <span className="transition-all duration-150 ease-out">
                  {theme === "light" ? "Dark Mode" : "Light Mode"}
                </span>
              </Button>
            </div>

            <div className="mt-6">
              {isAuthenticated ? (
                <Button
                  onClick={() => setLogoutOpen(true)}
                  variant="ghost"
                  className="w-full flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              ) : (
                <Button
                  onClick={handleDashboardCTA}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Dialog */}
      <LogoutDialog
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onLogout={handleLogout}
      />
    </>
  );
}
