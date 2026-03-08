import React from 'react';
import { FileText, Package, Users, DollarSign, Inbox, Plus } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  type: 'quotes' | 'projects' | 'deliveries' | 'invoices' | 'team' | 'inventory';
  onAction?: () => void;
}

const emptyStatesConfig = {
  quotes: {
    icon: FileText,
    title: 'No quotes yet',
    description: 'Create your first quote to get started. Build comprehensive quotes with itemized details.',
    buttonText: 'Create Quote',
    illustration: '📄',
  },
  projects: {
    icon: Package,
    title: 'No projects yet',
    description: 'Start by converting a quote to a project, or create one from scratch.',
    buttonText: 'Create Project',
    illustration: '📦',
  },
  deliveries: {
    icon: Inbox,
    title: 'No delivery notes',
    description: 'Create delivery notes for your projects to track materials and progress.',
    buttonText: 'Create Delivery Note',
    illustration: '📋',
  },
  invoices: {
    icon: DollarSign,
    title: 'No invoices yet',
    description: 'Generate invoices from your projects and delivery notes.',
    buttonText: 'Create Invoice',
    illustration: '💰',
  },
  team: {
    icon: Users,
    title: 'No team members yet',
    description: 'Invite your team to collaborate on projects and manage them together.',
    buttonText: 'Invite Team Member',
    illustration: '👥',
  },
  inventory: {
    icon: Package,
    title: 'No inventory items',
    description: 'Add items to your inventory to track materials and supplies.',
    buttonText: 'Add Inventory Item',
    illustration: '📊',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction }) => {
  const config = emptyStatesConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-6xl mb-4">{config.illustration}</div>
      <Icon className="w-16 h-16 text-gray-300 mb-4" />
      <h3 className="text-2xl font-semibold text-gray-900 mb-2">{config.title}</h3>
      <p className="text-gray-600 text-center max-w-sm mb-6">{config.description}</p>
      {onAction && (
        <Button onClick={onAction} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {config.buttonText}
        </Button>
      )}
    </div>
  );
};

// Variants for different layouts

export const EmptyStateCompact: React.FC<EmptyStateProps> = ({ type, onAction }) => {
  const config = emptyStatesConfig[type];

  return (
    <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
      <p className="text-gray-600 mb-3">{config.description}</p>
      {onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="flex items-center gap-2 mx-auto">
          <Plus className="w-3 h-3" />
          {config.buttonText}
        </Button>
      )}
    </div>
  );
};

export const EmptyStateInline: React.FC<EmptyStateProps & { fullHeight?: boolean }> = ({
  type,
  onAction,
  fullHeight = false,
}) => {
  const config = emptyStatesConfig[type];

  return (
    <div className={`flex flex-col items-center justify-center text-center ${fullHeight ? 'h-96' : 'py-12'}`}>
      <p className="text-gray-500 mb-4">{config.title}</p>
      {onAction && (
        <Button size="sm" onClick={onAction} variant="outline">
          {config.buttonText}
        </Button>
      )}
    </div>
  );
};
