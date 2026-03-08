import React from "react";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import ProcurementDashboard from "@/components/procurement/ProcurementDashboard";
import { useLanguage } from "@/contexts/LanguageContext";

const Procurement: React.FC = () => {
  const { t } = useLanguage();
  const breadcrumbItems = [{ label: t("navigation.procurement") }];

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: t("navigation.procurement") },
      ]}
    >
      <div className="space-y-6">
        <ProcurementDashboard />
      </div>
    </LayoutWithSidebar>
  );
};

export default Procurement;
