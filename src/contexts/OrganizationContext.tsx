import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "admin" | "member";
}

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  createOrganization: (
    name: string,
    slug: string
  ) => Promise<{ success: boolean; error?: string }>;
  switchOrganization: (orgId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch organization for the current user
    // For now, we'll just set loading to false
    setIsLoading(false);
  }, []);

  const createOrganization = async (name: string, slug: string) => {
    try {
      // TODO: Call API to create organization
      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to create organization" };
    }
  };

  const switchOrganization = async (orgId: string) => {
    // TODO: Switch organization logic
  };

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        isLoading,
        createOrganization,
        switchOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
};
