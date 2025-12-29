'use client';

import { useMemo, useState } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/button';

interface CheckoutNavbarProps {
  onMenuClick?: () => void;
  showSidebarButton?: boolean;
}

interface NavLink {
  label: string;
  path: string;
}

export default function CheckoutNavbar({
  onMenuClick,
  showSidebarButton = false,
}: CheckoutNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navLinks: NavLink[] = useMemo(
    () => [
      { label: 'Plans', path: '/plans' },
      { label: 'Contact', path: '/contact' },
    ],
    []
  );

  return (
    <header className="w-full sticky top-0 z-50 bg-background border-b border-border shadow-sm transition-colors duration-300">
      <div className="app-container h-16 flex items-center justify-between">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-2">
          {showSidebarButton && (
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-accent transition"
              onClick={onMenuClick}
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6 text-foreground" />
            </button>
          )}

          <Link
            href="/"
            className="text-lg sm:text-xl font-semibold text-foreground whitespace-nowrap"
          >
            Digital Negotiation Book
          </Link>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-4">
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className="text-muted-foreground hover:text-foreground font-medium transition"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>

          {/* Mobile Menu Icon */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile menu"
          >
            <Menu className="w-6 h-6 text-foreground" />
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />

          {/* Drawer */}
          <div className="relative ml-auto w-72 h-full bg-background shadow-xl p-5 flex flex-col overflow-y-auto border-l border-border">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-foreground">Menu</h3>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-accent transition"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-foreground" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-5 text-lg">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-muted-foreground hover:text-foreground font-medium transition"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Theme Toggle */}
            <div className="mt-4">
              <Button
                variant="ghost"
                onClick={toggleTheme}
                className="w-full flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-4 h-4" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4" />
                    Light Mode
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
