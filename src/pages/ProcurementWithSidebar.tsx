import React from 'react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import Procurement from './Procurement';
import { useLanguage } from '@/contexts/LanguageContext';

const ProcurementWithSidebar = () => {
  const { t } = useLanguage();
  const breadcrumbItems = [{ label: t('navigation.procurement') }];

  return (
    <LayoutWithSidebar
      breadcrumbItems={breadcrumbItems}
      pageTitle={t('navigation.procurement')}
    >
      <Procurement />
    </LayoutWithSidebar>
  );
};

export default ProcurementWithSidebar;