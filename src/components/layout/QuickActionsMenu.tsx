/**
 * QuickActionsMenu - Floating action menu for quick access to common tasks
 * Accessible via Ctrl+K or clicking the floating button
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MultiWindowDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  FileText,
  FolderPlus,
  DollarSign,
  UserPlus,
  Calendar,
  Search,
  Zap,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
  category: "create" | "navigate" | "action";
}

export const QuickActionsMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Quick actions configuration
  const actions: QuickAction[] = [
    {
      id: "create-quote",
      label: "Neues Angebot erstellen",
      icon: <FileText className="h-4 w-4" />,
      action: () => navigate("/quotes?action=create"),
      keywords: ["angebot", "quote", "erstellen", "create"],
      category: "create",
    },
    {
      id: "create-project",
      label: "Neues Projekt erstellen",
      icon: <FolderPlus className="h-4 w-4" />,
      action: () => navigate("/projects?action=create"),
      keywords: ["projekt", "project", "erstellen", "create"],
      category: "create",
    },
    {
      id: "create-invoice",
      label: "Neue Rechnung erstellen",
      icon: <DollarSign className="h-4 w-4" />,
      action: () => navigate("/invoices?action=create"),
      keywords: ["rechnung", "invoice", "erstellen", "create"],
      category: "create",
    },
    {
      id: "create-customer",
      label: "Neuen Kunden anlegen",
      icon: <UserPlus className="h-4 w-4" />,
      action: () => navigate("/customers?action=create"),
      keywords: ["kunde", "customer", "anlegen", "create"],
      category: "create",
    },
    {
      id: "view-calendar",
      label: "Kalender öffnen",
      icon: <Calendar className="h-4 w-4" />,
      action: () => navigate("/calendar"),
      keywords: ["kalender", "calendar", "termine"],
      category: "navigate",
    },
    {
      id: "view-analytics",
      label: "Analytics ansehen",
      icon: <Zap className="h-4 w-4" />,
      action: () => navigate("/analytics"),
      keywords: ["analytics", "statistik", "auswertung"],
      category: "navigate",
    },
  ];

  // Filter actions based on search
  const filteredActions = React.useMemo(() => {
    if (!searchQuery.trim()) return actions;

    const query = searchQuery.toLowerCase();
    return actions.filter(
      (action) =>
        action.label.toLowerCase().includes(query) ||
        action.keywords.some((keyword) => keyword.includes(query))
    );
  }, [searchQuery]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      // Escape to close
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleActionClick = (action: QuickAction) => {
    action.action();
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40 hover:scale-110 transition-transform"
        title="Quick Actions (Ctrl+K)"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Quick Actions Dialog */}
      <MultiWindowDialog open={open} onOpenChange={setOpen}>
        <DialogFrame
          title="Schnellaktionen"
          description="Häufig verwendete Aktionen und Navigation"
          width="max-w-2xl"
          modal={false}
          onClose={() => setOpen(false)}
          footer={
            <div className="text-xs text-gray-500 text-center w-full pt-2 border-t">
              Tipp: Drücken Sie{" "}
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                Ctrl+K
              </kbd>{" "}
              um dieses Menü zu öffnen
            </div>
          }
        >
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Suche nach Aktion..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {filteredActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500 transition-all"
                  onClick={() => handleActionClick(action)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md text-blue-600 dark:text-blue-400">
                      {action.icon}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-left">
                    {action.label}
                  </span>
                </Button>
              ))}
            </div>

            {filteredActions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Keine Aktionen gefunden für "{searchQuery}"
              </div>
            )}
          </div>
        </DialogFrame>
      </MultiWindowDialog>
    </>
  );
};

export default QuickActionsMenu;
