/**
 * HelpTooltip - Contextual help tooltip component
 * Shows helpful information when hovering over the icon
 */

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, Info, AlertCircle } from 'lucide-react';

interface HelpTooltipProps {
  content: string | React.ReactNode;
  type?: 'help' | 'info' | 'warning';
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  maxWidth?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  type = 'help',
  side = 'top',
  className = '',
  maxWidth = '300px',
}) => {
  const icons = {
    help: HelpCircle,
    info: Info,
    warning: AlertCircle,
  };

  const colors = {
    help: 'text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400',
    info: 'text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
    warning: 'text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300',
  };

  const Icon = icons[type];

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full ${className}`}
            aria-label="Help"
          >
            <Icon className={`h-4 w-4 ${colors[type]}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-sm" style={{ maxWidth }}>
          <div className="text-sm">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * FieldHelpTooltip - Specialized tooltip for form fields
 * Positioned next to input labels
 */
interface FieldHelpTooltipProps {
  label: string;
  help: string;
  required?: boolean;
}

export const FieldHelpTooltip: React.FC<FieldHelpTooltipProps> = ({
  label,
  help,
  required = false,
}) => {
  return (
    <div className="flex items-center gap-2 mb-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <HelpTooltip content={help} type="info" />
    </div>
  );
};

/**
 * InlineHelp - Expandable help text below inputs
 */
interface InlineHelpProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export const InlineHelp: React.FC<InlineHelpProps> = ({
  children,
  variant = 'default',
}) => {
  const variants = {
    default: 'text-gray-600 dark:text-gray-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
  };

  return (
    <p className={`text-xs mt-1 ${variants[variant]}`}>
      {children}
    </p>
  );
};

/**
 * FeatureTooltip - Detailed tooltip for feature explanations
 */
interface FeatureTooltipProps {
  title: string;
  description: string;
  features?: string[];
  link?: {
    href: string;
    label: string;
  };
}

export const FeatureTooltip: React.FC<FeatureTooltipProps> = ({
  title,
  description,
  features,
  link,
}) => {
  const content = (
    <div className="space-y-2">
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-gray-300">{description}</p>
      {features && features.length > 0 && (
        <ul className="text-xs space-y-1 mt-2 pl-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}
      {link && (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 text-xs underline block mt-2"
        >
          {link.label} →
        </a>
      )}
    </div>
  );

  return <HelpTooltip content={content} maxWidth="400px" />;
};

export default HelpTooltip;
