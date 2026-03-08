import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { ItemTemplateLibrary } from "./ItemTemplateLibrary";
import { ItemTemplate } from "@/services/itemTemplateService";

interface TemplatePickerButtonProps {
  onSelectTemplate: (template: ItemTemplate) => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
  className?: string;
}

/**
 * Reusable button component that opens the Item Template Library
 * Can be easily integrated into any form (Quotes, Invoices, Delivery Notes, etc.)
 */
export function TemplatePickerButton({
  onSelectTemplate,
  variant = "outline",
  size = "default",
  label = "Aus Vorlage",
  className,
}: TemplatePickerButtonProps) {
  const [showLibrary, setShowLibrary] = useState(false);

  const handleSelectTemplate = (template: ItemTemplate) => {
    onSelectTemplate(template);
    setShowLibrary(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowLibrary(true)}
        className={className}
      >
        <Package className="h-4 w-4 mr-2" />
        {label}
      </Button>

      <ItemTemplateLibrary
        open={showLibrary}
        onOpenChange={setShowLibrary}
        onSelectTemplate={handleSelectTemplate}
        mode="select"
      />
    </>
  );
}
