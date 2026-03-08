import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  HelpCircle,
  ExternalLink,
  BookOpen,
  Video,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';

interface HelpItem {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'tutorial' | 'faq';
  url?: string;
  readTime?: string;
  difficulty?: 'Anfänger' | 'Fortgeschritten' | 'Experte';
}

interface HelpButtonProps {
  topic: string;
  helpItems?: HelpItem[];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'text' | 'both';
  className?: string;
}

const defaultHelpItems: Record<string, HelpItem[]> = {
  'appointments': [
    {
      id: 'create-appointment',
      title: 'Termine erstellen',
      description: 'Schritt-für-Schritt Anleitung zum Erstellen neuer Termine',
      type: 'tutorial',
      readTime: '3 min',
      difficulty: 'Anfänger'
    },
    {
      id: 'recurring-appointments',
      title: 'Wiederkehrende Termine',
      description: 'So richten Sie Serie und wiederkehrende Termine ein',
      type: 'article',
      readTime: '5 min',
      difficulty: 'Fortgeschritten'
    },
    {
      id: 'appointment-conflicts',
      title: 'Termine konflikte lösen',
      description: 'Was tun bei Terminkonflikten?',
      type: 'faq',
      readTime: '2 min'
    }
  ],
  'projects': [
    {
      id: 'project-setup',
      title: 'Projekte anlegen',
      description: 'Neue Projekte erstellen und konfigurieren',
      type: 'tutorial',
      readTime: '4 min',
      difficulty: 'Anfänger'
    },
    {
      id: 'project-templates',
      title: 'Projektvorlagen verwenden',
      description: 'Effizienter arbeiten mit Projektvorlagen',
      type: 'article',
      readTime: '6 min',
      difficulty: 'Fortgeschritten'
    }
  ],
  'documents': [
    {
      id: 'upload-documents',
      title: 'Dokumente hochladen',
      description: 'Dateien hochladen und organisieren',
      type: 'tutorial',
      readTime: '3 min',
      difficulty: 'Anfänger'
    },
    {
      id: 'document-ocr',
      title: 'Texterkennung nutzen',
      description: 'OCR für gescannte Dokumente aktivieren',
      type: 'article',
      readTime: '4 min',
      difficulty: 'Fortgeschritten'
    }
  ],
  'settings': [
    {
      id: 'user-settings',
      title: 'Benutzereinstellungen',
      description: 'Profil und persönliche Einstellungen anpassen',
      type: 'tutorial',
      readTime: '5 min',
      difficulty: 'Anfänger'
    },
    {
      id: 'notifications',
      title: 'Benachrichtigungen konfigurieren',
      description: 'E-Mail und Push-Benachrichtigungen einrichten',
      type: 'article',
      readTime: '7 min',
      difficulty: 'Fortgeschritten'
    }
  ]
};

const HelpButton: React.FC<HelpButtonProps> = ({
  topic,
  helpItems,
  size = 'md',
  variant = 'icon',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const items = helpItems || defaultHelpItems[topic] || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'tutorial': return <BookOpen className="h-4 w-4" />;
      case 'faq': return <HelpCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Anfänger': return 'bg-green-100 text-green-800';
      case 'Fortgeschritten': return 'bg-yellow-100 text-yellow-800';
      case 'Experte': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8';
      case 'lg': return 'h-12 w-12';
      default: return 'h-10 w-10';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3';
      case 'lg': return 'h-6 w-6';
      default: return 'h-4 w-4';
    }
  };

  const handleItemClick = (item: HelpItem) => {
    if (item.url) {
      window.open(item.url, '_blank');
    } else {
      // Navigate to documentation page with specific article
      window.open(`/documentation?section=${topic}&article=${item.id}`, '_blank');
    }
    setIsOpen(false);
  };

  const openFullDocumentation = () => {
    window.open(`/documentation?section=${topic}`, '_blank');
    setIsOpen(false);
  };

  if (items.length === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`${getButtonSize()} ${className}`}
        onClick={openFullDocumentation}
        title="Hilfe anzeigen"
      >
        <HelpCircle className={getIconSize()} />
        {variant === 'text' && <span className="ml-2">Hilfe</span>}
        {variant === 'both' && <span className="ml-2">Hilfe</span>}
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`${getButtonSize()} ${className}`}
          title="Hilfe anzeigen"
        >
          <HelpCircle className={getIconSize()} />
          {variant === 'text' && <span className="ml-2">Hilfe</span>}
          {variant === 'both' && <span className="ml-2">Hilfe</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          <h3 className="font-semibold text-sm mb-3">
            Hilfe zu {topic.charAt(0).toUpperCase() + topic.slice(1)}
          </h3>
          
          <div className="space-y-3">
            {items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2">
                      {item.readTime && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {item.readTime}
                        </div>
                      )}
                      {item.difficulty && (
                        <Badge size="sm" className={getDifficultyColor(item.difficulty)}>
                          {item.difficulty}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>

          {items.length > 3 && (
            <>
              <Separator className="my-3" />
              <p className="text-xs text-gray-500 text-center">
                +{items.length - 3} weitere Artikel verfügbar
              </p>
            </>
          )}

          <Separator className="my-3" />
          
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={openFullDocumentation}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Vollständige Dokumentation
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default HelpButton;