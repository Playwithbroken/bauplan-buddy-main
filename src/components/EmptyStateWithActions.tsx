/**
 * EmptyStateWithActions - Enhanced empty state component with helpful guidance
 * Provides visual feedback and clear actions when there's no data
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Action {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  icon?: LucideIcon;
}

interface EmptyStateWithActionsProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: Action[];
  tips?: string[];
  illustration?: React.ReactNode;
  className?: string;
}

export const EmptyStateWithActions: React.FC<EmptyStateWithActionsProps> = ({
  icon: Icon,
  title,
  description,
  actions = [],
  tips = [],
  illustration,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-center min-h-[400px] p-8 ${className}`}>
      <Card className="max-w-2xl w-full border-2 border-dashed">
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-6">
            {/* Icon or Illustration */}
            {illustration || (
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                  <Icon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            )}

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {description}
              </p>
            </div>

            {/* Tips */}
            {tips.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                  💡 Hilfreiche Tipps:
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 text-left">
                  {tips.map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            {actions.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    variant={action.variant || (index === 0 ? 'default' : 'outline')}
                    className="min-w-[140px]"
                  >
                    {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmptyStateWithActions;
