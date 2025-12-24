'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function LoadingBar() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    let completeTimer: NodeJS.Timeout;

    if (isLoading) {
      // Start progress immediately
      setProgress(20);
      
      // Faster progress simulation
      progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) return prev;
          return prev + Math.random() * 15;
        });
      }, 50); // Much faster updates

      // Complete faster
      completeTimer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 150); // Faster completion
      }, 800); // Shorter duration
    }

    return () => {
      if (progressTimer) clearInterval(progressTimer);
      if (completeTimer) clearTimeout(completeTimer);
    };
  }, [isLoading]);

  // Listen for navigation with optimized detection
  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
      setProgress(0);
    };

    const handleComplete = () => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 150);
    };

    // Optimized link detection
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.target && !link.download) {
        const url = new URL(link.href);
        const currentUrl = new URL(window.location.href);
        
        // Only show loading for different pages
        if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
          // Immediate visual feedback
          requestAnimationFrame(() => {
            handleStart();
          });
        }
      }
    };

    // Use capture phase for faster detection
    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, []);

  // Complete on pathname change
  useEffect(() => {
    if (isLoading) {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 150);
    }
  }, [pathname]);

  if (!isLoading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-blue-100/20 dark:bg-blue-900/10">
      <div 
        className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 transition-all duration-100 ease-out shadow-sm"
        style={{
          width: `${progress}%`,
          opacity: isLoading ? 1 : 0,
          transform: `scaleX(${progress / 100})`,
          transformOrigin: 'left',
        }}
      />
    </div>
  );
}