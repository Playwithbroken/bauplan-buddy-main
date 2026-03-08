import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import deTranslations from '@/content/translations/de';
import enTranslations from '@/content/translations/en';

// Define the shape of our translation object
interface Translations {
  [key: string]: string | Translations;
}

// Define the context type
interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
  translations: Record<string, Translations>;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
  direction: 'ltr' | 'rtl';
}

// Create the context with a default value
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Define the provider props
interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: string;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ 
  children, 
  defaultLanguage = 'de' 
}) => {
  const [language, setLanguage] = useState<string>(defaultLanguage);
  
  // Load language preference from localStorage on initial render
  useEffect(() => {
    const savedLanguage = localStorage.getItem('bauplan-buddy-language');
    if (savedLanguage && (savedLanguage === 'de' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bauplan-buddy-language', language);
  }, [language]);

  // Available translations
  const translations: Record<string, Translations> = {
    de: deTranslations,
    en: enTranslations
  };

  // Translation function
  const t = (key: string): string => {
    // Split the key by dots to navigate nested objects
    const keys = key.split('.');
    let translation: string | Translations = translations[language];
    
    // Navigate through the nested objects
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = (translation as Translations)[k];
      } else {
        // Return the key if translation is not found
        return key;
      }
    }
    
    // Return the translation if it's a string, otherwise return the key
    return typeof translation === 'string' ? translation : key;
  };

  // Format date based on language
  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', options || defaultOptions).format(date);
  };

  // Format number based on language
  const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
    const defaultOptions: Intl.NumberFormatOptions = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    };
    
    return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', options || defaultOptions).format(number);
  };

  // Text direction based on language
  const direction: 'ltr' | 'rtl' = language === 'ar' ? 'rtl' : 'ltr';

  const value = {
    language,
    setLanguage,
    t,
    translations,
    formatDate,
    formatNumber,
    direction
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};