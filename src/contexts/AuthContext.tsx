import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { getEnvVar } from "@/utils/env";
import { apiClient } from "@/services/apiClient";
import SupabaseAuthService, {
  type SupabaseAuthUser,
} from "@/services/supabaseAuthService";
import { isSupabaseConfigured } from "@/lib/supabase";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "ADMIN" | "MANAGER" | "USER" | "GUEST";
  permissions?: string[]; // e.g., ["project:create", "invoice:view"]
  name?: string;
  lastLogin?: Date;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
  organizationId?: string;
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"supabase" | "api" | "offline">(
    "offline"
  );
  const refreshIntervalRef = React.useRef<NodeJS.Timer | null>(null);
  const configuredApiUrl = getEnvVar("VITE_API_URL")?.trim() || "";
  const isDesktopFileRuntime =
    typeof window !== "undefined" && window.location.protocol === "file:";
  const apiUrl = configuredApiUrl;
  const supabaseAuth = SupabaseAuthService.getInstance();

  // Determine auth mode on mount
  useEffect(() => {
    if (isSupabaseConfigured) {
      setAuthMode("supabase");
      console.log("🔐 Auth Mode: Supabase");
    } else if (apiUrl && !isDesktopFileRuntime) {
      setAuthMode("api");
      console.log("🔐 Auth Mode: API Backend");
    } else {
      setAuthMode("offline");
      console.log("🔐 Auth Mode: Offline (localStorage only)");
    }
  }, [apiUrl, isDesktopFileRuntime]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const timeoutId = window.setTimeout(() => {
        setIsLoading(false);
        console.warn("Auth check timed out, falling back to offline mode");
      }, 2500);

      try {
        // Try Supabase first
        if (authMode === "supabase") {
          try {
            const { user: supabaseUser } = await supabaseAuth.getCurrentUser();
            if (supabaseUser) {
              setUser({
                id: supabaseUser.id,
                email: supabaseUser.email,
                firstName: supabaseUser.name.split(" ")[0],
                lastName: supabaseUser.name.split(" ")[1] || "",
                name: supabaseUser.name,
                role: supabaseUser.role,
                status: "ACTIVE",
                permissions: [],
              });
              setIsLoading(false);
              return;
            }
          } catch (supabaseError) {
            console.warn(
              "Supabase auth check failed, checking offline mode:",
              supabaseError
            );
            // Continue to check offline mode
          }
        }

        // Fallback to API backend
        if (authMode === "api") {
          try {
            const response = await fetch(`${apiUrl}/auth/me`, {
              credentials: "include",
            });

            if (response.ok) {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const userData = await response.json();
                setUser(userData);
                setIsLoading(false);
                return;
              }
            }
          } catch (apiError) {
            console.warn(
              "API auth check failed, checking offline mode:",
              apiError
            );
            // Continue to check offline mode
          }
        }

        // Always check localStorage for offline user
        const storedUser = localStorage.getItem("bauplan_offline_user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            ...parsedUser,
            permissions: parsedUser.permissions || [],
          });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        window.clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [apiUrl, authMode, supabaseAuth]);

  const logout = useCallback(async () => {
    try {
      // Logout from Supabase
      if (authMode === "supabase") {
        await supabaseAuth.signOut();
      }

      // Logout from API
      if (authMode === "api") {
        await fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      }

      // Clear offline mode
      if (authMode === "offline") {
        localStorage.removeItem("bauplan_offline_user");
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setUser(null);
      setAccessToken(null);

      // Clear token from apiClient
      apiClient.setAccessToken(null);

      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current as NodeJS.Timeout);
      }
    }
  }, [apiUrl, authMode, supabaseAuth]);

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    if (authMode !== "api") {
      return false;
    }

    try {
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const { accessToken: newToken } = await response.json();
        setAccessToken(newToken);
        apiClient.setAccessToken(newToken);
        return true;
      }

      if (response.status === 401) {
        await logout();
      } else {
        console.warn("Token refresh failed with status:", response.status);
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      await logout();
    }

    return false;
  }, [apiUrl, authMode, logout]);

  // Setup token refresh interval
  useEffect(() => {
    const isAuthenticated = !!user && !!accessToken;
    if (isAuthenticated && accessToken) {
      // Refresh token every 14 minutes (1 minute before 15m expiry)
      refreshIntervalRef.current = setInterval(() => {
        void refreshAccessToken();
      }, 14 * 60 * 1000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current as NodeJS.Timeout);
        }
      };
    }
  }, [user, accessToken, refreshAccessToken]);

  useEffect(() => {
    if (authMode === "api") {
      apiClient.setUnauthorizedHandler(async () => {
        const refreshed = await refreshAccessToken();
        return refreshed;
      });
    } else {
      apiClient.setUnauthorizedHandler(undefined);
    }

    return () => {
      apiClient.setUnauthorizedHandler(undefined);
    };
  }, [authMode, refreshAccessToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        // Try Supabase first
        if (authMode === "supabase") {
          try {
            const {
              user: supabaseUser,
              session,
              error,
            } = await supabaseAuth.signIn(email, password);

            if (error) {
              console.warn(
                "Supabase login failed, falling back to offline mode:",
                error.message
              );
              // Don't throw - fallback to offline mode instead
            } else if (supabaseUser && session) {
              const userData: User = {
                id: supabaseUser.id,
                email: supabaseUser.email,
                firstName: supabaseUser.name.split(" ")[0],
                lastName: supabaseUser.name.split(" ")[1] || "",
                name: supabaseUser.name,
                role: supabaseUser.role,
                status: "ACTIVE",
                permissions: [],
              };

              setUser(userData);
              setAccessToken(session.access_token);

              // Sync to localStorage as backup
              localStorage.setItem(
                "bauplan_offline_user",
                JSON.stringify(userData)
              );

              return;
            }
          } catch (supabaseError) {
            console.warn(
              "Supabase connection failed, falling back to offline mode:",
              supabaseError
            );
            // Continue to offline fallback
          }
        }

        // Fallback to API backend
        if (authMode === "api") {
          try {
            const response = await fetch(`${apiUrl}/auth/login`, {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
              const error = await response.json();
              console.warn(
                "API login failed, falling back to offline mode:",
                error.error?.message
              );
            } else {
              const { user: userData, accessToken: token } =
                await response.json();
              setUser(userData);
              setAccessToken(token);

              // Update apiClient with new token
              apiClient.setAccessToken(token);

              // Sync to localStorage
              localStorage.setItem(
                "bauplan_offline_user",
                JSON.stringify(userData)
              );

              return;
            }
          } catch (apiError) {
            console.warn(
              "API connection failed, falling back to offline mode:",
              apiError
            );
            // Continue to offline fallback
          }
        }

        // ⚠️ OFFLINE MODE — Development Only
        // In production, Supabase or API must be configured. If neither is, we block login.
        const isProduction = import.meta.env.PROD;
        if (isProduction && !isDesktopFileRuntime) {
          throw new Error(
            'Authentifizierung nicht konfiguriert. Bitte wenden Sie sich an den Administrator.'
          );
        }

        // Dev-only allowlist — only these credentials work in offline mode
        const DEV_USERS: Array<{ email: string; password: string; role: User['role'] }> = [
          { email: 'admin@bauplan.de', password: 'admin123', role: 'ADMIN' },
          { email: 'admin@test.com', password: 'admin123', role: 'ADMIN' },
          { email: 'manager@bauplan.de', password: 'manager123', role: 'MANAGER' },
          { email: 'test@test.com', password: 'test123', role: 'USER' },
          { email: 'user@bauplan.de', password: 'user123', role: 'USER' },
          { email: 'client@bauplan.de', password: 'client123', role: 'GUEST' },
        ];
        const devUser = DEV_USERS.find(
          (u) => u.email === email && u.password === password
        );
        if (!devUser) {
          throw new Error('Ungültige Anmeldedaten. (Offline-Modus: nur Test-Accounts erlaubt)');
        }

        console.warn('🔓 DEV-ONLY offline authentication — do not use in production');
        const offlineUser: User = {
          id: `offline-${devUser.email}`,
          email: devUser.email,
          firstName: devUser.email.split('@')[0],
          lastName: '',
          name: devUser.email.split('@')[0],
          role: devUser.role,
          status: 'ACTIVE',
          permissions: [],
        };

        setUser(offlineUser);
        setAccessToken('offline-dev-token');
        localStorage.setItem(
          'bauplan_offline_user',
          JSON.stringify(offlineUser)
        );
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, authMode, isDesktopFileRuntime, supabaseAuth]
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName?: string,
      lastName?: string
    ) => {
      setIsLoading(true);
      try {
        // Try Supabase first
        if (authMode === "supabase") {
          const { user: supabaseUser, error } = await supabaseAuth.signUp(
            email,
            password,
            {
              name:
                `${firstName || ""} ${lastName || ""}`.trim() ||
                email.split("@")[0],
            }
          );

          if (error) {
            throw new Error(error.message);
          }

          if (supabaseUser) {
            const userData: User = {
              id: supabaseUser.id,
              email: supabaseUser.email,
              firstName: firstName || supabaseUser.name.split(" ")[0],
              lastName: lastName || supabaseUser.name.split(" ")[1] || "",
              name: supabaseUser.name,
              role: supabaseUser.role,
              status: "ACTIVE",
              permissions: [],
            };

            setUser(userData);

            // Sync to localStorage
            localStorage.setItem(
              "bauplan_offline_user",
              JSON.stringify(userData)
            );

            return;
          }
        }

        // Fallback to API backend
        if (authMode === "api") {
          const response = await fetch(`${apiUrl}/auth/register`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password, firstName, lastName }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Registration failed");
          }

          const { user: userData, accessToken: token } = await response.json();
          setUser(userData);
          setAccessToken(token);

          // Update apiClient with new token
          apiClient.setAccessToken(token);

          // Sync to localStorage
          localStorage.setItem(
            "bauplan_offline_user",
            JSON.stringify(userData)
          );
        }

        // Offline mode
        if (authMode === "offline") {
          const offlineUser: User = {
            id: `offline-${Date.now()}`,
            email,
            firstName: firstName || email.split("@")[0],
            lastName: lastName || "",
            name:
              `${firstName || ""} ${lastName || ""}`.trim() ||
              email.split("@")[0],
            role: "USER",
            status: "ACTIVE",
            permissions: [],
          };

          setUser(offlineUser);
          localStorage.setItem(
            "bauplan_offline_user",
            JSON.stringify(offlineUser)
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, authMode, supabaseAuth]
  );

  // Permission checker
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;

      // Admin role has all permissions
      if (user.role === "ADMIN") return true;

      // Check if user has the specific permission
      if (user.permissions && user.permissions.includes(permission)) {
        return true;
      }

      // Check for wildcard permissions (e.g., "project:*" grants all project permissions)
      if (user.permissions) {
        const [resource, action] = permission.split(":");
        const wildcardPermission = `${resource}:*`;
        if (user.permissions.includes(wildcardPermission)) {
          return true;
        }
      }

      return false;
    },
    [user]
  );

  const hasRole = useCallback(
    (role: string | string[]): boolean => {
      if (!user) return false;
      const userRole = user.role.toLowerCase();
      if (Array.isArray(role)) {
        return role.some((r) => r.toLowerCase() === userRole);
      }
      return role.toLowerCase() === userRole;
    },
    [user]
  );

  const value: AuthContextType = {
    user,
    accessToken,
    isLoading,
    isAuthenticated: !!user, // In offline mode, only check if user exists
    login,
    register,
    logout,
    refreshToken: refreshAccessToken,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
