import { Menu, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/components/Sidebar';
import { useState } from 'react';

interface MobileHeaderProps {
  title: string;
  showSearch?: boolean;
  onSearchClick?: () => void;
}

/**
 * Mobile Header with Hamburger Menu
 * Only visible on mobile devices (< 768px)
 */
export function MobileHeader({ title, showSearch, onSearchClick }: MobileHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header className="md:hidden sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Hamburger Menu */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px]">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Title */}
        <h1 className="text-lg font-semibold truncate flex-1 mx-3">
          {title}
        </h1>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {showSearch && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onSearchClick}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
          
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
