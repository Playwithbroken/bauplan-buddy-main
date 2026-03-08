import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  FolderOpen, 
  Users, 
  Calendar,
  Receipt,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Mobile Bottom Navigation Bar
 * Only visible on mobile devices (< 768px)
 */
export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: FileText, label: 'Angebote', path: '/quotes' },
    { icon: FolderOpen, label: 'Projekte', path: '/projects' },
    { icon: Calendar, label: 'Termine', path: '/calendar' },
    { icon: MoreHorizontal, label: 'Mehr', path: '/menu' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                active 
                  ? 'text-primary' 
                  : 'text-muted-foreground active:text-primary'
              )}
            >
              <Icon className={cn(
                'h-5 w-5 mb-1',
                active && 'scale-110'
              )} />
              <span className={cn(
                'text-xs font-medium',
                active && 'font-semibold'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
