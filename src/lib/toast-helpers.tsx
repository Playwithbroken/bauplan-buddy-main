/**
 * Enhanced Toast Helpers
 * Provides user-friendly toast notifications with undo patterns
 * Following design system: non-blocking feedback, clear actions, accessible
 */

import React from "react";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

export interface UndoableAction {
  message: string;
  onUndo: () => void;
  undoLabel?: string;
  duration?: number;
}

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Show success toast
 */
export function showSuccess(options: ToastOptions | string) {
  const config =
    typeof options === "string" ? { description: options } : options;

  return toast({
    variant: "success",
    title: config.title || "Erfolgreich",
    description: config.description,
    duration: config.duration || 3000,
    action: config.action ? (
      <ToastAction
        altText={config.action.label}
        onClick={config.action.onClick}
      >
        {config.action.label}
      </ToastAction>
    ) : undefined,
  });
}

/**
 * Show error toast
 */
export function showError(options: ToastOptions | string) {
  const config =
    typeof options === "string" ? { description: options } : options;

  return toast({
    variant: "destructive",
    title: config.title || "Fehler",
    description: config.description,
    duration: config.duration || 5000,
    action: config.action ? (
      <ToastAction
        altText={config.action.label}
        onClick={config.action.onClick}
      >
        {config.action.label}
      </ToastAction>
    ) : undefined,
  });
}

/**
 * Show info toast
 */
export function showInfo(options: ToastOptions | string) {
  const config =
    typeof options === "string" ? { description: options } : options;

  return toast({
    variant: "info",
    title: config.title || "Information",
    description: config.description,
    duration: config.duration || 4000,
    action: config.action ? (
      <ToastAction
        altText={config.action.label}
        onClick={config.action.onClick}
      >
        {config.action.label}
      </ToastAction>
    ) : undefined,
  });
}

/**
 * Show warning toast
 */
export function showWarning(options: ToastOptions | string) {
  const config =
    typeof options === "string" ? { description: options } : options;

  return toast({
    variant: "warning",
    title: config.title || "Warnung",
    description: config.description,
    duration: config.duration || 4000,
    action: config.action ? (
      <ToastAction
        altText={config.action.label}
        onClick={config.action.onClick}
      >
        {config.action.label}
      </ToastAction>
    ) : undefined,
  });
}

/**
 * Show undoable action toast
 * Perfect for reversible actions like delete, archive, etc.
 */
export function showUndoable({
  message,
  onUndo,
  undoLabel = "Rückgängig",
  duration = 5000,
}: UndoableAction) {
  let undoClicked = false;

  const toastInstance = toast({
    variant: "default",
    description: message,
    duration,
    action: (
      <ToastAction
        altText={undoLabel}
        onClick={() => {
          undoClicked = true;
          onUndo();
          toastInstance.dismiss();
        }}
      >
        {undoLabel}
      </ToastAction>
    ),
    onOpenChange: (open) => {
      // If toast is closed and undo was not clicked, the action is confirmed
      if (!open && !undoClicked) {
        // Action is confirmed, no need to do anything
        // The original action was already executed
      }
    },
  });

  return toastInstance;
}

/**
 * Show loading toast with optional progress
 */
export function showLoading(message: string = "Lädt...") {
  return toast({
    variant: "default",
    description: message,
    duration: Infinity, // Stays until dismissed
  });
}

/**
 * Update an existing toast
 */
export function updateToast(
  toastId: string,
  options: {
    variant?: "default" | "destructive" | "success" | "warning" | "info";
    title?: string;
    description?: string;
  }
) {
  // Note: The update function is returned from toast()
  // This is a helper for common update patterns
  return {
    id: toastId,
    ...options,
  };
}

/**
 * Common toast patterns for specific actions
 */
export const toastPatterns = {
  /**
   * Item created successfully
   */
  created: (itemType: string) =>
    showSuccess(`${itemType} wurde erfolgreich erstellt`),

  /**
   * Item updated successfully
   */
  updated: (itemType: string) =>
    showSuccess(`${itemType} wurde erfolgreich aktualisiert`),

  /**
   * Item deleted with undo
   */
  deleted: (itemType: string, onUndo: () => void) =>
    showUndoable({
      message: `${itemType} wurde gelöscht`,
      onUndo,
    }),

  /**
   * Item saved successfully
   */
  saved: () => showSuccess("Änderungen wurden gespeichert"),

  /**
   * Copy to clipboard
   */
  copied: () => showSuccess("In Zwischenablage kopiert"),

  /**
   * File uploaded
   */
  uploaded: (fileName?: string) =>
    showSuccess(
      fileName ? `${fileName} wurde hochgeladen` : "Datei wurde hochgeladen"
    ),

  /**
   * Export started
   */
  exporting: () => showLoading("Export läuft..."),

  /**
   * Export completed
   */
  exported: () => showSuccess("Export abgeschlossen"),

  /**
   * Network error
   */
  networkError: () =>
    showError({
      title: "Verbindungsfehler",
      description: "Bitte überprüfen Sie Ihre Internetverbindung",
    }),

  /**
   * Validation error
   */
  validationError: (message: string) =>
    showError({
      title: "Ungültige Eingabe",
      description: message,
    }),

  /**
   * Permission denied
   */
  permissionDenied: () =>
    showError({
      title: "Zugriff verweigert",
      description: "Sie haben keine Berechtigung für diese Aktion",
    }),

  /**
   * Offline mode
   */
  offline: () =>
    showWarning({
      title: "Offline-Modus",
      description:
        "Änderungen werden synchronisiert, sobald Sie wieder online sind",
    }),

  /**
   * Sync in progress
   */
  syncing: () => showInfo("Synchronisierung läuft..."),

  /**
   * Sync completed
   */
  synced: () => showSuccess("Synchronisierung abgeschlossen"),
};

export default {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  loading: showLoading,
  undoable: showUndoable,
  patterns: toastPatterns,
};
