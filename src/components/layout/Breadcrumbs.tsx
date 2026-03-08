/**
 * Breadcrumbs - Navigation breadcrumb component
 * Shows current location in app hierarchy with clickable path
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Route name mapping
const routeNames: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projekte',
  quotes: 'Angebote',
  invoices: 'Rechnungen',
  customers: 'Kunden',
  suppliers: 'Lieferanten',
  'order-confirmations': 'Auftragsbestätigungen',
  'delivery-notes': 'Lieferscheine',
  teams: 'Teams',
  procurement: 'Beschaffung',
  analytics: 'Analytics',
  documents: 'Dokumente',
  settings: 'Einstellungen',
  calendar: 'Kalender',
  chat: 'Chat',
  field: 'Außendienst',
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const location = useLocation();

  // Auto-generate breadcrumbs from path if not provided
  const breadcrumbItems = React.useMemo(() => {
    if (items) return items;

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const generatedItems: BreadcrumbItem[] = [
      { label: 'Home', href: '/dashboard', icon: <Home className="h-4 w-4" /> },
    ];

    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      generatedItems.push({ label, href: currentPath });
    });

    return generatedItems;
  }, [location.pathname, items]);

  // Don't show breadcrumbs on homepage
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center space-x-2 text-sm ${className}`}>
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        const isFirst = index === 0;

        return (
          <React.Fragment key={item.href}>
            {!isFirst && (
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
            )}
            {isLast ? (
              <span className="font-medium text-gray-900 dark:text-white flex items-center">
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
              >
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
