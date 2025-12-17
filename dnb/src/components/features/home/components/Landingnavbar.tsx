'use client';

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import useAuth from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

/**
 * Props interface
 */
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const router = useRouter();
  const { isAuthenticated } = useAuth();

  /**
   * Redirect authenticated users to dashboard
   */
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  /**
   * Navigation links
   */
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
    <header
      className={cn(
        'w-full h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50'
      )}
    >
      {/* Wrapper Container */}
      <div className="h-full mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-2">
          {showSidebarButton && (
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
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
          <nav className=" lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className="text-gray-700  hover:text-gray-900 font-medium transition whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Login Button */}
          <Button className="button-styling whitespace-nowrap " asChild>
            <Link href="/login">Login </Link>
          </Button>

          {/* Mobile Menu Icon */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile menu"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 lg:hidden z-9000" role="dialog" aria-modal="true">
          <div
            className={cn(
              'absolute top-0 right-0 h-full w-72 bg-white p-5 shadow-xl',
              'transform transition-all duration-300 ease-out translate-x-0'
            )}
          >
            {/* Drawer Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Menu</h3>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Drawer Navigation */}
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

            {/* Login Button */}
            <div className="mt-8">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogin();
                }}
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
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
