import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  const getLanguageName = (langCode: string) => {
    switch (langCode) {
      case 'de':
        return language === 'de' ? 'Deutsch' : 'German';
      case 'en':
        return language === 'de' ? 'Englisch' : 'English';
      default:
        return langCode.toUpperCase();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={getLanguageName(language)} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="de">{getLanguageName('de')}</SelectItem>
          <SelectItem value="en">{getLanguageName('en')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;