import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import InvoiceManagementDashboard from '@/components/invoice/InvoiceManagementDashboard';

const Invoices = () => {
  const breadcrumbItems: { label: string }[] = [];

  return (
    <LayoutWithSidebar 
      breadcrumbItems={breadcrumbItems}
      pageTitle="Rechnungen"
    >
      <InvoiceManagementDashboard />
    </LayoutWithSidebar>
  );
};

export default Invoices;