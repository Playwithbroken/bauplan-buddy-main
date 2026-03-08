import React from 'react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';

interface PageWithSidebarProps {
  children: React.ReactNode;
  pageTitle: string;
  breadcrumbItems?: Array<{
    label: string;
    href?: string;
  }>;
}

export function PageWithSidebar({ 
  children, 
  pageTitle, 
  breadcrumbItems = [] 
}: PageWithSidebarProps) {
  const defaultBreadcrumbs = [
    { label: pageTitle }
  ];

  return (
    <LayoutWithSidebar 
      breadcrumbItems={breadcrumbItems.length > 0 ? breadcrumbItems : defaultBreadcrumbs}
      pageTitle={pageTitle}
    >
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h1 className="text-3xl font-bold mb-4">{pageTitle}</h1>
        {children}
      </div>
    </LayoutWithSidebar>
  );
}