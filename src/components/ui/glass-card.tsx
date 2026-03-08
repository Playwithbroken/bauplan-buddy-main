import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "subtle" | "medium" | "strong";
  hover?: boolean;
  onClick?: () => void;
}

const variantStyles = {
  subtle: "bg-white/5 dark:bg-white/5 backdrop-blur-sm border-white/10",
  medium: "bg-white/10 dark:bg-white/10 backdrop-blur-md border-white/20",
  strong: "bg-white/20 dark:bg-white/20 backdrop-blur-lg border-white/30",
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = "medium",
  hover = true,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={cn(
        "rounded-2xl border shadow-lg transition-all duration-300",
        variantStyles[variant],
        hover && "hover:shadow-2xl hover:border-white/40",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Glow effect on hover */}
      {hover && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 opacity-0 hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
      )}

      {children}
    </motion.div>
  );
};
