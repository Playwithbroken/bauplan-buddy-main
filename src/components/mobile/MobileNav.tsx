import React, { useState } from "react";
import { Home, Menu, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MobileNavProps {
  children?: React.ReactNode;
}

export function MobileNav({ children }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around p-2">
        <Button variant="ghost" size="icon" className="flex-col h-auto py-2">
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="flex-col h-auto py-2"
            >
              <Menu className="h-5 w-5" />
              <span className="text-xs mt-1">Menü</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <div className="py-4">{children}</div>
          </SheetContent>
        </Sheet>

        <Button
          variant="default"
          size="icon"
          className="rounded-full h-14 w-14 -mt-8 shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
