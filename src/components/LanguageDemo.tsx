import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LanguageDemo = () => {
  const { t, language, formatDate, formatNumber } = useLanguage();
  const [amount, setAmount] = useState<number>(1234.56);
  const [date, setDate] = useState<Date>(new Date());

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('common.languageDemo')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="amount">{t('common.amount')}</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter amount"
            />
            <p className="text-sm text-muted-foreground">
              {t('common.formattedAmount')}: {formatNumber(amount, { style: 'currency', currency: language === 'de' ? 'EUR' : 'USD' })}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">{t('common.date')}</Label>
            <Input
              id="date"
              type="date"
              value={date.toISOString().split('T')[0]}
              onChange={(e) => setDate(new Date(e.target.value))}
            />
            <p className="text-sm text-muted-foreground">
              {t('common.formattedDate')}: {formatDate(date)}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="space-y-2">
            <h3 className="font-medium">{t('common.currentLanguage')}</h3>
            <p>{language === 'de' ? 'Deutsch' : 'English'}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">{t('common.textDirection')}</h3>
            <p>{t('common.leftToRight')}</p>
          </div>
        </div>
        
        <div className="pt-4">
          <h3 className="font-medium mb-2">{t('common.sampleTranslations')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>{t('navigation.dashboard')}:</span>
              <span>{t('dashboard.title')}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('navigation.projects')}:</span>
              <span>{t('projects.title')}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('navigation.calendar')}:</span>
              <span>{t('calendar.title')}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('common.save')}:</span>
              <span>{t('common.save')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LanguageDemo;