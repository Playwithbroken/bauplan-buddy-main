import {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

// User types for role-based access control
export type UserRole = "admin" | "manager" | "user" | "client";

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  avatar?: string;
  permissions: string[];
  lastLogin?: Date;
  emailVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (
    userData: RegisterData
  ) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (
    userData: Partial<User>
  ) => Promise<{ success: boolean; error?: string }>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  refreshToken: () => Promise<boolean>; // Kept for compatibility
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        mapSupabaseUserToUser(session.user).then(setUser);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        mapSupabaseUserToUser(session.user).then(setUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const mapSupabaseUserToUser = async (
    supabaseUser: SupabaseUser
  ): Promise<User> => {
    // In a real app, we would fetch the user profile from our database
    // For now, we'll use metadata or defaults
    const metadata = supabaseUser.user_metadata || {};
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name: metadata.name || supabaseUser.email?.split("@")[0] || "User",
      firstName: metadata.firstName || metadata.first_name,
      lastName: metadata.lastName || metadata.last_name,
      // FORCE ADMIN ROLE FOR DEMO/DEV ENVIRONMENT
      // This ensures the user has full access to all "Best in World" features
      role: "admin",
      permissions: ["all"],
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: new Date(supabaseUser.updated_at || supabaseUser.created_at),
      lastLogin: supabaseUser.last_sign_in_at
        ? new Date(supabaseUser.last_sign_in_at)
        : undefined,
      emailVerified: !!supabaseUser.email_confirmed_at,
    };
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const register = async (userData: RegisterData) => {
    const { error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          role: userData.role || "user",
        },
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const updateProfile = async (userData: Partial<User>) => {
    // TODO: Update profile in DB
    return { success: true };
  };

  const hasPermission = (permission: string) => {
    return user?.permissions.includes(permission) || false;
  };

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!user) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  };

  const refreshToken = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    return !error && !!data.session;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        updateProfile,
        hasPermission,
        hasRole,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
