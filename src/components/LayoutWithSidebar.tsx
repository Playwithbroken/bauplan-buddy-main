import * as React from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Separator } from "@/components/ui/separator";
import NotificationBell from "@/components/NotificationBell";
import SearchBar from "@/components/SearchBar";
import { MaintenanceAlertBadge } from "@/components/resources/MaintenanceAlertBadge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface LayoutWithSidebarProps {
  children: React.ReactNode;
  breadcrumbItems?: Array<{
    label: string;
    href?: string;
  }>;
  pageTitle?: string;
}

export function LayoutWithSidebar({
  children,
  breadcrumbItems = [],
  pageTitle,
}: LayoutWithSidebarProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {breadcrumbItems.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbItems.map((item, index) => (
                    <React.Fragment key={index}>
                      <BreadcrumbItem className="block">
                        {item.href ? (
                          <BreadcrumbLink href={item.href}>
                            {item.label}
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{item.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbItems.length - 1 && (
                        <BreadcrumbSeparator className="block" />
                      )}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
            {pageTitle &&
              (!breadcrumbItems.length ||
                pageTitle !==
                  breadcrumbItems[breadcrumbItems.length - 1].label) && (
                <h1 className="text-lg font-semibold block">{pageTitle}</h1>
              )}
          </div>

          {/* Search Bar */}
          <div className="hidden md:block w-64 px-2">
            <SearchBar />
          </div>

          <div className="flex items-center gap-2 px-4 text-xs font-semibold">
            <MaintenanceAlertBadge />
            <NotificationBell />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
