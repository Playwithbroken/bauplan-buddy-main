import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function OrganizationSwitcher() {
  const { user } = useAuth();

  // Mock organizations for now since we don't have an endpoint to fetch them yet
  // In a real implementation, we would fetch this from the API
  const organizations = [
    {
      id: user?.organizationId || "default",
      name: "My Organization",
      slug: "my-org",
    },
    // { id: 'org-2', name: 'Secondary Org', slug: 'sec-org' },
  ];

  const currentOrg =
    organizations.find((org) => org.id === user?.organizationId) ||
    organizations[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[200px] justify-between",
            "bg-background/50 backdrop-blur-sm border-border/50"
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate">{currentOrg.name}</span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              // Handle organization switch
              console.log("Switch to org:", org.id);
            }}
          >
            <Building2 className="h-4 w-4 opacity-50" />
            <span>{org.name}</span>
            {user?.organizationId === org.id && (
              <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => navigate("/organization/settings")}
        >
          <Settings className="h-4 w-4" />
          Manage Organization
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Create Organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
