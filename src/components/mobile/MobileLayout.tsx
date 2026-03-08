import { ReactNode } from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
  showSearch?: boolean;
  onSearchClick?: () => void;
  className?: string;
}

/**
 * Mobile-optimized layout wrapper
 * Includes header and bottom navigation
 */
export function MobileLayout({
  children,
  title,
  showSearch,
  onSearchClick,
  className,
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:block">
      <MobileHeader 
        title={title} 
        showSearch={showSearch}
        onSearchClick={onSearchClick}
      />
      
      <main className={cn(
        'flex-1 pb-20 md:pb-0', // Extra padding for bottom nav on mobile
        className
      )}>
        {children}
      </main>
      
      <MobileBottomNav />
    </div>
  );
}
