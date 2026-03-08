import React, { useState, useEffect } from "react";
// CommandBar component for global search and navigation
import { Command } from "cmdk";
import {
  Search,
  Calendar,
  FileText,
  Plus,
  User,
  Settings,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DraggableDialogContent as DialogContent,
} from "@/components/ui/DraggableDialog";

export const CommandBar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="p-0 overflow-hidden bg-transparent border-none shadow-2xl max-w-2xl"
        noPadding
      >
        <div className="glass-card rounded-xl overflow-hidden border border-white/10">
          <Command className="bg-transparent">
            <div
              className="flex items-center border-b border-white/10 px-4"
              cmdk-input-wrapper=""
            >
              <Search className="mr-2 h-5 w-5 shrink-0 opacity-50 text-white" />
              <Command.Input
                placeholder="Type a command or search..."
                className="flex h-14 w-full rounded-md bg-transparent py-3 text-lg outline-none placeholder:text-white/40 text-white disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden py-2 px-2">
              <Command.Empty className="py-6 text-center text-sm text-white/50">
                No results found.
              </Command.Empty>

              <Command.Group
                heading="Suggestions"
                className="px-2 py-1.5 text-xs font-medium text-white/70"
              >
                <Command.Item
                  onSelect={() => runCommand(() => navigate("/quotes"))}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-white/10 aria-selected:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Create new Quote</span>
                  <span className="ml-auto text-xs tracking-widest text-white/40">
                    ⌘N
                  </span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => navigate("/projects"))}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-white/10 aria-selected:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>New Project</span>
                </Command.Item>
              </Command.Group>

              <Command.Group
                heading="Navigation"
                className="px-2 py-1.5 text-xs font-medium text-white/70 mt-2"
              >
                <Command.Item
                  onSelect={() => runCommand(() => navigate("/dashboard"))}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-white/10 aria-selected:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  <span>Go to Dashboard</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => navigate("/calendar"))}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-white/10 aria-selected:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Calendar</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => navigate("/settings"))}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-white/10 aria-selected:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Command.Item>
              </Command.Group>
            </Command.List>

            <div className="border-t border-white/10 px-4 py-2 flex justify-between items-center text-xs text-white/40">
              <div className="flex gap-2">
                <span>Select</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium opacity-100">
                  ↵
                </kbd>
              </div>
              <div className="flex gap-2">
                <span>Navigate</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium opacity-100">
                  ↑↓
                </kbd>
              </div>
            </div>
          </Command>
        </div>
      </DialogContent>
    </Dialog>
  );
};
