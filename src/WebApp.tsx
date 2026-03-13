import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import { logger } from "@/lib/logger";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DragAndDropProvider } from "@/contexts/DragAndDropContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { DialogManagerProvider } from "@/contexts/DialogManagerContext";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import ServiceWorkerUpdatePrompt from "@/components/ServiceWorkerUpdatePrompt";
import GlobalShortcutListener from "@/components/GlobalShortcutListener";
import AISupportWidget from "@/components/AISupportWidget";
import UpdateNotification from "@/components/UpdateNotification";

import HelpCenterPortal from "@/components/HelpCenterPortal";
import FloatingThemeToggle from "@/components/FloatingThemeToggle";
import { FloatingChatButton } from "@/components/realtime";
import { CookieConsent } from "@/components/compliance/CookieConsent";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import { ThemeService } from "@/services/themeService";
import { KeyboardShortcutService } from "@/services/keyboardShortcutService";
import { MobileUIService } from "@/services/mobileUIService";
import { AccessibilityService } from "@/services/accessibilityService";
import AppStorageService from "@/services/appStorageService";
import { UnifiedFAB } from "@/components/UnifiedFAB";
import OfflineSyncService from "@/services/offlineSyncService";
import { PresetService } from "@/services/presetService";
import { aiSupport } from "@/services/aiSupportService";
import { updateService } from "@/services/updateService";
import {
  getPerformanceOptimizationService,
  isPerformanceMonitoringEnabled,
} from "@/services/performanceOptimizationService";
import { initializePreloading } from "@/utils/routePreloader";
import { getEnvVar } from "@/utils/env";
import { supabase } from "@/services/supabaseClient";
import { Suspense, lazy, useEffect, useRef } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import DashboardEager from "./pages/Dashboard";
import LoginPageEager from "./pages/LoginPage";
import RegisterPageEager from "./pages/RegisterPage";
import ForgotPasswordPageEager from "./pages/ForgotPasswordPage";
import ResetPasswordPageEager from "./pages/ResetPasswordPage";
import LandingPageEager from "./pages/LandingPage";
import NotFoundEager from "./pages/NotFound";

// Lazy load components for code splitting
const Index = lazy(() => import("./pages/Index"));
const LandingPageLazy = lazy(() => import("./pages/LandingPage"));
const AIFeaturesDemo = lazy(() => import("./pages/AIFeaturesDemo"));
const LoginPageLazy = lazy(() => import("./pages/LoginPage"));
const RegisterPageLazy = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPageLazy = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPageLazy = lazy(() => import("./pages/ResetPasswordPage"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const DashboardLazy = lazy(() => import("./pages/Dashboard"));
const Quotes = lazy(() => import("./pages/Quotes"));
const Projects = lazy(() => import("./pages/Projects"));
const Invoices = lazy(() => import("./pages/Invoices"));
const OrderConfirmations = lazy(() => import("./pages/OrderConfirmations"));
const Customers = lazy(() => import("./pages/Customers"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Documents = lazy(() => import("./pages/Documents"));
const Teams = lazy(() => import("./pages/Teams"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Resources = lazy(() => import("./pages/Resources"));
const FieldWorker = lazy(() => import("./pages/FieldWorker"));
const CalendarSimple = lazy(() => import("./pages/CalendarSimple"));
const Chat = lazy(() => import("./pages/Chat"));
const Admin = lazy(() => import("./pages/Admin"));
const DatabaseConfigPage = lazy(() => import("./pages/DatabaseConfigPage"));
const Documentation = lazy(() => import("./pages/Documentation"));
const Diagnostics = lazy(() => import("./pages/Diagnostics"));
const NotFoundLazy = lazy(() => import("./pages/NotFound"));
const DeliveryNotes = lazy(() => import("./pages/delivery/DeliveryNotesPage"));
const Procurement = lazy(() => import("./pages/Procurement"));
const Settings = lazy(() => import("./pages/Settings"));
const SettingsStorage = lazy(() => import("./pages/SettingsStoragePage"));
const SettingsDeployment = lazy(() => import("./pages/SettingsDeploymentPage"));
const CloudAuthCallbackPage = lazy(() => import("./pages/CloudAuthCallbackPage"));
const BillingSettings = lazy(() => import("./pages/BillingSettings"));
const OrganizationSettings = lazy(() => import("./pages/OrganizationSettings"));
const RealtimeDemoPage = lazy(() => import("./pages/RealtimeDemoPage"));
const BWA = lazy(() => import("./pages/BWA"));

declare global {
  interface Window {
    __bauplanServicesInitialized?: boolean;
  }
}

const useDesktopEagerRoutes =
  typeof window !== "undefined" && window.location.protocol === "file:";

// Initialize all services
const initializeServices = () => {
  try {
    const appStorage = AppStorageService.getInstance();
    OfflineSyncService.getInstance();
    PresetService.initializeDefaultPresets();

    const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
    const supabaseAnonKey = getEnvVar("VITE_SUPABASE_ANON_KEY");
    if (supabaseUrl && supabaseAnonKey)
      supabase.initialize(supabaseUrl, supabaseAnonKey);

    ThemeService.getInstance();
    KeyboardShortcutService.getInstance();
    MobileUIService.getInstance();
    AccessibilityService.getInstance();
    initializePreloading();
  } catch (error) {
    console.error("App: Service initialization failed:", error);
  }
};

// Wrapper component for UnifiedFAB with navigation
const FABWithNavigation = () => {
  const navigate = useNavigate();

  const handleOpenAIChat = () => {
    // Dispatch event for AI chat widget
    window.dispatchEvent(new CustomEvent("open-ai-chat"));
  };

  const handleOpenTeamChat = () => {
    // Navigate to the chat page
    navigate("/chat");
  };

  return (
    <UnifiedFAB
      onOpenAIChat={handleOpenAIChat}
      onOpenTeamChat={handleOpenTeamChat}
    />
  );
};

const App = () => {
  const servicesInitialized = useRef(false);
  const isDesktopFileRuntime =
    typeof window !== "undefined" && window.location.protocol === "file:";
  const RouterComponent = isDesktopFileRuntime ? HashRouter : BrowserRouter;
  const LandingPage = useDesktopEagerRoutes ? LandingPageEager : LandingPageLazy;
  const LoginPage = useDesktopEagerRoutes ? LoginPageEager : LoginPageLazy;
  const RegisterPage = useDesktopEagerRoutes ? RegisterPageEager : RegisterPageLazy;
  const ForgotPasswordPage = useDesktopEagerRoutes
    ? ForgotPasswordPageEager
    : ForgotPasswordPageLazy;
  const ResetPasswordPage = useDesktopEagerRoutes
    ? ResetPasswordPageEager
    : ResetPasswordPageLazy;
  const Dashboard = useDesktopEagerRoutes ? DashboardEager : DashboardLazy;
  const NotFound = useDesktopEagerRoutes ? NotFoundEager : NotFoundLazy;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (servicesInitialized.current || window.__bauplanServicesInitialized)
      return;

    initializeServices();
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (openaiKey) aiSupport.initialize(openaiKey);
    updateService.autoCheckUpdates();

    servicesInitialized.current = true;
    window.__bauplanServicesInitialized = true;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterComponent
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <ThemeProvider>
          <DialogManagerProvider>
            <OfflineProvider>
              <AuthProvider>
                <LanguageProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <PWAInstallPrompt />
                    <GlobalShortcutListener />
                    <AISupportWidget />
                    <FABWithNavigation />

                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        <Route path="/landing" element={<LandingPage />} />
                        <Route path="/ai-demo" element={<AIFeaturesDemo />} />
                        <Route
                          path="/login"
                          element={
                            <PublicRoute>
                              <LoginPage />
                            </PublicRoute>
                          }
                        />
                        <Route
                          path="/register"
                          element={
                            <PublicRoute>
                              <RegisterPage />
                            </PublicRoute>
                          }
                        />
                        <Route
                          path="/"
                          element={
                            <ProtectedRoute>
                              <Dashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/projects"
                          element={
                            <ProtectedRoute>
                              <Projects />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/quotes"
                          element={
                            <ProtectedRoute>
                              <Quotes />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/invoices"
                          element={
                            <ProtectedRoute>
                              <Invoices />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/procurement"
                          element={
                            <ProtectedRoute>
                              <Procurement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/delivery-notes"
                          element={
                            <ProtectedRoute>
                              <DeliveryNotes />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute>
                              <Dashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/field"
                          element={
                            <ProtectedRoute>
                              <FieldWorker />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/field-worker"
                          element={
                            <ProtectedRoute>
                              <FieldWorker />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/resources"
                          element={
                            <ProtectedRoute>
                              <Resources />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/documentation"
                          element={
                            <ProtectedRoute>
                              <Documentation />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/customers"
                          element={
                            <ProtectedRoute>
                              <Customers />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/suppliers"
                          element={
                            <ProtectedRoute>
                              <Suppliers />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/documents"
                          element={
                            <ProtectedRoute>
                              <Documents />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/calendar"
                          element={
                            <ProtectedRoute>
                              <CalendarSimple />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin"
                          element={
                            <ProtectedRoute>
                              <Admin />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings"
                          element={
                            <ProtectedRoute>
                              <Settings />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/storage"
                          element={
                            <ProtectedRoute>
                              <SettingsStorage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings/storage/auth/callback"
                          element={
                            <ProtectedRoute>
                              <CloudAuthCallbackPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/teams"
                          element={
                            <ProtectedRoute>
                              <Teams />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/analytics"
                          element={
                            <ProtectedRoute>
                              <Analytics />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/bwa"
                          element={
                            <ProtectedRoute>
                              <BWA />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/chat"
                          element={
                            <ProtectedRoute>
                              <Chat />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/order-confirmations"
                          element={
                            <ProtectedRoute>
                              <OrderConfirmations />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/field-worker"
                          element={
                            <ProtectedRoute>
                              <FieldWorker />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/documentation"
                          element={
                            <ProtectedRoute>
                              <Documentation />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/database-config"
                          element={
                            <ProtectedRoute>
                              <DatabaseConfigPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/diagnostics"
                          element={
                            <ProtectedRoute>
                              <Diagnostics />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </TooltipProvider>
                </LanguageProvider>
              </AuthProvider>
            </OfflineProvider>
          </DialogManagerProvider>
        </ThemeProvider>
      </RouterComponent>
    </QueryClientProvider>
  );
};

export default App;
