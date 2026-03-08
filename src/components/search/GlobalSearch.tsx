import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Command,
  FileText,
  User,
  Briefcase,
  Zap,
  ArrowRight,
  X,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchService, SearchResultItem } from "@/services/searchService";
import { useTheme } from "@/hooks/useTheme";

export const GlobalSearch: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDarkMode } = useTheme();

  // Toggle with Cmd+K
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

  // Search execution
  useEffect(() => {
    if (query.trim()) {
      const hits = searchService.search(query);
      setResults(hits);
      setSelectedIndex(0);
    } else {
      setResults([]);
    }
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, results, selectedIndex]);

  const handleSelect = (item: SearchResultItem) => {
    setOpen(false);
    setQuery("");
    if (item.url) {
      navigate(item.url);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "project":
        return Briefcase;
      case "invoice":
        return FileText;
      case "contact":
        return User;
      case "action":
        return Zap;
      default:
        return Search;
    }
  };

  return (
    <>
      <div
        className="relative hidden md:flex items-center w-64 cursor-pointer group"
        onClick={() => setOpen(true)}
      >
        <Search className="absolute left-3 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <div className="h-10 w-full rounded-full border border-input bg-background px-10 py-2 text-sm text-muted-foreground shadow-sm group-hover:border-primary/50 transition-all flex items-center justify-between">
          <span>Search...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 max-w-2xl overflow-hidden bg-card/95 backdrop-blur-xl border-none shadow-2xl">
          <div
            className="flex items-center border-b px-4 py-3 cursor-move"
            data-dialog-drag-handle
          >
            <Search className="w-5 h-5 text-muted-foreground mr-3" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, invoices, contacts..."
              className="border-none shadow-none focus-visible:ring-0 text-lg bg-transparent h-auto p-0 placeholder:text-muted-foreground/50"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="ml-2">
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {results.length === 0 && query && (
              <div className="py-12 text-center text-muted-foreground">
                <p>No results found for "{query}"</p>
              </div>
            )}

            {results.length === 0 && !query && (
              <div className="py-8 px-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  Suggested
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left border border-transparent hover:border-border/50">
                    <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Create Invoice</p>
                      <p className="text-xs text-muted-foreground">
                        Quick action
                      </p>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left border border-transparent hover:border-border/50">
                    <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">New Project</p>
                      <p className="text-xs text-muted-foreground">
                        Quick action
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-1">
                {results.map((item, index) => {
                  const Icon = getIcon(item.type);
                  const isSelected = index === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200
                        ${
                          isSelected
                            ? "bg-primary/10 scale-[1.01]"
                            : "hover:bg-accent/50"
                        }
                      `}
                    >
                      <div
                        className={`
                        p-2 rounded-md flex-shrink-0
                        ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }
                      `}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p
                            className={`font-medium text-sm ${
                              isSelected ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {item.title}
                          </p>
                          {item.type === "action" && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-5"
                            >
                              Action
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.subtitle}
                        </p>
                      </div>

                      {isSelected && (
                        <ArrowRight className="w-4 h-4 text-primary animate-in fade-in slide-in-from-left-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t px-4 py-2 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <kbd className="bg-background border rounded px-1">↓</kbd>{" "}
                <kbd className="bg-background border rounded px-1">↑</kbd> to
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-background border rounded px-1">↵</kbd> to
                select
              </span>
            </div>
            <span>Intelligent Search</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
