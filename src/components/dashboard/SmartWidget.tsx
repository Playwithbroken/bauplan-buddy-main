import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartWidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const SmartWidget = ({
  title,
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
  icon,
  action,
}: SmartWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Placeholder to hold space when expanded */}
      {isExpanded && (
        <div
          className={cn(
            "rounded-xl bg-transparent opacity-0",
            `col-span-${colSpan} row-span-${rowSpan}`
          )}
          style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }}
        />
      )}

      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          zIndex: isExpanded ? 50 : 1,
          position: isExpanded ? "fixed" : "relative",
          top: isExpanded ? "10%" : "auto",
          left: isExpanded ? "10%" : "auto",
          width: isExpanded ? "80vw" : "100%",
          height: isExpanded ? "80vh" : "100%",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "glass-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl transition-colors hover:bg-slate-900/60",
          // Mobile: always span 1. Desktop (md): use props.
          !isExpanded &&
            "col-span-1 md:col-span-" +
              colSpan +
              " row-span-1 md:row-span-" +
              rowSpan,
          className
        )}
        // Removed inline styles to allow CSS grid to handle responsiveness via media queries
        style={
          isExpanded
            ? {
                zIndex: 50,
                position: "fixed",
                top: "10%",
                left: "10%",
                width: "80vw",
                height: "80vh",
              }
            : undefined
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            {icon && <div className="text-indigo-400">{icon}</div>}
            <h3 className="font-medium text-slate-200">{title}</h3>
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {action}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">{children}</div>

        {/* Background Gradient Effect */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </motion.div>

      {/* Backdrop for expanded state */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
    </>
  );
};
