'use client';

import { useEffect, useMemo, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import useAuth from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

interface LandingNavbarProps {
  onMenuClick?: () => void;
  showSidebarButton?: boolean;
  isNoSidebarRoute?: boolean;
}

interface NavLink {
  label: string;
  path: string;
}

export default function LandingNavbar({
  onMenuClick,
  showSidebarButton = false,
  isNoSidebarRoute = true,
}: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const navLinks: NavLink[] = useMemo(
    () => [
      { label: 'Onboard Process', path: '/onboard-process' },
      { label: 'Contact', path: '/contact' },
    ],
    []
  );

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-2">
          {showSidebarButton && (
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
              onClick={onMenuClick}
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          )}

          <Link
            href="/"
            className="text-lg sm:text-xl font-semibold text-gray-900 whitespace-nowrap"
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
                className="text-gray-700 hover:text-gray-900 font-medium transition"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Login Button */}
          <div className="hidden lg:block">
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>

          {/* Mobile Menu Icon */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile menu"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />

          {/* Drawer */}
          <div className="relative ml-auto w-72 h-full bg-white shadow-xl p-5 flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Menu</h3>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-5 text-lg">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-800 font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Login */}
            <div className="mt-auto">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogin();
                }}
                className="w-full py-2 mt-6 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
