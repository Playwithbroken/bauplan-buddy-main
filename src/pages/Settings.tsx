import React, { useState, useEffect } from "react";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Settings as SettingsIcon,
  Hash,
  Bell,
  Shield,
  Database,
  User,
  Mail,
  FileText,
  Calendar,
  ArrowRight,
  Palette,
  Eye,
  Zap,
  Accessibility,
  Wand2,
  Building2,
  XCircle,
  ArrowLeft,
  Home,
  Maximize2,
  Minimize2,
  CreditCard,
} from "lucide-react";
import { DocumentNumberingManager } from "@/components/dialogs/DocumentNumberingManager";
import IntegrationSettingsDialog, {
  IntegrationSection,
} from "@/components/dialogs/IntegrationSettingsDialog";
import TemplateUploadDialog from "@/components/dialogs/TemplateUploadDialog";
import UserManagementDialog from "@/components/dialogs/UserManagementDialog";
import BackupSecurityDialog from "@/components/dialogs/BackupSecurityDialog";
import NotificationSettingsDialog from "@/components/dialogs/NotificationSettingsDialog";
import EmailSettingsDialog from "@/components/dialogs/EmailSettingsDialog";
import PresetsManagerDialog from "@/components/dialogs/PresetsManagerDialog";
import AccessibilityPanel from "@/components/AccessibilityPanel";
import { useToast } from "@/hooks/use-toast";

// Helper function to extract dominant colors from an image
const extractColorsFromImage = (
  imageData: string
): Promise<{ primary: string; secondary: string; accent: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({
          primary: "#3B82F6",
          secondary: "#8B5CF6",
          accent: "#10B981",
        });
        return;
      }

      canvas.width = 100;
      canvas.height = 100;
      ctx.drawImage(img, 0, 0, 100, 100);

      const imageDataObj = ctx.getImageData(0, 0, 100, 100);
      const pixels = imageDataObj.data;
      const colorMap: { [key: string]: number } = {};

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        if (
          a < 128 ||
          (r > 240 && g > 240 && b > 240) ||
          (r < 15 && g < 15 && b < 15)
        ) {
          continue;
        }

        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;
        const key = `${qr},${qg},${qb}`;

        colorMap[key] = (colorMap[key] || 0) + 1;
      }

      const sortedColors = Object.entries(colorMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([color]) => {
          const [r, g, b] = color.split(",").map(Number);
          return { r, g, b };
        });

      if (sortedColors.length === 0) {
        resolve({
          primary: "#3B82F6",
          secondary: "#8B5CF6",
          accent: "#10B981",
        });
        return;
      }

      const toHex = (r: number, g: number, b: number) => {
        return (
          "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")
        );
      };

      const enhanceColor = (r: number, g: number, b: number) => {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;
        const s =
          max === min
            ? 0
            : l > 0.5
            ? (max - min) / (2 - max - min)
            : (max - min) / (max + min);

        if (s < 0.3) {
          const boost = 1.5;
          const avg = (r + g + b) / 3;
          r = Math.min(255, Math.round(avg + (r - avg) * boost));
          g = Math.min(255, Math.round(avg + (g - avg) * boost));
          b = Math.min(255, Math.round(avg + (b - avg) * boost));
        }
        return { r, g, b };
      };

      const color1 = enhanceColor(
        sortedColors[0].r,
        sortedColors[0].g,
        sortedColors[0].b
      );
      const color2 = sortedColors[1]
        ? enhanceColor(sortedColors[1].r, sortedColors[1].g, sortedColors[1].b)
        : color1;
      const color3 = sortedColors[2]
        ? enhanceColor(sortedColors[2].r, sortedColors[2].g, sortedColors[2].b)
        : color2;

      resolve({
        primary: toHex(color1.r, color1.g, color1.b),
        secondary: toHex(color2.r, color2.g, color2.b),
        accent: toHex(color3.r, color3.g, color3.b),
      });
    };
    img.src = imageData;
  });
};

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "general"
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<
    "light" | "dark" | "high-contrast" | "high-contrast-dark"
  >(
    (localStorage.getItem("theme") as
      | "light"
      | "dark"
      | "high-contrast"
      | "high-contrast-dark") || "light"
  );
  const [density, setDensity] = useState<
    "compact" | "comfortable" | "spacious"
  >(
    (localStorage.getItem("density") as
      | "compact"
      | "comfortable"
      | "spacious") || "comfortable"
  );
  const [reducedMotion, setReducedMotion] = useState(
    localStorage.getItem("reducedMotion") === "true"
  );

  // Brand colors state
  const [brandColors, setBrandColors] = useState({
    primary: localStorage.getItem("brandColor_primary") || "#3B82F6",
    secondary: localStorage.getItem("brandColor_secondary") || "#8B5CF6",
    accent: localStorage.getItem("brandColor_accent") || "#10B981",
  });

  // Logo state
  const [companyLogo, setCompanyLogo] = useState<string | null>(
    localStorage.getItem("bauplan_company_logo")
  );

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  // Apply theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "hc");
    root.removeAttribute("data-theme");

    if (theme === "high-contrast") {
      root.classList.add("hc");
      root.setAttribute("data-theme", "high-contrast");
    } else if (theme === "high-contrast-dark") {
      root.classList.add("hc", "dark");
      root.setAttribute("data-theme", "high-contrast-dark");
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Apply density changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(
      "density-compact",
      "density-comfortable",
      "density-spacious"
    );
    root.classList.add(`density-${density}`);
    localStorage.setItem("density", density);
  }, [density]);

  // Apply motion preferences
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-reduced-motion",
      reducedMotion ? "true" : "false"
    );
    localStorage.setItem("reducedMotion", reducedMotion.toString());
  }, [reducedMotion]);

  // Apply brand colors
  useEffect(() => {
    localStorage.setItem("brandColor_primary", brandColors.primary);
    localStorage.setItem("brandColor_secondary", brandColors.secondary);
    localStorage.setItem("brandColor_accent", brandColors.accent);
    // Note: For full brand color implementation, you would also update CSS variables here
  }, [brandColors]);
  const [showNumberingManager, setShowNumberingManager] = useState(false);
  const [showIntegrationManager, setShowIntegrationManager] = useState(false);
  const [integrationSection, setIntegrationSection] =
    useState<IntegrationSection>("calendar");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showBackupSecurity, setShowBackupSecurity] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [showPresetsManager, setShowPresetsManager] = useState(false);

  const settingsCards = [
    {
      id: "presets",
      title: "Vorlagen & Presets",
      description:
        "Haeufig verwendete Leistungen, Fahrtkosten und Stundenloehne",
      icon: <FileText className="h-6 w-6" />,
      color: "blue",
      action: () => setShowPresetsManager(true),
      items: [
        "Leistungsvorlagen",
        "Fahrtkosten",
        "Stundenloehne",
        "Schnelleingabe",
      ],
    },
    {
      id: "numbering",
      title: "Nummernkreise",
      description:
        "Verwalten Sie die automatische Nummerierung fuer alle Dokumenttypen",
      icon: <Hash className="h-6 w-6" />,
      color: "blue",
      action: () => setShowNumberingManager(true),
      items: [
        "Rechnungsnummern (AR-YYYY-NNNNNN)",
        "Angebotsnummern (ANG-YYYY-NNN)",
        "Auftragsbestaetigungen (AB-YYYY-NNNNNN)",
        "Eingangsrechnungen (ER-YYYY-NNNNNN)",
        "Projektnummern (PRJ-YYYY-NNN)",
        "Kundennummern (CUST-NNN)",
      ],
    },
    {
      id: "notifications",
      title: "Benachrichtigungen",
      description: "E-Mail und Push-Benachrichtigungen konfigurieren",
      icon: <Bell className="h-6 w-6" />,
      color: "yellow",
      action: () => setShowNotifications(true),
      items: [
        "E-Mail Benachrichtigungen",
        "Faelligkeitserinnerungen",
        "Projekt-Updates",
        "System-Nachrichten",
      ],
    },
    {
      id: "users",
      title: "Benutzerverwaltung",
      description: "Benutzerkonten und Berechtigungen verwalten",
      icon: <User className="h-6 w-6" />,
      color: "green",
      action: () => setShowUserManagement(true),
      items: [
        "Benutzer hinzufuegen/entfernen",
        "Rollen und Berechtigungen",
        "Zugriffskontrolle",
        "Passwort-Richtlinien",
      ],
    },
    {
      id: "email",
      title: "E-Mail Einstellungen",
      description: "SMTP-Server und E-Mail-Vorlagen konfigurieren",
      icon: <Mail className="h-6 w-6" />,
      color: "purple",
      action: () => setShowEmailSettings(true),
      items: [
        "SMTP-Konfiguration",
        "E-Mail-Vorlagen",
        "Absenderadresse",
        "Signatur-Einstellungen",
      ],
    },
    {
      id: "documents",
      title: "Dokumentvorlagen",
      description: "PDF-Vorlagen und Druckeinstellungen verwalten",
      icon: <FileText className="h-6 w-6" />,
      color: "indigo",
      action: () => setShowTemplateDialog(true),
      items: [
        "Rechnungsvorlagen",
        "Angebotsvorlagen",
        "Firmenlogos",
        "Druckeinstellungen",
      ],
    },
    {
      id: "backup",
      title: "Backup & Sicherheit",
      description: "Datensicherung und Sicherheitseinstellungen",
      icon: <Shield className="h-6 w-6" />,
      color: "red",
      action: () => setShowBackupSecurity(true),
      items: [
        "Automatische Backups",
        "Datenexport",
        "Sicherheitsrichtlinien",
        "Audit-Protokolle",
      ],
    },
    {
      id: "supabase",
      title: "Supabase Integration",
      description: "Cloud-Datenbank und Authentifizierung",
      icon: <Database className="h-6 w-6" />,
      color: "green",
      action: () => console.log("Open Supabase settings"),
      items: [
        "Verbindungsstatus",
        "Datensynchronisation",
        "Cloud-Backup",
        "Multi-Device Sync",
      ],
    },
    {
      id: "billing",
      title: "Abrechnung & Abo",
      description: "Zahlungsmethoden, Rechnungen und Abo-Verwaltung",
      icon: <CreditCard className="h-6 w-6" />,
      color: "purple",
      action: () => navigate("/settings/billing"),
      items: [
        "Aktueller Plan",
        "Zahlungsmethoden",
        "Rechnungsverlauf",
        "Upgrade-Optionen",
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const classes = {
      blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
      yellow: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
      green: "text-green-600 bg-green-50 dark:bg-green-900/20",
      purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
      indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
      red: "text-red-600 bg-red-50 dark:bg-red-900/20",
    };
    return classes[color as keyof typeof classes] || classes.blue;
  };

  const pageWrapperClass = isFullscreen
    ? "fixed inset-0 z-50 bg-background overflow-auto p-6"
    : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8";
  const contentWrapperClass = isFullscreen
    ? "space-y-6 max-h-[calc(100vh-220px)] overflow-auto pr-1"
    : "space-y-6";
  const tabsListClass = isFullscreen
    ? "sticky top-0 z-20 grid w-full grid-cols-6 h-14 p-2 rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border/60"
    : "grid w-full grid-cols-6 h-14 p-2 bg-muted/50 rounded-lg";

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Einstellungen" },
      ]}
    >
      <div className={contentWrapperClass}>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className={tabsListClass}>
            <TabsTrigger
              value="general"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Allgemein
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Darstellung
            </TabsTrigger>
            <TabsTrigger
              value="accessibility"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Barrierefreiheit
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Dokumente
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Integrationen
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Erweitert
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-6">
            <div className="grid gap-6">
              {/* Theme Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-purple-600" />
                    Farbschema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Waehlen Sie das Farbschema, das am besten zu Ihren
                    Praeferenzen passt.
                  </p>
                  <RadioGroup
                    value={theme}
                    onValueChange={(value: string) =>
                      setTheme(value as typeof theme)
                    }
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                        onClick={() => setTheme("light")}
                      >
                        <RadioGroupItem value="light" id="theme-light" />
                        <Label
                          htmlFor="theme-light"
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">Hell</div>
                          <div className="text-sm text-muted-foreground">
                            Klassisches helles Design
                          </div>
                        </Label>
                      </div>
                      <div
                        className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                        onClick={() => setTheme("dark")}
                      >
                        <RadioGroupItem value="dark" id="theme-dark" />
                        <Label
                          htmlFor="theme-dark"
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">Dunkel</div>
                          <div className="text-sm text-muted-foreground">
                            Augenfreundlich bei Nacht
                          </div>
                        </Label>
                      </div>
                      <div
                        className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                        onClick={() => setTheme("high-contrast")}
                      >
                        <RadioGroupItem value="high-contrast" id="theme-hc" />
                        <Label
                          htmlFor="theme-hc"
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">
                            Hoher Kontrast (Hell)
                          </div>
                          <div className="text-sm text-muted-foreground">
                            WCAG AAA konform
                          </div>
                        </Label>
                      </div>
                      <div
                        className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                        onClick={() => setTheme("high-contrast-dark")}
                      >
                        <RadioGroupItem
                          value="high-contrast-dark"
                          id="theme-hc-dark"
                        />
                        <Label
                          htmlFor="theme-hc-dark"
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">
                            Hoher Kontrast (Dunkel)
                          </div>
                          <div className="text-sm text-muted-foreground">
                            WCAG AAA konform
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Brand Colors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-pink-600" />
                    Firmenfarben
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Passen Sie die Farben Ihrer App an Ihr Corporate Design an.
                  </p>

                  {/* Logo Upload with Auto Color Extraction */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Firmenlogo
                      <Badge variant="secondary" className="text-xs">
                        <Wand2 className="h-3 w-3 mr-1" />
                        Auto-Farbextraktion
                      </Badge>
                    </Label>
                    <div className="flex items-center gap-4">
                      {companyLogo ? (
                        <div className="relative group">
                          <img
                            src={companyLogo}
                            alt="Firmenlogo"
                            className="h-24 w-24 object-contain border-2 rounded-lg"
                          />
                          <button
                            onClick={() => {
                              setCompanyLogo(null);
                              localStorage.removeItem("bauplan_company_logo");
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          id="settings-logo-upload"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                const logoData = reader.result as string;
                                setCompanyLogo(logoData);
                                localStorage.setItem(
                                  "bauplan_company_logo",
                                  logoData
                                );

                                // Auto-extract colors from logo
                                try {
                                  const extractedColors =
                                    await extractColorsFromImage(logoData);
                                  setBrandColors({
                                    primary: extractedColors.primary,
                                    secondary: extractedColors.secondary,
                                    accent: extractedColors.accent,
                                  });

                                  toast({
                                    title: "Farben automatisch extrahiert!",
                                    description:
                                      "Wir haben die Hauptfarben aus Ihrem Logo erkannt und angewendet. Sie koennen diese jederzeit manuell anpassen.",
                                  });
                                } catch (error) {
                                  console.error(
                                    "Color extraction failed:",
                                    error
                                  );
                                  toast({
                                    title: "Logo hochgeladen",
                                    description:
                                      "Logo wurde gespeichert. Farben koennen Sie manuell anpassen.",
                                  });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document
                              .getElementById("settings-logo-upload")
                              ?.click()
                          }
                          className="w-full"
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          {companyLogo
                            ? "Logo aendern & Farben extrahieren"
                            : "Logo hochladen & Farben extrahieren"}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Beim Upload werden automatisch die Hauptfarben erkannt
                          und als Firmenfarben uebernommen.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4" />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Primary Color */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Primaerfarbe
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={brandColors.primary}
                          onChange={(e) =>
                            setBrandColors({
                              ...brandColors,
                              primary: e.target.value,
                            })
                          }
                          className="h-10 w-16 border-2 rounded cursor-pointer"
                        />
                        <Input
                          value={brandColors.primary}
                          onChange={(e) =>
                            setBrandColors({
                              ...brandColors,
                              primary: e.target.value,
                            })
                          }
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                      <div
                        className="h-8 rounded"
                        style={{ backgroundColor: brandColors.primary }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Hauptfarbe fuer Buttons & Links
                      </p>
                    </div>

                    {/* Secondary Color */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Sekundaerfarbe
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={brandColors.secondary}
                          onChange={(e) =>
                            setBrandColors({
                              ...brandColors,
                              secondary: e.target.value,
                            })
                          }
                          className="h-10 w-16 border-2 rounded cursor-pointer"
                        />
                        <Input
                          value={brandColors.secondary}
                          onChange={(e) =>
                            setBrandColors({
                              ...brandColors,
                              secondary: e.target.value,
                            })
                          }
                          placeholder="#8B5CF6"
                          className="flex-1"
                        />
                      </div>
                      <div
                        className="h-8 rounded"
                        style={{ backgroundColor: brandColors.secondary }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Fuer Akzente & Hervorhebungen
                      </p>
                    </div>

                    {/* Accent Color */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Akzentfarbe</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={brandColors.accent}
                          onChange={(e) =>
                            setBrandColors({
                              ...brandColors,
                              accent: e.target.value,
                            })
                          }
                          className="h-10 w-16 border-2 rounded cursor-pointer"
                        />
                        <Input
                          value={brandColors.accent}
                          onChange={(e) =>
                            setBrandColors({
                              ...brandColors,
                              accent: e.target.value,
                            })
                          }
                          placeholder="#10B981"
                          className="flex-1"
                        />
                      </div>
                      <div
                        className="h-8 rounded"
                        style={{ backgroundColor: brandColors.accent }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Fuer Erfolg & Positive Aktionen
                      </p>
                    </div>
                  </div>

                  {/* Color Preview */}
                  <div className="mt-4 p-4 border-2 rounded-lg">
                    <p className="text-sm font-medium mb-3">Vorschau:</p>
                    <div className="flex items-center space-x-2">
                      <Button
                        style={{
                          backgroundColor: brandColors.primary,
                          borderColor: brandColors.primary,
                        }}
                      >
                        Primaer-Button
                      </Button>
                      <Button
                        variant="outline"
                        style={{
                          borderColor: brandColors.secondary,
                          color: brandColors.secondary,
                        }}
                      >
                        Sekundaer-Button
                      </Button>
                      <Badge style={{ backgroundColor: brandColors.accent }}>
                        Akzent-Badge
                      </Badge>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="space-y-2">
                    <Label>Schnellauswahl</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button
                        onClick={() =>
                          setBrandColors({
                            primary: "#3B82F6",
                            secondary: "#8B5CF6",
                            accent: "#10B981",
                          })
                        }
                        className="p-3 border-2 rounded-lg hover:border-blue-500 transition-colors"
                      >
                        <div className="flex space-x-1 mb-1">
                          <div
                            className="h-6 w-6 rounded"
                            style={{ backgroundColor: "#3B82F6" }}
                          />
                          <div
                            className="h-6 w-6 rounded"
                            style={{ backgroundColor: "#8B5CF6" }}
                          />
                          <div
                            className="h-6 w-6 rounded"
                            style={{ backgroundColor: "#10B981" }}
                          />
                        </div>
                        <p className="text-xs font-medium">Standard</p>
                      </button>
                      <button
                        onClick={() =>
                          setBrandColors({
                            primary: "#DC2626",
                            secondary: "#EA580C",
                            accent: "#F59E0B",
                          })
                        }
                        className="p-3 border-2 rounded-lg hover:border-red-500 transition-colors"
                      >
                        <div className="flex space-x-1 mb-1">
                          <div
                            className="h-6 w-6 rounded"
                            style={{ backgroundColor: "#DC2626" }}
                          />
                          <div
                            className="h-6 w-6 rounded"
                            style={{ backgroundColor: "#EA580C" }}
                          />
                          <div
                            className="h-6 w-6 rounded"
                            style={{ backgroundColor: "#F59E0B" }}
                          />
                        </div>
                        <p className="text-xs font-medium">Energie</p>
                      </button>
                      <button
                        onClick={() =>
                          setBrandColors({
                            primary: "#059669",
                            secondary: "#0D9488",
                            accent: "#06B6D4",
                          })
                        }
                        className="p-3 border-2 rounded-lg hover:border-green-500 transition-colors"
                      >
                        <div className="flex space-x-1 mb-1">
                          <div
                            className="h-6 w-6 rounded"
                            style={{ backgroundColor: "#059669" }}
                          />
                          <div
                            className="h-6 w-6 rounded"
                            style={{ backgroundColor: "#0D9488" }}
                          />
                          <div
                            className="h-6 w-6 rounded"
                            style={{ backgroundColor: "#06B6D4" }}
                          />
                        </div>
                        <p className="text-xs font-medium">Natur</p>
                      </button>
                      <button
                        onClick={() =>
                          setBrandColors({
                            primary: "#1F2937",
                            secondary: "#4B5563",
                            accent: "#F59E0B",
                          })
                        }
                        className="p-3 border-2 rounded-lg hover:border-gray-500 transition-colors"
                      >
                        <div className="flex space-x-1 mb-1">
                          <div
                            className="h-6 w-6 rounded"
                            style={{ backgroundColor: "#1F2937" }}
                          />
                          <div
                            className="h-6 w-6 rounded"
                            style={{ backgroundColor: "#4B5563" }}
                          />
                          <div
                            className="h-6 w-6 rounded"
                            style={{ backgroundColor: "#F59E0B" }}
                          />
                        </div>
                        <p className="text-xs font-medium">Elegant</p>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Density Mode */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    Anzeigedichte
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Passen Sie den Abstand zwischen Elementen fuer Ihre
                    bevorzugte Informationsdichte an.
                  </p>
                  <RadioGroup
                    value={density}
                    onValueChange={(value: string) =>
                      setDensity(value as typeof density)
                    }
                  >
                    <div className="space-y-2">
                      <div
                        className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent"
                        onClick={() => setDensity("compact")}
                      >
                        <RadioGroupItem value="compact" id="density-compact" />
                        <Label
                          htmlFor="density-compact"
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">Kompakt</div>
                          <div className="text-xs text-muted-foreground">
                            Maximale Informationsdichte
                          </div>
                        </Label>
                      </div>
                      <div
                        className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                        onClick={() => setDensity("comfortable")}
                      >
                        <RadioGroupItem
                          value="comfortable"
                          id="density-comfortable"
                        />
                        <Label
                          htmlFor="density-comfortable"
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">
                            Komfortabel (Standard)
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Ausgewogene Abstaende
                          </div>
                        </Label>
                      </div>
                      <div
                        className="flex items-center space-x-2 border rounded-lg p-5 cursor-pointer hover:bg-accent"
                        onClick={() => setDensity("spacious")}
                      >
                        <RadioGroupItem
                          value="spacious"
                          id="density-spacious"
                        />
                        <Label
                          htmlFor="density-spacious"
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">Grosszuegig</div>
                          <div className="text-xs text-muted-foreground">
                            Mehr Weissraum fuer bessere Lesbarkeit
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Motion & Animation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    Animationen & Bewegung
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label
                        htmlFor="reduced-motion"
                        className="font-medium cursor-pointer"
                      >
                        Reduzierte Bewegung
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Minimiert Animationen fuer bessere Barrierefreiheit und
                        Leistung
                      </p>
                    </div>
                    <Switch
                      id="reduced-motion"
                      checked={reducedMotion}
                      onCheckedChange={setReducedMotion}
                    />
                  </div>
                  {reducedMotion && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-900 dark:text-blue-200">
                        Hinweis: Alle Animationen sind jetzt minimiert. Dies
                        verbessert die Leistung und reduziert Ablenkungen.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-6">
            <AccessibilityPanel />
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {settingsCards.map((card) => (
                <Card
                  key={card.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`p-3 rounded-lg ${getColorClasses(
                          card.color
                        )}`}
                      >
                        {card.icon}
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {card.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {card.items.slice(0, 3).map((item, index) => (
                        <div
                          key={index}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <div className="w-1 h-1 bg-gray-400 rounded-full" />
                          {item}
                        </div>
                      ))}
                      {card.items.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          +{card.items.length - 3} weitere...
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={card.action}
                    >
                      Konfigurieren
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5 text-blue-600" />
                    Dokumentnummerierung
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Verwalten Sie alle Nummernkreise fuer Ihre
                    Geschaeftsdokumente zentral an einem Ort.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium">Ausgangsrechnungen</div>
                        <div className="text-sm text-muted-foreground">
                          AR-YYYY-NNNNNN
                        </div>
                      </div>
                      <Badge variant="outline">152 erstellt</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium">Angebote</div>
                        <div className="text-sm text-muted-foreground">
                          ANG-YYYY-NNN
                        </div>
                      </div>
                      <Badge variant="outline">78 erstellt</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium">
                          Auftragsbestaetigungen
                        </div>
                        <div className="text-sm text-muted-foreground">
                          AB-YYYY-NNNNNN
                        </div>
                      </div>
                      <Badge variant="outline">34 erstellt</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium">Eingangsrechnungen</div>
                        <div className="text-sm text-muted-foreground">
                          ER-YYYY-NNNNNN
                        </div>
                      </div>
                      <Badge variant="outline">89 erstellt</Badge>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => setShowNumberingManager(true)}
                  >
                    <Hash className="h-4 w-4 mr-2" />
                    Nummernkreise verwalten
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    PDF-Vorlagen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Konfigurieren Sie das Aussehen Ihrer PDF-Dokumente.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium">Rechnungsvorlage</div>
                        <div className="text-sm text-muted-foreground">
                          Standard Design
                        </div>
                      </div>
                      <Badge variant="default">Aktiv</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium">Angebotsvorlage</div>
                        <div className="text-sm text-muted-foreground">
                          Standard Design
                        </div>
                      </div>
                      <Badge variant="default">Aktiv</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium">Firmenlogo</div>
                        <div className="text-sm text-muted-foreground">
                          Bauplan Buddy
                        </div>
                      </div>
                      <Badge variant="outline">Konfiguriert</Badge>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowTemplateDialog(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Vorlagen bearbeiten
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Buchhaltung & ERP</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Verbinden Sie DATEV, Lexware oder weitere
                    Buchhaltungssysteme.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIntegrationSection("accounting");
                      setShowIntegrationManager(true);
                    }}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Buchhaltungsintegration oeffnen
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kalender Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Synchronisation mit externen Kalendern.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIntegrationSection("calendar");
                      setShowIntegrationManager(true);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Kalender-Synchronisation oeffnen
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="advanced" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-600" />
                    Backup & Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Sichern Sie Ihre Daten regelmaessig.
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowBackupSecurity(true)}
                    >
                      Backup erstellen
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowBackupSecurity(true)}
                    >
                      Daten exportieren
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Sicherheit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Sicherheitseinstellungen und Audit-Logs.
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowBackupSecurity(true)}
                    >
                      Sicherheitsrichtlinien
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowBackupSecurity(true)}
                    >
                      Audit-Protokolle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Numbering Manager Dialog */}
      <DocumentNumberingManager
        open={showNumberingManager}
        onOpenChange={setShowNumberingManager}
      />
      <IntegrationSettingsDialog
        open={showIntegrationManager}
        onOpenChange={setShowIntegrationManager}
        initialSection={integrationSection}
      />
      <TemplateUploadDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
      />
      <UserManagementDialog
        open={showUserManagement}
        onOpenChange={setShowUserManagement}
      />
      <BackupSecurityDialog
        open={showBackupSecurity}
        onOpenChange={setShowBackupSecurity}
      />
      <NotificationSettingsDialog
        open={showNotifications}
        onOpenChange={setShowNotifications}
      />
      <EmailSettingsDialog
        open={showEmailSettings}
        onOpenChange={setShowEmailSettings}
      />
      <PresetsManagerDialog
        open={showPresetsManager}
        onOpenChange={setShowPresetsManager}
      />
    </LayoutWithSidebar>
  );
};

export default Settings;
