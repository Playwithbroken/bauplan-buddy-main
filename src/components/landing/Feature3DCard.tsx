import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface Feature3DCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: "blue" | "purple" | "green" | "orange" | "red" | "yellow";
  index: number;
}

export const Feature3DCard: React.FC<Feature3DCardProps> = ({
  icon: Icon,
  title,
  description,
  color,
  index,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse position tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animations
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 300,
    damping: 30,
  });

  // Handle mouse move for 3D tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseXPos = (e.clientX - centerX) / (rect.width / 2);
    const mouseYPos = (e.clientY - centerY) / (rect.height / 2);

    mouseX.set(mouseXPos);
    mouseY.set(mouseYPos);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  // Color configurations
  const colorClasses = {
    blue: {
      bg: "from-blue-500/20 to-blue-600/20",
      border: "border-blue-500/30",
      icon: "text-blue-600 dark:text-blue-400",
      glow: "shadow-blue-500/50",
    },
    purple: {
      bg: "from-purple-500/20 to-purple-600/20",
      border: "border-purple-500/30",
      icon: "text-purple-600 dark:text-purple-400",
      glow: "shadow-purple-500/50",
    },
    green: {
      bg: "from-green-500/20 to-green-600/20",
      border: "border-green-500/30",
      icon: "text-green-600 dark:text-green-400",
      glow: "shadow-green-500/50",
    },
    orange: {
      bg: "from-orange-500/20 to-orange-600/20",
      border: "border-orange-500/30",
      icon: "text-orange-600 dark:text-orange-400",
      glow: "shadow-orange-500/50",
    },
    red: {
      bg: "from-red-500/20 to-red-600/20",
      border: "border-red-500/30",
      icon: "text-red-600 dark:text-red-400",
      glow: "shadow-red-500/50",
    },
    yellow: {
      bg: "from-yellow-500/20 to-yellow-600/20",
      border: "border-yellow-500/30",
      icon: "text-yellow-600 dark:text-yellow-400",
      glow: "shadow-yellow-500/50",
    },
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="perspective-1000"
    >
      <Card
        className={`
          relative overflow-hidden border-2 transition-all duration-300
          bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm
          ${colors.border}
          ${isHovered ? `shadow-2xl ${colors.glow}` : "shadow-lg"}
          hover:scale-105
        `}
      >
        {/* Gradient Overlay */}
        <div
          className={`
            absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 
            transition-opacity duration-300
            ${isHovered ? "opacity-100" : ""}
          `}
        />

        {/* Shine Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: "-100%" }}
          animate={isHovered ? { x: "100%" } : { x: "-100%" }}
          transition={{ duration: 0.6 }}
        />

        <CardHeader className="relative z-10">
          {/* Icon Container */}
          <motion.div
            animate={{
              scale: isHovered ? 1.1 : 1,
              rotateZ: isHovered ? 5 : 0,
            }}
            transition={{ duration: 0.3 }}
            className={`
              w-16 h-16 rounded-2xl flex items-center justify-center mb-4
              bg-gradient-to-br ${colors.bg}
              border-2 ${colors.border}
              shadow-lg
            `}
            style={{ transform: "translateZ(20px)" }}
          >
            <Icon className={`h-8 w-8 ${colors.icon}`} />
          </motion.div>

          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10">
          {/* Decorative Elements */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div
              className={`w-2 h-2 rounded-full ${colors.icon} animate-pulse`}
            />
            <span>Premium Feature</span>
          </div>
        </CardContent>

        {/* Bottom Glow */}
        <div
          className={`
            absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.bg}
            transition-opacity duration-300
            ${isHovered ? "opacity-100" : "opacity-0"}
          `}
        />
      </Card>
    </motion.div>
  );
};

export default Feature3DCard;
