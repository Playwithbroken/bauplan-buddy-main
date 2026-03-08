import React, { useState } from 'react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { DeliveryNoteManager } from '@/components/delivery';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DeliveryNoteDialog } from '@/components/delivery';

export default function DeliveryNotesWithSidebar() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <LayoutWithSidebar
      pageTitle="Lieferscheine"
    >
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Lieferscheine</h1>
            <p className="text-muted-foreground">
              Verwalten Sie alle Lieferscheine für Ihre Bauprojekte
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Lieferschein
          </Button>
        </div>
        <DeliveryNoteManager />
      </div>
      
      <DeliveryNoteDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </LayoutWithSidebar>
  );
}