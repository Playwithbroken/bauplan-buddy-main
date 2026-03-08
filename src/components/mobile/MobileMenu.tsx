import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  FileText,
  FolderOpen,
  Users,
  Calendar,
  Receipt,
  Package,
  Truck,
  ClipboardList,
  Settings,
  LogOut,
  User,
  Building,
  Moon,
  Sun,
  Palette,
  Contrast,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/hooks/useTheme';

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { baseTheme, setTheme, isHighContrast, setHighContrast } = useTheme();

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const menuItems = [
    { icon: FileText, label: 'Angebote', path: '/quotes' },
    { icon: FolderOpen, label: 'Projekte', path: '/projects' },
    { icon: Receipt, label: 'Rechnungen', path: '/invoices' },
    { icon: Calendar, label: 'Termine', path: '/calendar' },
    { icon: Users, label: 'Kunden', path: '/customers' },
    { icon: Building, label: 'Lieferanten', path: '/suppliers' },
    { icon: Package, label: 'Inventar', path: '/inventory' },
    { icon: Truck, label: 'Lieferscheine', path: '/delivery' },
    { icon: ClipboardList, label: 'Auftragsbestätigungen', path: '/order-confirmations' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-left">{user?.name || 'Benutzer'}</SheetTitle>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </SheetHeader>

        <Separator />

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          <Separator className="my-4" />

          {/* Theme Toggle */}
          <div className="space-y-1">
            <p className="px-4 py-2 text-sm font-medium text-muted-foreground">
              Erscheinungsbild
            </p>
            <div className="grid grid-cols-3 gap-2 px-4">
              <Button
                variant={baseTheme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <Sun className="h-4 w-4" />
                <span className="text-xs">Hell</span>
              </Button>
              <Button
                variant={baseTheme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <Moon className="h-4 w-4" />
                <span className="text-xs">Dunkel</span>
              </Button>
              <Button
                variant={baseTheme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <Palette className="h-4 w-4" />
                <span className="text-xs">System</span>
              </Button>
            </div>
            <Button
              variant={isHighContrast ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHighContrast(!isHighContrast)}
              className="flex items-center justify-center gap-2 mx-4 h-auto py-3"
            >
              <Contrast className="h-4 w-4" />
              <span className="text-xs">Hoher Kontrast</span>
            </Button>
          </div>
        </nav>

        <Separator />

        {/* Bottom Actions */}
        <div className="p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigate('/settings')}
          >
            <Settings className="h-5 w-5 mr-3" />
            Einstellungen
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={() => {
              logout();
              onOpenChange(false);
            }}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Abmelden
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
