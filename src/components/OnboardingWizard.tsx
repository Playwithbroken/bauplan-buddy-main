import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import DeploymentConfigService, { DeploymentMode } from '@/services/deploymentConfigService';
import AppStorageService from '@/services/appStorageService';
import { stripeService } from '@/services/stripeService';
import { supabase } from '@/services/supabaseClient';
import {
  HardDrive,
  Server,
  Cloud,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Zap,
  Globe,
  Building2,
  User,
  XCircle,
  Wand2,
} from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  { id: 1, title: 'Willkommen', description: 'Lernen Sie Bauplan Buddy kennen' },
  { id: 2, title: 'Datenspeicherung', description: 'Wählen Sie, wo Ihre Daten gespeichert werden' },
  { id: 3, title: 'Personalisierung', description: 'Passen Sie die App an' },
  { id: 4, title: 'Konfiguration', description: 'Einrichtung abschließen' },
  { id: 5, title: 'Abo wählen', description: 'Wählen Sie Ihren Plan' },
  { id: 6, title: 'Fertig', description: 'Los geht\'s!' },
];

// Helper function to extract dominant colors from an image
const extractColorsFromImage = (imageData: string): Promise<{ primary: string; secondary: string; accent: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ primary: '#3B82F6', secondary: '#8B5CF6', accent: '#10B981' });
        return;
      }

      // Resize to speed up processing
      canvas.width = 100;
      canvas.height = 100;
      ctx.drawImage(img, 0, 0, 100, 100);

      const imageDataObj = ctx.getImageData(0, 0, 100, 100);
      const pixels = imageDataObj.data;
      const colorMap: { [key: string]: number } = {};

      // Count color occurrences (skip very light/dark colors)
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        // Skip transparent or very light/dark pixels
        if (a < 128 || (r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15)) {
          continue;
        }

        // Quantize colors to reduce variations
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;
        const key = `${qr},${qg},${qb}`;

        colorMap[key] = (colorMap[key] || 0) + 1;
      }

      // Get top 3 colors
      const sortedColors = Object.entries(colorMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([color]) => {
          const [r, g, b] = color.split(',').map(Number);
          return { r, g, b };
        });

      if (sortedColors.length === 0) {
        resolve({ primary: '#3B82F6', secondary: '#8B5CF6', accent: '#10B981' });
        return;
      }

      // Convert to hex and ensure good color choices
      const toHex = (r: number, g: number, b: number) => {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
      };

      // Adjust saturation for better brand colors
      const enhanceColor = (r: number, g: number, b: number) => {
        // Increase saturation slightly
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;
        const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
        
        if (s < 0.3) {
          // Boost saturation for dull colors
          const boost = 1.5;
          const avg = (r + g + b) / 3;
          r = Math.min(255, Math.round(avg + (r - avg) * boost));
          g = Math.min(255, Math.round(avg + (g - avg) * boost));
          b = Math.min(255, Math.round(avg + (b - avg) * boost));
        }
        return { r, g, b };
      };

      const color1 = enhanceColor(sortedColors[0].r, sortedColors[0].g, sortedColors[0].b);
      const color2 = sortedColors[1] ? enhanceColor(sortedColors[1].r, sortedColors[1].g, sortedColors[1].b) : color1;
      const color3 = sortedColors[2] ? enhanceColor(sortedColors[2].r, sortedColors[2].g, sortedColors[2].b) : color2;

      resolve({
        primary: toHex(color1.r, color1.g, color1.b),
        secondary: toHex(color2.r, color2.g, color2.b),
        accent: toHex(color3.r, color3.g, color3.b),
      });
    };
    img.src = imageData;
  });
};

const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState<DeploymentMode>('local');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'professional' | 'enterprise'>('free');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [config, setConfig] = useState({
    // User info
    companyName: '',
    userName: '',
    userEmail: '',
    phoneNumber: '',
    
    // Branding
    companyLogo: null as File | null,
    companyLogoPreview: '',
    primaryColor: '#3B82F6', // Blue
    secondaryColor: '#8B5CF6', // Purple
    accentColor: '#10B981', // Green
    
    // Company details
    industry: 'construction' as 'construction' | 'renovation' | 'landscaping' | 'engineering' | 'other',
    teamSize: '1' as '1' | '2-5' | '6-20' | '21-50' | '50+',
    
    // Preferences
    theme: 'system' as 'light' | 'dark' | 'system',
    language: 'de',
    currency: 'EUR',
    dateFormat: 'DD.MM.YYYY',
    
    // Features to enable
    enabledModules: {
      quotes: true,
      projects: true,
      invoices: true,
      deliveryNotes: true,
      orderConfirmations: true,
      procurement: false,
      analytics: false,
      teams: false,
    },
    
    // Self-hosted config
    apiUrl: '',
    authToken: '',
    
    // Cloud config
    cloudProvider: 'custom' as 'aws' | 'azure' | 'gcp' | 'custom',
    cloudRegion: 'eu-central-1',
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    
    // Sample data
    importSampleData: true,
  });

  // Check if onboarding should be shown
  React.useEffect(() => {
    // Only show onboarding if:
    // 1. Not completed yet AND
    // 2. User is on login/register/dashboard page OR explicitly requesting onboarding
    const onboardingCompleted = localStorage.getItem('bauplan_onboarding_completed');
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/dashboard' || currentPath === '/settings';
    
    // Only show if not completed AND user is not authenticated yet OR just registered
    if (!onboardingCompleted && isAuthPage) {
      setShowOnboarding(true);
      
      // Pre-fill user data if available from registration
      const userName = localStorage.getItem('bauplan_onboarding_user_name');
      const userEmail = localStorage.getItem('bauplan_onboarding_user_email');
      
      if (userName || userEmail) {
        setConfig(prev => ({
          ...prev,
          userName: userName || prev.userName,
          userEmail: userEmail || prev.userEmail,
        }));
        
        // Clear the temp data
        localStorage.removeItem('bauplan_onboarding_user_name');
        localStorage.removeItem('bauplan_onboarding_user_email');
      }
    }
  }, []);

  if (!showOnboarding) {
    return null;
  }

  const handleNext = () => {
    if (currentStep === 2 && !validateStep2()) {
      return;
    }
    if (currentStep === 3 && !validateStep3()) {
      return;
    }
    if (currentStep === 4 && !validateStep4()) {
      return;
    }
    
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep2 = (): boolean => {
    // Deployment mode must be selected
    return true; // Always valid, mode has default
  };

  const validateStep3 = (): boolean => {
    // Personalization step - always valid
    return true;
  };

  const validateStep4 = (): boolean => {
    if (selectedMode === 'self-hosted') {
      if (!config.apiUrl) {
        toast({
          title: 'API URL erforderlich',
          description: 'Bitte geben Sie die API URL Ihres Servers ein.',
          variant: 'destructive',
        });
        return false;
      }
    }
    return true;
  };

  const completeOnboarding = async () => {
    const deploymentService = DeploymentConfigService.getInstance();
    const appStorage = AppStorageService.getInstance();

    // Set deployment mode
    deploymentService.setDeploymentMode(selectedMode);

    // Configure based on selected mode
    if (selectedMode === 'self-hosted') {
      deploymentService.configureSelfHosted({
        apiUrl: config.apiUrl,
        authToken: config.authToken || undefined,
        syncInterval: 5,
        offlineFallback: true,
        enabled: true,
      });
    } else if (selectedMode === 'cloud') {
      deploymentService.configureCloud({
        provider: config.cloudProvider,
        region: config.cloudRegion,
        apiUrl: config.apiUrl,
        syncInterval: 5,
        enabled: true,
      });
    }

    // Save user preferences
    appStorage.updateUser({
      name: config.userName || null,
      email: config.userEmail || null,
      preferences: {
        theme: config.theme,
        language: config.language,
        notifications: config.emailNotifications,
        autoSave: true,
      },
    });
    
    // Save company branding
    if (config.companyName) {
      localStorage.setItem('bauplan_company_name', config.companyName);
    }
    if (config.companyLogoPreview) {
      localStorage.setItem('bauplan_company_logo', config.companyLogoPreview);
    }
    localStorage.setItem('bauplan_primary_color', config.primaryColor);
    localStorage.setItem('bauplan_secondary_color', config.secondaryColor);
    localStorage.setItem('bauplan_accent_color', config.accentColor);
    
    // Apply theme colors to CSS variables
    document.documentElement.style.setProperty('--color-primary', config.primaryColor);
    document.documentElement.style.setProperty('--color-secondary', config.secondaryColor);
    document.documentElement.style.setProperty('--color-accent', config.accentColor);
    
    // Enable/disable modules (only save ones supported by appStorage)
    const supportedModules: Array<'quotes' | 'projects' | 'invoices' | 'deliveryNotes' | 'orderConfirmations' | 'appointments'> = [
      'quotes', 'projects', 'invoices', 'deliveryNotes', 'orderConfirmations'
    ];
    
    supportedModules.forEach((module) => {
      const enabled = config.enabledModules[module as keyof typeof config.enabledModules] ?? true;
      appStorage.toggleModule(module, enabled);
    });
    
    // Import sample data if requested
    if (config.importSampleData) {
      importSampleData();
    }

    // Mark onboarding as complete
    localStorage.setItem('bauplan_onboarding_completed', 'true');
    localStorage.setItem('bauplan_buddy_has_visited', 'true');
    
    // Save selected subscription plan
    localStorage.setItem('bauplan_selected_plan', selectedPlan);

    // Handle subscription selection
    if (selectedPlan === 'free') {
      // Free plan - go directly to dashboard
      toast({
        title: 'Einrichtung abgeschlossen!',
        description: 'Willkommen bei Bauplan Buddy.',
      });
      navigate('/dashboard');
    } else {
      // Professional or Enterprise - trigger Stripe Checkout
      setIsProcessingCheckout(true);
      
      try {
        const tenant = supabase.getCurrentTenant();
        if (!tenant) {
          throw new Error('Tenant nicht gefunden');
        }

        const { url, error } = await stripeService.createCheckoutSession({
          tenantId: tenant.id,
          plan: selectedPlan,
          successUrl: `${window.location.origin}/dashboard?welcome=true&checkout=success`,
          cancelUrl: `${window.location.origin}/onboarding?step=5`,
        });

        if (error || !url) {
          throw new Error(error || 'Checkout konnte nicht gestartet werden');
        }

        // Redirect to Stripe Checkout
        window.location.href = url;
      } catch (error) {
        console.error('Stripe Checkout Error:', error);
        setIsProcessingCheckout(false);
        toast({
          title: 'Fehler',
          description: 'Checkout konnte nicht gestartet werden. Bitte versuchen Sie es später erneut.',
          variant: 'destructive',
        });
        // Fallback: Navigate to dashboard anyway
        navigate('/dashboard');
      }
    }
  };

  const importSampleData = () => {
    // Sample Quote
    const sampleQuote = {
      id: 'demo-quote-1',
      number: 'ANG-2024-DEMO',
      customerName: 'Mustermann Bau GmbH',
      projectName: 'Beispiel Renovierung',
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      positions: [
        {
          id: '1',
          description: 'Malerarbeiten Innenbereich',
          quantity: 150,
          unit: 'm²',
          unitPrice: 25,
          total: 3750,
        },
      ],
      subtotal: 3750,
      tax: 712.50,
      total: 4462.50,
    };
    
    // Sample Project
    const sampleProject = {
      id: 'demo-project-1',
      name: 'Beispielprojekt',
      customerName: 'Mustermann Bau GmbH',
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      description: 'Demo-Projekt zum Kennenlernen',
    };
    
    // Save to localStorage
    const quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
    quotes.push(sampleQuote);
    localStorage.setItem('quotes', JSON.stringify(quotes));
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    projects.push(sampleProject);
    localStorage.setItem('projects', JSON.stringify(projects));
  };

  const handleSkip = () => {
    localStorage.setItem('bauplan_onboarding_completed', 'true');
    localStorage.setItem('bauplan_buddy_has_visited', 'true');
    navigate('/dashboard');
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">Willkommen bei Bauplan Buddy</h2>
          <p className="text-lg text-muted-foreground">
            Ihre professionelle Bauverwaltungslösung
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <Shield className="h-12 w-12 text-blue-600" />
              <h3 className="font-semibold">Sicher & Privat</h3>
              <p className="text-sm text-muted-foreground">
                Ihre Daten bleiben unter Ihrer Kontrolle
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <Zap className="h-12 w-12 text-yellow-600" />
              <h3 className="font-semibold">Offline-Fähig</h3>
              <p className="text-sm text-muted-foreground">
                Arbeiten Sie auch ohne Internetverbindung
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <Globe className="h-12 w-12 text-green-600" />
              <h3 className="font-semibold">Flexibel</h3>
              <p className="text-sm text-muted-foreground">
                Lokal, eigener Server oder Cloud
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/50 p-6 rounded-lg">
        <h3 className="font-semibold mb-3">Was Sie gleich einrichten werden:</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Wählen Sie, wo Ihre Daten gespeichert werden sollen</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Konfigurieren Sie optional Ihren eigenen Server oder Cloud-Zugang</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Personalisieren Sie Ihr Profil</span>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Wo sollen Ihre Daten gespeichert werden?</h2>
        <p className="text-muted-foreground">
          Wählen Sie die Option, die am besten zu Ihren Anforderungen passt
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Local Mode */}
        <Card
          className={`cursor-pointer transition-all border-2 ${
            selectedMode === 'local'
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
              : 'hover:border-blue-400'
          }`}
          onClick={() => setSelectedMode('local')}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  selectedMode === 'local' ? 'bg-blue-600' : 'bg-muted'
                }`}>
                  <HardDrive className={`h-6 w-6 ${
                    selectedMode === 'local' ? 'text-white' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <CardTitle>Lokal (Browser)</CardTitle>
                    <Badge variant="secondary">Empfohlen für Einsteiger</Badge>
                  </div>
                  <CardDescription className="text-base">
                    Alle Daten werden sicher in Ihrem Browser gespeichert
                  </CardDescription>
                </div>
              </div>
              {selectedMode === 'local' && (
                <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Keine Serverkosten</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Maximale Privatsphäre</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Sofort einsatzbereit</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Offline-fähig</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-sm">
              <p className="font-medium mb-1">Ideal für:</p>
              <p className="text-muted-foreground">
                Einzelunternehmer, kleine Betriebe, Baustellen ohne Internet
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Self-Hosted Mode */}
        <Card
          className={`cursor-pointer transition-all border-2 ${
            selectedMode === 'self-hosted'
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
              : 'hover:border-blue-400'
          }`}
          onClick={() => setSelectedMode('self-hosted')}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  selectedMode === 'self-hosted' ? 'bg-blue-600' : 'bg-muted'
                }`}>
                  <Server className={`h-6 w-6 ${
                    selectedMode === 'self-hosted' ? 'text-white' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <CardTitle>Eigener Server</CardTitle>
                    <Badge variant="secondary">Für Profis</Badge>
                  </div>
                  <CardDescription className="text-base">
                    Verbinden Sie sich mit Ihrem eigenen Server
                  </CardDescription>
                </div>
              </div>
              {selectedMode === 'self-hosted' && (
                <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Volle Kontrolle</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Multi-Device Sync</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Team-Zusammenarbeit</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>DSGVO-konform</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-sm">
              <p className="font-medium mb-1">Ideal für:</p>
              <p className="text-muted-foreground">
                Mittelständische Unternehmen mit eigener IT-Infrastruktur
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cloud Mode */}
        <Card
          className={`cursor-pointer transition-all border-2 ${
            selectedMode === 'cloud'
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
              : 'hover:border-blue-400'
          }`}
          onClick={() => setSelectedMode('cloud')}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  selectedMode === 'cloud' ? 'bg-blue-600' : 'bg-muted'
                }`}>
                  <Cloud className={`h-6 w-6 ${
                    selectedMode === 'cloud' ? 'text-white' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <CardTitle>Cloud (SaaS)</CardTitle>
                    <Badge variant="secondary">Enterprise</Badge>
                  </div>
                  <CardDescription className="text-base">
                    Professionelles Managed Hosting
                  </CardDescription>
                </div>
              </div>
              {selectedMode === 'cloud' && (
                <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Auto-Skalierung</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Profi-Backups</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>24/7 Verfügbarkeit</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Support inklusive</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-sm">
              <p className="font-medium mb-1">Ideal für:</p>
              <p className="text-muted-foreground">
                Große Bauunternehmen, internationale Teams
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Personalisieren Sie Ihre Erfahrung</h2>
        <p className="text-muted-foreground">
          Passen Sie Bauplan Buddy an Ihre Firmenidentität an
        </p>
      </div>

      {/* Personal & Company Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <CardTitle>Persönliche Informationen</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ihr Name</Label>
              <Input
                placeholder="Max Mustermann"
                value={config.userName}
                onChange={(e) => setConfig({ ...config, userName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input
                type="email"
                placeholder="max@musterbau.de"
                value={config.userEmail}
                onChange={(e) => setConfig({ ...config, userEmail: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Firmenname</Label>
            <Input
              placeholder="Musterbau GmbH"
              value={config.companyName}
              onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Company Branding */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Firmen-Branding</CardTitle>
          </div>
          <CardDescription>
            Laden Sie Ihr Logo hoch und wählen Sie Ihre Firmenfarben
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-3">
            <Label>Firmen-Logo</Label>
            <div className="flex items-center space-x-4">
              {config.companyLogoPreview ? (
                <div className="relative">
                  <img
                    src={config.companyLogoPreview}
                    alt="Company Logo"
                    className="h-24 w-24 object-contain border-2 border-dashed border-gray-300 rounded-lg p-2"
                  />
                  <button
                    onClick={() => {
                      setConfig({ ...config, companyLogo: null, companyLogoPreview: '' });
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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
                  id="logo-upload"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        const logoData = reader.result as string;
                        setConfig({
                          ...config,
                          companyLogo: file,
                          companyLogoPreview: logoData,
                        });

                        // Auto-extract colors from logo
                        try {
                          const extractedColors = await extractColorsFromImage(logoData);
                          setConfig(prev => ({
                            ...prev,
                            primaryColor: extractedColors.primary,
                            secondaryColor: extractedColors.secondary,
                            accentColor: extractedColors.accent,
                          }));

                          toast({
                            title: '🎨 Farben erkannt!',
                            description: 'Wir haben automatisch Farben aus Ihrem Logo extrahiert. Sie können diese jederzeit anpassen.',
                          });
                        } catch (error) {
                          console.error('Color extraction failed:', error);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="w-full"
                >
                  {config.companyLogoPreview ? 'Logo ändern' : 'Logo hochladen'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Empfohlen: PNG oder SVG, max. 2 MB
                </p>
              </div>
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-4">
            <Label>Firmenfarben</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Primary Color */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Primärfarbe</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="h-10 w-16 border-2 rounded cursor-pointer"
                  />
                  <Input
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
                <div
                  className="h-8 rounded"
                  style={{ backgroundColor: config.primaryColor }}
                />
                <p className="text-xs text-muted-foreground">Hauptfarbe für Buttons & Links</p>
              </div>

              {/* Secondary Color */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sekundärfarbe</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                    className="h-10 w-16 border-2 rounded cursor-pointer"
                  />
                  <Input
                    value={config.secondaryColor}
                    onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                    placeholder="#8B5CF6"
                    className="flex-1"
                  />
                </div>
                <div
                  className="h-8 rounded"
                  style={{ backgroundColor: config.secondaryColor }}
                />
                <p className="text-xs text-muted-foreground">Für Akzente & Hervorhebungen</p>
              </div>

              {/* Accent Color */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Akzentfarbe</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={config.accentColor}
                    onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                    className="h-10 w-16 border-2 rounded cursor-pointer"
                  />
                  <Input
                    value={config.accentColor}
                    onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                    placeholder="#10B981"
                    className="flex-1"
                  />
                </div>
                <div
                  className="h-8 rounded"
                  style={{ backgroundColor: config.accentColor }}
                />
                <p className="text-xs text-muted-foreground">Für Erfolg & Positive Aktionen</p>
              </div>
            </div>

            {/* Color Preview */}
            <div className="mt-4 p-4 border-2 rounded-lg">
              <p className="text-sm font-medium mb-3">Vorschau:</p>
              <div className="flex items-center space-x-2">
                <Button style={{ backgroundColor: config.primaryColor, borderColor: config.primaryColor }}>
                  Primär-Button
                </Button>
                <Button
                  variant="outline"
                  style={{ borderColor: config.secondaryColor, color: config.secondaryColor }}
                >
                  Sekundär-Button
                </Button>
                <Badge style={{ backgroundColor: config.accentColor }}>
                  Akzent-Badge
                </Badge>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <Label>Schnellauswahl</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => setConfig({
                    ...config,
                    primaryColor: '#3B82F6',
                    secondaryColor: '#8B5CF6',
                    accentColor: '#10B981',
                  })}
                  className="p-3 border-2 rounded-lg hover:border-blue-500 transition-colors"
                >
                  <div className="flex space-x-1 mb-1">
                    <div className="h-6 w-6 rounded" style={{ backgroundColor: '#3B82F6' }} />
                    <div className="h-6 w-6 rounded" style={{ backgroundColor: '#8B5CF6' }} />
                    <div className="h-6 w-6 rounded" style={{ backgroundColor: '#10B981' }} />
                  </div>
                  <p className="text-xs font-medium">Standard</p>
                </button>
                <button
                  onClick={() => setConfig({
                    ...config,
                    primaryColor: '#DC2626',
                    secondaryColor: '#EA580C',
                    accentColor: '#F59E0B',
                  })}
                  className="p-3 border-2 rounded-lg hover:border-red-500 transition-colors"
                >
                  <div className="flex space-x-1 mb-1">
                    <div className="h-6 w-6 rounded" style={{ backgroundColor: '#DC2626' }} />
                    <div className="h-6 w-6 rounded" style={{ backgroundColor: '#EA580C' }} />
                    <div className="h-6 w-6 rounded" style={{ backgroundColor: '#F59E0B' }} />
                  </div>
                  <p className="text-xs font-medium">Energie</p>
                </button>
                <button
                  onClick={() => setConfig({
                    ...config,
                    primaryColor: '#059669',
                    secondaryColor: '#0D9488',
                    accentColor: '#06B6D4',
                  })}
                  className="p-3 border-2 rounded-lg hover:border-green-500 transition-colors"
                >
                  <div className="flex space-x-1 mb-1">
                    <div className="h-6 w-6 rounded" style={{ backgroundColor: '#059669' }} />
                    <div className="h-6 w-6 rounded" style={{ backgroundColor: '#0D9488' }} />
                    <div className="h-6 w-6 rounded" style={{ backgroundColor: '#06B6D4' }} />
                  </div>
                  <p className="text-xs font-medium">Natur</p>
                </button>
                <button
                  onClick={() => setConfig({
                    ...config,
                    primaryColor: '#1F2937',
                    secondaryColor: '#4B5563',
                    accentColor: '#F59E0B',
                  })}
                  className="p-3 border-2 rounded-lg hover:border-gray-500 transition-colors"
                >
                  <div className="flex space-x-1 mb-1">
                    <div className="h-6 w-6 rounded" style={{ backgroundColor: '#1F2937' }} />
                    <div className="h-6 w-6 rounded" style={{ backgroundColor: '#4B5563' }} />
                    <div className="h-6 w-6 rounded" style={{ backgroundColor: '#F59E0B' }} />
                  </div>
                  <p className="text-xs font-medium">Elegant</p>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Data */}
      <Card>
        <CardHeader>
          <CardTitle>Beispieldaten</CardTitle>
          <CardDescription>
            Möchten Sie mit Beispieldaten starten?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-medium">Demo-Projekt & Angebot importieren</p>
              <p className="text-sm text-muted-foreground">
                Perfekt zum Kennenlernen der Funktionen
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.importSampleData}
                onChange={(e) => setConfig({ ...config, importSampleData: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Server-Konfiguration</h2>
        <p className="text-muted-foreground">
          {selectedMode === 'local' && 'Fast fertig! Nur noch ein Schritt.'}
          {selectedMode === 'self-hosted' && 'Geben Sie die Zugangsdaten zu Ihrem Server ein.'}
          {selectedMode === 'cloud' && 'Konfigurieren Sie Ihren Cloud-Zugang.'}
        </p>
      </div>

      {/* Self-Hosted Config */}
      {selectedMode === 'self-hosted' && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <CardTitle>Server-Einstellungen</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API URL *</Label>
              <Input
                type="url"
                placeholder="https://api.ihre-domain.de"
                value={config.apiUrl}
                onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Die URL Ihres Bauplan Buddy Servers
              </p>
            </div>
            <div className="space-y-2">
              <Label>Auth Token (optional)</Label>
              <Input
                type="password"
                placeholder="Bearer Token"
                value={config.authToken}
                onChange={(e) => setConfig({ ...config, authToken: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Optionaler Authentifizierungs-Token
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cloud Config */}
      {selectedMode === 'cloud' && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Cloud className="h-5 w-5" />
              <CardTitle>Cloud-Konfiguration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API URL *</Label>
              <Input
                type="url"
                placeholder="https://api.bauplan-cloud.com"
                value={config.apiUrl}
                onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={config.cloudRegion}
                onChange={(e) => setConfig({ ...config, cloudRegion: e.target.value })}
              >
                <option value="eu-central-1">EU (Frankfurt)</option>
                <option value="eu-west-1">EU (Irland)</option>
                <option value="us-east-1">US East</option>
                <option value="us-west-2">US West</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Local Mode Info */}
      {selectedMode === 'local' && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold">Ihre Daten bleiben privat</p>
                <p className="text-sm text-muted-foreground">
                  Im lokalen Modus werden alle Daten ausschließlich in Ihrem Browser gespeichert. 
                  Denken Sie daran, regelmäßig Backups über die Export-Funktion zu erstellen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Wählen Sie Ihren Plan</h2>
        <p className="text-muted-foreground">
          Starten Sie mit 14 Tagen kostenloser Testphase (Professional & Enterprise)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <Card
          className={`cursor-pointer transition-all border-2 ${
            selectedPlan === 'free'
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
              : 'hover:border-blue-400'
          }`}
          onClick={() => setSelectedPlan('free')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Starter</CardTitle>
              {selectedPlan === 'free' && (
                <CheckCircle className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold">0€</span>
              <span className="text-muted-foreground">/Monat</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Für Einzelunternehmer</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {['1 Benutzer', '10 Projekte/Monat', '100 MB Speicher', 'Email Support', 'Basis-Features'].map((item) => (
                <li key={item} className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Professional Plan */}
        <Card
          className={`cursor-pointer transition-all border-2 relative ${
            selectedPlan === 'professional'
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20 scale-105'
              : 'hover:border-blue-400'
          }`}
          onClick={() => setSelectedPlan('professional')}
        >
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
            ⭐ Beliebteste Wahl
          </Badge>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Professional</CardTitle>
              {selectedPlan === 'professional' && (
                <CheckCircle className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold">29,99€</span>
              <span className="text-muted-foreground">/Monat</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Für kleine bis mittlere Teams</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              🎁 14 Tage kostenlos testen
            </Badge>
            <ul className="space-y-3">
              {[
                '10 Benutzer',
                'Unbegrenzte Projekte',
                '10 GB Speicher',
                'Priority Support',
                'Custom Branding',
                'Erweiterte Analytics',
                'API-Zugriff',
              ].map((item) => (
                <li key={item} className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Enterprise Plan */}
        <Card
          className={`cursor-pointer transition-all border-2 ${
            selectedPlan === 'enterprise'
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
              : 'hover:border-blue-400'
          }`}
          onClick={() => setSelectedPlan('enterprise')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Enterprise</CardTitle>
              {selectedPlan === 'enterprise' && (
                <CheckCircle className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold">99,99€</span>
              <span className="text-muted-foreground">/Monat</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Für große Organisationen</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              🎁 14 Tage kostenlos testen
            </Badge>
            <ul className="space-y-3">
              {[
                'Unlimited Benutzer',
                'Unlimited Projekte',
                '100 GB Speicher',
                '24/7 Premium Support',
                'Dedicated Server',
                'SLA 99.9%',
                'Persönliches Onboarding',
                'White-Label Option',
              ].map((item) => (
                <li key={item} className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">
              ✅ Keine Kreditkarte für Free-Plan erforderlich
            </p>
            <p className="text-sm text-muted-foreground">
              Professional & Enterprise: 14 Tage kostenlos testen, dann automatische Abrechnung
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">Alles bereit!</h2>
          <p className="text-lg text-muted-foreground">
            Ihre Bauplan Buddy Installation ist konfiguriert
          </p>
        </div>
      </div>

      <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Datenspeicherung konfiguriert</p>
                <p className="text-sm text-muted-foreground">
                  Modus: {
                    selectedMode === 'local' ? 'Lokal (Browser)' :
                    selectedMode === 'self-hosted' ? 'Eigener Server' :
                    'Cloud (SaaS)'
                  }
                </p>
              </div>
            </div>
            
            {config.userName && (
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Profil erstellt</p>
                  <p className="text-sm text-muted-foreground">
                    Angemeldet als: {config.userName}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Abo gewählt</p>
                <p className="text-sm text-muted-foreground">
                  Plan: {selectedPlan === 'free' ? 'Starter (Kostenlos)' : selectedPlan === 'professional' ? 'Professional (29,99€/Monat)' : 'Enterprise (99,99€/Monat)'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Bereit zum Start</p>
                <p className="text-sm text-muted-foreground">
                  Alle Funktionen stehen Ihnen zur Verfügung
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nächste Schritte</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start space-x-2">
              <Building2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Legen Sie Ihre ersten Projekte an</span>
            </li>
            <li className="flex items-start space-x-2">
              <User className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Fügen Sie Kunden und Lieferanten hinzu</span>
            </li>
            <li className="flex items-start space-x-2">
              <HardDrive className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Erstellen Sie Ihr erstes Angebot</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center ${step.id < steps.length ? 'flex-1' : ''}`}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <p className="text-xs mt-2 font-medium text-center">{step.title}</p>
                </div>
                {step.id < steps.length && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        {/* Content Card */}
        <Card className="border-2">
          <CardContent className="pt-8 pb-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
            {currentStep === 6 && renderStep6()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <div>
            {currentStep > 1 && currentStep < 6 && (
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            {currentStep < 6 && (
              <Button onClick={handleSkip} variant="ghost">
                Überspringen
              </Button>
            )}
            <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700" disabled={isProcessingCheckout}>
              {isProcessingCheckout ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Checkout wird gestartet...
                </>
              ) : currentStep < 6 ? (
                <>
                  Weiter
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Los geht's!
                  <Sparkles className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
