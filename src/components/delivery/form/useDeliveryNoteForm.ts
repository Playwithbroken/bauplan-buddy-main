import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  DeliveryNote,
  DeliveryNoteFormData,
  DeliveryNoteItem
} from '@/services/deliveryNoteService';
import { DraftService } from '@/services/draftService';
import DocumentNumberingService from '@/services/documentNumberingService';

const DRAFT_STORAGE_KEY = 'bauplan.draft.deliveryNoteForm';
const MAX_HISTORY_ENTRIES = 50;

const DEFAULT_SECTION_TITLE = 'Allgemeine Positionen';

const generateSectionId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `section-${crypto.randomUUID()}`;
  }
  return `section-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const createSection = (title = DEFAULT_SECTION_TITLE) => ({
  id: generateSectionId(),
  title
});

const createEmptyItem = (section = createSection()): Partial<DeliveryNoteItem> => ({
  description: '',
  quantity: 0,
  unit: 'Stk',
  deliveredQuantity: undefined,
  sectionId: section.id,
  sectionTitle: section.title
});

const normalizeSectionAssignments = (
  source?: Partial<DeliveryNoteItem>[]
): Partial<DeliveryNoteItem>[] => {
  if (!source || source.length === 0) {
    const section = createSection();
    return [createEmptyItem(section)];
  }

  let currentSection = createSection();
  return source.map((original, index) => {
    const sectionId =
      original.sectionId && original.sectionId.trim().length > 0
        ? original.sectionId.trim()
        : index === 0
        ? currentSection.id
        : currentSection.id;

    const sectionTitle =
      original.sectionTitle?.trim() ||
      (sectionId === currentSection.id ? currentSection.title : DEFAULT_SECTION_TITLE);

    if (sectionId !== currentSection.id || sectionTitle !== currentSection.title) {
      currentSection = {
        id: sectionId || generateSectionId(),
        title: sectionTitle || DEFAULT_SECTION_TITLE
      };
    }

    return {
      ...original,
      sectionId: currentSection.id,
      sectionTitle: currentSection.title
    };
  });
};

const cloneItems = (source?: Partial<DeliveryNoteItem>[]) =>
  normalizeSectionAssignments(source).map(item => ({ ...item }));

const buildDefaultFormData = (): DeliveryNoteFormData => ({
  date: new Date().toISOString().split('T')[0],
  customerId: '',
  customerName: '',
  customerAddress: '',
  projectId: '',
  projectName: '',
  orderNumber: '',
  deliveryAddress: '',
  items: [],
  notes: '',
  deliveryMethod: 'pickup'
});

const resolveDraftNumber = (initialData?: DeliveryNoteFormInitialData): string => {
  if (initialData?.number) {
    return initialData.number;
  }

  try {
    return DocumentNumberingService.previewNextNumber('delivery_note').number;
  } catch (error) {
    console.error('Failed to preview delivery note number', error);
    return 'LS-ENTWURF';
  }
};

const validateItems = (items: Partial<DeliveryNoteItem>[]): string | null => {
  if (!Array.isArray(items) || items.length === 0) {
    return 'Fuegen Sie mindestens eine Position hinzu.';
  }

  for (const item of items) {
    const sectionId = item.sectionId?.trim();
    const sectionTitle = item.sectionTitle?.trim();

    if (!sectionId || !sectionTitle) {
      return 'Bitte vergeben Sie fuer jeden Abschnitt einen Titel.';
    }

    const description = item.description?.trim();
    const quantity = Number(item.quantity ?? 0);
    const unit = item.unit ?? '';
    const deliveredQuantity =
      item.deliveredQuantity !== undefined ? Number(item.deliveredQuantity) : quantity;

    if (!description) {
      return 'Bitte ergaenzen Sie eine Beschreibung fuer jede Position.';
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return 'Die Menge jeder Position muss groesser als 0 sein.';
    }

    if (!unit) {
      return 'Bitte waehlen Sie eine Einheit fuer jede Position.';
    }

    if (!Number.isFinite(deliveredQuantity) || deliveredQuantity < 0) {
      return 'Gelieferte Mengen duerfen nicht negativ sein.';
    }

    if (deliveredQuantity > quantity) {
      return 'Gelieferte Mengen duerfen die bestellte Menge nicht ueberschreiten.';
    }
  }

  return null;
};

const normalizeItemsForSubmit = (items: Partial<DeliveryNoteItem>[]): Partial<DeliveryNoteItem>[] =>
  items.map((item, index) => {
    const quantity = Number(item.quantity ?? 0);
    const deliveredQuantity =
      item.deliveredQuantity !== undefined ? Number(item.deliveredQuantity) : quantity;
    const sectionId = item.sectionId?.trim() || `section-${index + 1}`;
    const sectionTitle = item.sectionTitle?.trim() || DEFAULT_SECTION_TITLE;

    return {
      ...item,
      description: item.description?.trim() ?? '',
      quantity,
      unit: item.unit ?? '',
      deliveredQuantity,
      notes: item.notes?.trim(),
      sectionId,
      sectionTitle,
      sortOrder: index
    };
  });

export type DeliveryNoteFormInitialData = Partial<DeliveryNoteFormData> & { number?: string };

interface UseDeliveryNoteFormOptions {
  initialData?: DeliveryNoteFormInitialData;
  onSubmit?: (data: DeliveryNoteFormData) => void;
}

export interface SubmitResult {
  success: boolean;
  data?: DeliveryNoteFormData;
  error?: string;
}

export interface UseDeliveryNoteFormResult {
  formData: DeliveryNoteFormData;
  updateField: (field: keyof DeliveryNoteFormData, value: unknown) => void;
  items: Partial<DeliveryNoteItem>[];
  addItem: () => void;
  addItemToSection: (sectionId: string) => void;
  addSection: () => void;
  removeItem: (index: number) => void;
  removeSection: (sectionId: string) => void;
  handleItemChange: (
    index: number,
    field: keyof DeliveryNoteItem,
    value: string | number | undefined
  ) => void;
  updateSectionTitle: (sectionId: string, title: string) => void;
  isFormReadyForActions: boolean;
  getFormValidationMessage: () => string | null;
  createDraftDeliveryNote: () => DeliveryNote;
  submitForm: () => SubmitResult;
  isGeneratingPdf: boolean;
  setIsGeneratingPdf: (value: boolean) => void;
  draftNumber: string;
}

export const useDeliveryNoteForm = ({
  initialData,
  onSubmit
}: UseDeliveryNoteFormOptions): UseDeliveryNoteFormResult => {
  const [formData, setFormData] = useState<DeliveryNoteFormData>(() => ({
    ...buildDefaultFormData(),
    ...initialData
  }));
  const [items, setItems] = useState<Partial<DeliveryNoteItem>[]>(() =>
    cloneItems(initialData?.items)
  );
  const [history, setHistory] = useState<DeliveryNoteFormData[]>([]);
  const [redoStack, setRedoStack] = useState<DeliveryNoteFormData[]>([]);
  const [navigatingHistory, setNavigatingHistory] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [draftNumber, setDraftNumber] = useState<string>(() =>
    resolveDraftNumber(initialData)
  );

  useEffect(() => {
    const draft = DraftService.load<DeliveryNoteFormData>(DRAFT_STORAGE_KEY);
    if (draft) {
      setFormData(prev => ({ ...prev, ...draft, date: draft.date || prev.date }));
      setItems(cloneItems(draft.items));
      setHistory([draft]);
    } else {
      setHistory([{ ...formData, items } as DeliveryNoteFormData]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialData) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      ...initialData,
      date: initialData.date ?? prev.date,
      deliveryMethod: initialData.deliveryMethod ?? prev.deliveryMethod
    }));

    if (initialData.items) {
      setItems(cloneItems(initialData.items));
    }

    setDraftNumber(resolveDraftNumber(initialData));
  }, [initialData]);

  const handleItemChange = useCallback(
    (
      index: number,
      field: keyof DeliveryNoteItem,
      value: string | number | undefined
    ) => {
      setItems(prevItems => {
        const next = [...prevItems];
        if (field === 'sectionTitle' && typeof value === 'string') {
          const sectionId = next[index]?.sectionId;
          if (sectionId) {
            return next.map(item =>
              item.sectionId === sectionId ? { ...item, sectionTitle: value } : item
            );
          }
        }
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    []
  );

  const addItem = useCallback(() => {
    setItems(prev => {
      const lastItem = prev[prev.length - 1];
      const section =
        lastItem && lastItem.sectionId && lastItem.sectionTitle
          ? { id: lastItem.sectionId, title: lastItem.sectionTitle ?? DEFAULT_SECTION_TITLE }
          : createSection();
      const next = [...prev];
      const insertIndex = prev.length;
      next.splice(insertIndex, 0, {
        ...createEmptyItem(section)
      });
      return next;
    });
  }, []);

  const addItemToSection = useCallback((sectionId: string) => {
    setItems(prev => {
      const sectionTitle =
        prev.find(item => item.sectionId === sectionId)?.sectionTitle ?? DEFAULT_SECTION_TITLE;
      const newItem = createEmptyItem({ id: sectionId, title: sectionTitle });
      const next = [...prev];
      let lastIndex = -1;
      for (let i = 0; i < prev.length; i += 1) {
        if (prev[i]?.sectionId === sectionId) {
          lastIndex = i;
        }
      }
      const insertIndex = lastIndex >= 0 ? lastIndex + 1 : prev.length;
      next.splice(insertIndex, 0, newItem);
      return next;
    });
  }, []);

  const addSection = useCallback(() => {
    setItems(prev => {
      const section = createSection('Neuer Abschnitt');
      return [...prev, createEmptyItem(section)];
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => {
      if (prev.length <= 1) {
        return prev;
      }
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [createEmptyItem(createSection())];
    });
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setItems(prev => {
      const filtered = prev.filter(item => item.sectionId !== sectionId);
      if (filtered.length === 0) {
        return [createEmptyItem(createSection())];
      }
      return filtered;
    });
  }, []);

  const updateSectionTitle = useCallback((sectionId: string, title: string) => {
    setItems(prev =>
      prev.map(item =>
        item.sectionId === sectionId ? { ...item, sectionTitle: title } : item
      )
    );
  }, []);

  useEffect(() => {
    const snapshot: DeliveryNoteFormData = {
      ...formData,
      items: items.map(item => ({ ...item }))
    };
    DraftService.save(DRAFT_STORAGE_KEY, snapshot);
    if (!navigatingHistory) {
      setHistory(prev => {
        const last = prev[prev.length - 1];
        if (last && JSON.stringify(last) === JSON.stringify(snapshot)) {
          return prev;
        }
        const next = [...prev, snapshot];
        return next.length > MAX_HISTORY_ENTRIES ? next.slice(next.length - MAX_HISTORY_ENTRIES) : next;
      });
      setRedoStack([]);
    }
  }, [formData, items, navigatingHistory]);

  useEffect(() => {
    const shouldHandleShortcut = (event: KeyboardEvent): boolean => {
      const formElement = document.getElementById('delivery-note-form');
      if (!formElement) {
        return false;
      }

      const activeElement = document.activeElement as HTMLElement | null;
      if (!activeElement || !formElement.contains(activeElement)) {
        return false;
      }

      const target = (event.target as HTMLElement | null) ?? activeElement;
      if (!target) {
        return false;
      }

      if (target.isContentEditable) {
        return false;
      }

      const tagName = target.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
        return false;
      }

      if (target.getAttribute('role') === 'textbox') {
        return false;
      }

      return true;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const isCtrl = event.ctrlKey || event.metaKey;
      if (!isCtrl) {
        return;
      }

      if (!shouldHandleShortcut(event)) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) {
        if (history.length > 1) {
          event.preventDefault();
          const previousSnapshot = history[history.length - 2]!;
          setRedoStack(rs => [history[history.length - 1]!, ...rs]);
          setHistory(h => h.slice(0, h.length - 1));
          setNavigatingHistory(true);
          setFormData(prev => ({ ...prev, ...previousSnapshot }));
          setItems(cloneItems(previousSnapshot.items));
        }
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        if (redoStack.length > 0) {
          event.preventDefault();
          const nextSnapshot = redoStack[0]!;
          setRedoStack(rs => rs.slice(1));
          setHistory(h => [...h, nextSnapshot]);
          setNavigatingHistory(true);
          setFormData(prev => ({ ...prev, ...nextSnapshot }));
          setItems(cloneItems(nextSnapshot.items));
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [history, redoStack]);

  useEffect(() => {
    if (navigatingHistory) {
      setNavigatingHistory(false);
    }
  }, [formData, items, navigatingHistory]);

  const itemValidationError = useMemo(() => validateItems(items), [items]);
  const isCustomerInfoMissing = useMemo(
    () => !formData.customerName.trim() || !formData.customerAddress.trim(),
    [formData.customerName, formData.customerAddress]
  );

  const getFormValidationMessage = useCallback((): string | null => {
    if (isCustomerInfoMissing) {
      return 'Bitte fuellen Sie alle Pflichtfelder aus.';
    }
    if (itemValidationError) {
      return itemValidationError;
    }
    return null;
  }, [isCustomerInfoMissing, itemValidationError]);

  const isFormReadyForActions = !itemValidationError && !isCustomerInfoMissing;

  const updateField = useCallback((field: keyof DeliveryNoteFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value as DeliveryNoteFormData[keyof DeliveryNoteFormData]
    }));
  }, []);

  const createDraftDeliveryNote = useCallback((): DeliveryNote => {
    const normalizedItems = normalizeItemsForSubmit(items);
    const nowIso = new Date().toISOString();
    const dateOnly = formData.date || new Date().toISOString().split('T')[0];

    return {
      id: 'delivery-note-draft',
      number: draftNumber || 'LS-ENTWURF',
      date: dateOnly,
      customerId: formData.customerId?.trim() ?? '',
      customerName: formData.customerName.trim(),
      customerAddress: formData.customerAddress.trim(),
      projectId: formData.projectId?.trim() || undefined,
      projectName: formData.projectName?.trim() || undefined,
      orderNumber: formData.orderNumber?.trim() || undefined,
      deliveryAddress: formData.deliveryAddress?.trim() || undefined,
      items: normalizedItems.map((item, index): DeliveryNoteItem => ({
        id: item.id ?? `draft-item-${index}`,
        description: item.description ?? '',
        quantity: Number(item.quantity ?? 0),
        unit: item.unit ?? '',
        deliveredQuantity:
          item.deliveredQuantity !== undefined
            ? Number(item.deliveredQuantity)
            : Number(item.quantity ?? 0),
        notes: item.notes,
        sectionId: item.sectionId,
        sectionTitle: item.sectionTitle,
        sortOrder: item.sortOrder ?? index
      })),
      notes: formData.notes?.trim(),
      status: 'draft',
      createdBy: 'draft',
      createdAt: nowIso,
      updatedAt: nowIso,
      deliveredAt: undefined,
      deliveryMethod: formData.deliveryMethod || undefined,
      signature: undefined
    };
  }, [draftNumber, formData, items]);

  const submitForm = useCallback((): SubmitResult => {
    const validationMessage = getFormValidationMessage();
    if (validationMessage) {
      return { success: false, error: validationMessage };
    }

    const payload: DeliveryNoteFormData = {
      ...formData,
      customerId: formData.customerId?.trim() ?? '',
      customerName: formData.customerName.trim(),
      customerAddress: formData.customerAddress.trim(),
      projectId: formData.projectId?.trim(),
      projectName: formData.projectName?.trim(),
      orderNumber: formData.orderNumber?.trim(),
      deliveryAddress: formData.deliveryAddress?.trim(),
      notes: formData.notes?.trim(),
      date: formData.date || new Date().toISOString().split('T')[0],
      items: normalizeItemsForSubmit(items)
    };

    onSubmit?.(payload);
    DraftService.clear(DRAFT_STORAGE_KEY);

    return { success: true, data: payload };
  }, [formData, items, onSubmit, getFormValidationMessage]);

  return {
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
    setIsGeneratingPdf,
    draftNumber
  };
};
