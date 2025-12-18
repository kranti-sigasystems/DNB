"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Menu, LogOut, X, ChevronDown, User } from "lucide-react";
import LogoutDialog from "../common/LogoutModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onMenuClick: () => void;
  showSidebarButton?: boolean;
  isNoSidebarRoute?: boolean;
}

export default function Navbar({ onMenuClick, showSidebarButton = true, isNoSidebarRoute = false }: NavbarProps) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const router = useRouter();;
  const { user, logout, isAuthenticated } = useAuth();
  
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
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
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
          "w-full h-16 bg-black border-b border-gray-900 sticky top-0 z-50",
          isNoSidebarRoute ? "px-4 sm:px-6 lg:px-8" : "px-4 sm:px-6 lg:px-10"
        )}
      >
        <div className="w-full h-full mx-auto flex items-center justify-between">
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
                "text-xl font-semibold text-white whitespace-nowrap",
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
                    className="text-gray-300 hover:text-white font-medium transition whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}

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
                    className="flex items-center gap-2 px-3 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition cursor-pointer"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-200">{userName}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition ${
                        userDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown */}
                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 bg-gray-900 rounded-lg shadow-lg border border-gray-700 z-60 py-2 min-w-[180px]"
                      style={{ width: dropdownWidth || "auto" }}
                    >
                      <div className="flex flex-col">
                        <Link
                          href="/profile"
                          className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-150 cursor-pointer rounded-lg text-left"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium">Profile</span>
                        </Link>
                        <button
                          onClick={() => setLogoutOpen(true)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-900/30 transition-colors duration-150 cursor-pointer rounded-lg text-left"
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
                className="lg:hidden text-gray-300 hover:text-white hover:bg-gray-800"
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
          <div className="absolute top-0 right-0 w-72 h-full bg-gray-900 shadow-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Menu</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
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
                    className="text-gray-300 text-lg font-medium hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
            <div className="mt-6">
              {isAuthenticated ? (
                <Button
                  onClick={() => setLogoutOpen(true)}
                  variant="ghost"
                  className="w-full flex items-center gap-2 px-4 py-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              ) : (
                <Button
                  onClick={handleDashboardCTA}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
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