import React from 'react';
import { PageWithSidebar } from '@/components/PageWithSidebar';
import Documentation from './Documentation';

const DocumentationWithSidebar: React.FC = () => {
  return (
    <PageWithSidebar 
      pageTitle="Dokumentation"
      breadcrumbItems={[
        { label: 'Hilfe' },
        { label: 'Dokumentation' }
      ]}
    >
      <Documentation />
    </PageWithSidebar>
  );
};

export default DocumentationWithSidebar;