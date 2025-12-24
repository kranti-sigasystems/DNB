'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import LogoutDialog from '../common/LogoutModal';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import useAuth from '@/hooks/use-auth';

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

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const userRole = user?.userRole || 'guest';

  if (userRole === 'buyer') {
    return null;
  }

  const businessName = user?.businessName || '';

  const handleLogout = () => {
    logout();
    router.push('/login');
    if (onClose) onClose();
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    ...(userRole === 'super_admin'
      ? [{ name: 'Business Owners', icon: Users, path: '/users' }]
      : userRole === 'business_owner'
        ? [{ name: 'Buyers', icon: Users, path: '/users' }]
        : []),
    ...(userRole === 'business_owner'
      ? [
          { name: 'Products', icon: Fish, path: '/products' },
          { name: 'Offer Drafts', icon: ClipboardList, path: '/offer-draft' },
          { name: 'Offers', icon: Tag, path: '/offers' },
          { name: 'Locations', icon: Globe, path: '/location' },
          { name: 'Profile', icon: User, path: '/profile' },
        ]
      : []),
    ...(userRole === 'super_admin'
      ? [{ name: 'Payment List', icon: CreditCard, path: '/payments-list' }]
      : []),
  ];

  // Function to check if a navigation item is active
  const isNavItemActive = (navPath: string) => {
    if (pathname === navPath) return true;
    
    // Check if current path starts with the nav path (for sub-pages)
    if (pathname.startsWith(navPath + '/')) return true;
    
    return false;
  };

  return (
    <>
      <TooltipProvider>
        <aside
          className={cn(
            'fixed top-0 left-0 h-screen bg-black border-r border-gray-800 shadow-xl flex flex-col transition-all duration-300 z-50',
            collapsed ? 'w-16' : 'w-64'
          )}
          style={{ pointerEvents: 'auto' }}
        >
          {/* Header */}
          <div className="h-16 border-b border-gray-800 select-none relative">
            {!collapsed && (
              <div className="flex items-center justify-between px-4 h-full">
                <div className="flex flex-col max-w-[180px] truncate">
                  <h2 className="text-2xl font-extrabold text-blue-400 truncate">DNB</h2>
                  {businessName && (
                    <span className="text-sm font-medium text-gray-400 truncate">
                      {businessName}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCollapse}
                  className="cursor-pointer hover:bg-gray-800 rounded text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center hidden lg:flex"
                  aria-label="Collapse sidebar"
                  type="button"
                >
                  <ChevronRight className="w-4 h-4 transition-transform rotate-180" strokeWidth={2.5} />
                </Button>
              </div>
            )}
            
            {collapsed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCollapse}
                  className="cursor-pointer hover:bg-gray-800 rounded text-gray-400 hover:text-white w-10 h-10 flex items-center justify-center"
                  aria-label="Expand sidebar"
                  type="button"
                >
                  <ChevronRight className="w-5 h-5 transition-transform" strokeWidth={2.5} />
                </Button>
              </div>
            )}
            
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="lg:hidden cursor-pointer p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white absolute top-4 right-4"
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
                {navItems.map(({ name, icon: Icon, path }) => {
                  const isActive = isNavItemActive(path);
                  
                  return (
                    <Tooltip key={name} delayDuration={100}>
                      <TooltipTrigger asChild>
                        <div className="w-16 h-10 flex items-center justify-center">
                          <Link
                            href={path}
                            className={cn(
                              "flex items-center justify-center rounded-lg w-10 h-10 transition-all duration-200 select-none cursor-pointer relative block no-underline pl-[10px] pt-[10px]",
                              isActive
                                ? "bg-blue-600 text-white shadow-lg"
                                : "text-gray-400 hover:text-white hover:bg-gray-800"
                            )}
                            onClick={() => {
                              if (onClose) onClose();
                            }}
                          >
                            <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                          </Link>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="bg-gray-900 text-white text-sm px-3 py-1 rounded-md shadow-lg select-none border border-gray-700"
                      >
                        {name}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 space-y-1">
                {navItems.map(({ name, icon: Icon, path }) => {
                  const isActive = isNavItemActive(path);
                  
                  return (
                    <Link
                      key={name}
                      href={path}
                      className={cn(
                        "flex items-center rounded-lg text-sm font-medium w-full h-12 transition-all duration-200 select-none cursor-pointer relative block no-underline",
                        isActive
                          ? "bg-blue-600 text-white shadow-lg"
                          : "text-gray-300 hover:text-white hover:bg-gray-800"
                      )}
                      onClick={() => {
                        if (onClose) onClose();
                      }}
                    >
                      <div className="flex items-center w-full h-full px-3">
                        <Icon className="w-5 h-5 shrink-0 mr-3" strokeWidth={2} />
                        <span className="truncate font-medium flex-1">{name}</span>
                        {isActive && (
                          <div className="w-2 h-2 bg-blue-300 rounded-full ml-2"></div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          <Separator className="my-4 bg-gray-800" />

          {/* Footer / Logout */}
          <div className="pb-4 pt-2">
            {collapsed ? (
              <div className="flex items-center justify-center">
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div className="w-16 h-10 flex items-center justify-center">
                      <Button
                        variant="ghost"
                        className="w-10 h-10 justify-center text-red-400 hover:bg-red-900/20 hover:text-red-300 cursor-pointer rounded-lg"
                        onClick={() => {
                          setLogoutOpen(true);
                        }}
                        aria-label="Logout"
                      >
                        <LogOut className="w-5 h-5" strokeWidth={2} />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-gray-900 text-white text-sm px-3 py-1 rounded-md shadow-lg select-none border border-gray-700"
                  >
                    Logout
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <div className="px-4">
                <Button
                  variant="ghost"
                  className="w-full h-12 justify-start text-red-400 hover:bg-red-900/20 hover:text-red-300 cursor-pointer rounded-lg"
                  onClick={() => {
                    setLogoutOpen(true);
                  }}
                  aria-label="Logout"
                  type="button"
                >
                  <div className="flex items-center w-full h-full px-3">
                    <LogOut className="w-5 h-5 shrink-0 mr-3" strokeWidth={2} />
                    <span className="select-none font-medium flex-1">Logout</span>
                  </div>
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