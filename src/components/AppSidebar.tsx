import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Building,
  LayoutDashboard,
  FolderOpen,
  FileText,
  Receipt,
  CheckCircle,
  Calendar,
  Users,
  FileImage,
  Users2,
  BarChart3,
  HardHat,
  Settings,
  LogOut,
  ChevronUp,
  User2,
  Truck,
  MessageCircle,
  Keyboard,
  HelpCircle,
  Warehouse,
  Sun,
  Moon,
  Monitor,
  Palette,
  Contrast,
  Check,
  Calculator,
} from "lucide-react";

import LanguageSelector from "@/components/LanguageSelector";
import { TeamPresence } from "@/components/realtime";
import { SearchForm } from "@/components/search-form";
import { KeyboardShortcutsPanel } from "@/components/ui/keyboard-shortcuts-panel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMobileUI } from "@/hooks/useMobileUI";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/use-toast";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { isMobile, triggerHapticFeedback } = useMobileUI();
  const { theme, isHighContrast, setTheme, toggleHighContrast } = useTheme();
  const { toast } = useToast();
  const [isShortcutsOpen, setIsShortcutsOpen] = React.useState(false);

  const handleLogout = () => {
    triggerHapticFeedback(10);
    logout();
  };

  const handleNavigation = () => {
    if (isMobile) {
      triggerHapticFeedback(10);
    }
  };

  const navigationItems = [
    {
      title: t("navigation.mainSection"),
      items: [
        {
          title: t("navigation.dashboard"),
          url: "/dashboard",
          icon: LayoutDashboard,
          description: t("navigation.dashboardDesc"),
        },
        {
          title: t("navigation.projects"),
          url: "/projects",
          icon: FolderOpen,
          description: t("navigation.projectsDesc"),
        },
        {
          title: t("navigation.quotes"),
          url: "/quotes",
          icon: FileText,
          description: t("navigation.quotesDesc"),
        },
        {
          title: "Auftragsbestätigungen",
          url: "/order-confirmations",
          icon: CheckCircle,
          description: "Verwaltung und Übersicht aller Auftragsbestätigungen",
        },
        {
          title: t("navigation.invoices"),
          url: "/invoices",
          icon: Receipt,
          description: t("navigation.invoicesDesc"),
        },
        {
          title: "Lieferscheine",
          url: "/delivery-notes",
          icon: Truck,
          description: "Verwaltung und Übersicht aller Lieferscheine",
        },
      ],
    },
    {
      title: t("navigation.scheduling"),
      items: [
        {
          title: t("navigation.calendar"),
          url: "/calendar",
          icon: Calendar,
          description: t("navigation.calendarDesc"),
        },
        {
          title: "Team-Chat",
          url: "/chat",
          icon: MessageCircle,
          description: "Echtzeitchat für Teams und Projektkoordination",
        },
        {
          title: t("navigation.customers"),
          url: "/customers",
          icon: Users,
          description: t("navigation.customersDesc"),
        },
        {
          title: t("navigation.suppliers"),
          url: "/suppliers",
          icon: Truck,
          description: t("navigation.suppliersDesc"),
        },
        {
          title: t("navigation.documents"),
          url: "/documents",
          icon: FileImage,
          description: t("navigation.documentsDesc"),
        },
        {
          title: t("navigation.teams"),
          url: "/teams",
          icon: Users2,
          description: t("navigation.teamsDesc"),
        },
      ],
    },
    {
      title: t("navigation.analysis"),
      items: [
        {
          title: t("navigation.analytics"),
          url: "/analytics",
          icon: BarChart3,
          description: t("navigation.analyticsDesc"),
        },
        {
          title: "BWA",
          url: "/bwa",
          icon: Calculator,
          description: "Betriebswirtschaftliche Auswertung",
        },
        {
          title: t("navigation.procurement"),
          url: "/procurement",
          icon: Warehouse,
          description: t("navigation.procurementDesc"),
        },
        {
          title: t("navigation.fieldService"),
          url: "/field",
          icon: HardHat,
          description: t("navigation.fieldServiceDesc"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          title: "Dokumentation",
          url: "/documentation",
          icon: HelpCircle,
          description: "Hilfe und Anleitungen für Bauplan Buddy",
        },
      ],
    },
  ];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Building className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Bauplan Buddy</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="flex items-center gap-2 px-4 py-2">
          <TeamPresence />
        </div>
        <SearchForm />
      </SidebarHeader>

      <SidebarContent>
        {navigationItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.description}
                        className={isMobile ? "mobile-button touch-target" : ""}
                      >
                        <Link to={item.url} onClick={() => handleNavigation()}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <LanguageSelector />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={`data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ${
                    isMobile ? "mobile-button touch-target" : ""
                  }`}
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <User2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.firstName
                        ? `${user.firstName} ${user.lastName || ""}`
                        : (user as any)?.name || t("common.user")}
                    </span>
                    <span className="truncate text-xs">
                      {user?.email || "admin@bauplan-buddy.de"}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link
                    to="/settings"
                    className="flex w-full items-center"
                    onClick={handleNavigation}
                  >
                    <Settings className="mr-2 size-4" />
                    <span>{t("common.settings")}</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem onSelect={() => setIsShortcutsOpen(true)}>
                  <Keyboard className="mr-2 size-4" />
                  <span>Tastenkürzel</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Palette className="mr-2 size-4" />
                    <span>Erscheinungsbild</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onSelect={() => {
                        setTheme("light");
                        toast({
                          title: "Theme geändert",
                          description: "Heller Modus aktiviert",
                          duration: 1800,
                        });
                      }}
                    >
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Hell</span>
                      {theme === "light" && !isHighContrast && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        setTheme("dark");
                        toast({
                          title: "Theme geändert",
                          description: "Dunkler Modus aktiviert",
                          duration: 1800,
                        });
                      }}
                    >
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Dunkel</span>
                      {theme === "dark" && !isHighContrast && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        setTheme("system");
                        toast({
                          title: "Theme geändert",
                          description: "Systemmodus aktiviert",
                          duration: 1800,
                        });
                      }}
                    >
                      <Monitor className="mr-2 h-4 w-4" />
                      <span>System</span>
                      {theme === "system" && !isHighContrast && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => {
                        toggleHighContrast();
                        toast({
                          title: "Kontrastmodus",
                          description: isHighContrast
                            ? "Hoher Kontrast deaktiviert"
                            : "Hoher Kontrast aktiviert",
                          duration: 1500,
                        });
                      }}
                    >
                      <Contrast className="mr-2 h-4 w-4" />
                      <span>Hoher Kontrast</span>
                      {isHighContrast && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 size-4" />
                  <span>{t("common.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <KeyboardShortcutsPanel
        open={isShortcutsOpen}
        onOpenChange={setIsShortcutsOpen}
      />
    </Sidebar>
  );
}
