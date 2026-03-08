import React, { useCallback } from 'react';
import { useToast } from '../../hooks/use-toast';
import DeliveryNoteService, { type DeliveryNoteFormData } from '@/services/deliveryNoteService';
import { useDeliveryNoteForm, type DeliveryNoteFormInitialData } from './form/useDeliveryNoteForm';
import { DeliveryNoteCustomerSection } from './form/CustomerSection';
import { DeliveryNoteDetailsSection } from './form/DeliveryDetailsSection';
import { DeliveryNoteItemsSection } from './form/ItemsSection';
import { DeliveryNoteNotesSection } from './form/NotesSection';
import { DeliveryNoteFormActions } from './form/FormActions';

interface DeliveryNoteFormProps {
  initialData?: DeliveryNoteFormInitialData;
  onSubmit?: (data: DeliveryNoteFormData) => void;
  onCancel?: () => void;
}

export const DeliveryNoteForm: React.FC<DeliveryNoteFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const { toast } = useToast();

  const {
    formData,
    updateField,
    items,
    addItem,
    addItemToSection,
    addSection,
    removeItem,
    removeSection,
    handleItemChange,
    updateSectionTitle,
    isFormReadyForActions,
    getFormValidationMessage,
    createDraftDeliveryNote,
    submitForm,
    isGeneratingPdf,
    setIsGeneratingPdf
  } = useDeliveryNoteForm({ initialData, onSubmit });

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const result = submitForm();
      if (!result.success) {
        toast({
          title: 'Fehler',
          description: result.error,
          variant: 'destructive'
        });
      }
    },
    [submitForm, toast]
  );

  const handlePrint = useCallback(() => {
    const validationMessage = getFormValidationMessage();
    if (validationMessage) {
      toast({
        title: 'Drucken nicht moeglich',
        description: validationMessage,
        variant: 'destructive'
      });
      return;
    }
    window.print();
  }, [getFormValidationMessage, toast]);

  const handleDownloadPDF = useCallback(async () => {
    const validationMessage = getFormValidationMessage();
    if (validationMessage) {
      toast({
        title: 'Download nicht moeglich',
        description: validationMessage,
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsGeneratingPdf(true);
      const draftDeliveryNote = createDraftDeliveryNote();
      const blob = await DeliveryNoteService.generatePDF(draftDeliveryNote);
      const filename = `${draftDeliveryNote.number.toLowerCase().replace(/\s+/g, '_')}.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      toast({
        title: 'PDF erstellt',
        description: `Der Lieferschein wurde als ${filename} gespeichert.`
      });
    } catch (error) {
      toast({
        title: 'Download fehlgeschlagen',
        description:
          error instanceof Error ? error.message : 'Das PDF konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [createDraftDeliveryNote, getFormValidationMessage, setIsGeneratingPdf, toast]);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} id="delivery-note-form">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DeliveryNoteCustomerSection
            data={formData}
            onChange={(field, value) => updateField(field, value)}
          />
          <DeliveryNoteDetailsSection
            data={formData}
            onChange={(field, value) => updateField(field, value)}
          />
        </div>
        <DeliveryNoteItemsSection
          items={items}
          onItemChange={handleItemChange}
          onAddItem={addItem}
          onAddItemToSection={addItemToSection}
          onAddSection={addSection}
          onRemoveItem={removeItem}
          onRemoveSection={removeSection}
          onSectionTitleChange={updateSectionTitle}
        />

        <DeliveryNoteNotesSection
          notes={formData.notes ?? ''}
          onChange={value => updateField('notes', value)}
        />

        <DeliveryNoteFormActions
          onCancel={onCancel}
          onPrint={handlePrint}
          onDownload={handleDownloadPDF}
          isGeneratingPdf={isGeneratingPdf}
          isReady={isFormReadyForActions}
        />
      </form>
    </div>
  );
};
