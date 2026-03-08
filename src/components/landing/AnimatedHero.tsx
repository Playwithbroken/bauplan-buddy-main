import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";

interface AnimatedHeroProps {
  onGetStarted: (email: string) => void;
}

export const AnimatedHero: React.FC<AnimatedHeroProps> = ({ onGetStarted }) => {
  const [email, setEmail] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Smooth parallax effects
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  // Smooth spring physics
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });
  const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onGetStarted(email);
    }
  };

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-blue-950">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 dark:bg-yellow-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>

      {/* Floating 3D Elements */}
      <FloatingElements />

      {/* Hero Content */}
      <motion.div
        style={{ y: smoothY, opacity: smoothOpacity, scale: smoothScale }}
        className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Premium Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-purple-200 dark:border-purple-800 shadow-lg">
              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Trusted by 1000+ Construction Companies
              </span>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight"
          >
            <span className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent">
              Die moderne
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
              Bau-Software
            </span>
            <br />
            <span className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent">
              für Ihr Business
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
          >
            Angebote, Projekte, Rechnungen – alles an einem Ort.
            <br />
            <span className="inline-flex items-center gap-4 mt-2 flex-wrap justify-center">
              <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                <Shield className="h-5 w-5" />
                DSGVO-konform
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400">
                <Zap className="h-5 w-5" />
                Offline-fähig
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-pink-600 dark:text-pink-400">
                <Sparkles className="h-5 w-5" />
                Made in Germany
              </span>
            </span>
          </motion.p>

          {/* CTA Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto"
          >
            <Input
              type="email"
              placeholder="ihre@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-14 px-6 text-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-400 shadow-lg"
              required
            />
            <Button
              type="submit"
              size="lg"
              className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              Kostenlos starten
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.form>

          {/* Trust Indicators */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            ✓ Keine Kreditkarte erforderlich • ✓ 14 Tage kostenlos testen • ✓
            Jederzeit kündbar
          </motion.p>

          {/* Animated Stats */}
          <AnimatedStats />
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Scroll to explore
          </span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-gray-400 dark:border-gray-600 flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-gray-600 dark:bg-gray-400"
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

// Floating 3D Elements Component
const FloatingElements: React.FC = () => {
  const elements = [
    { icon: "🏗️", delay: 0, duration: 20, x: "10%", y: "20%" },
    { icon: "📊", delay: 2, duration: 25, x: "80%", y: "30%" },
    { icon: "📝", delay: 4, duration: 22, x: "15%", y: "70%" },
    { icon: "💰", delay: 6, duration: 24, x: "85%", y: "60%" },
    { icon: "👥", delay: 8, duration: 23, x: "50%", y: "15%" },
    { icon: "📅", delay: 10, duration: 21, x: "40%", y: "80%" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map((element, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
            y: [0, -30, 0],
          }}
          transition={{
            duration: element.duration,
            repeat: Infinity,
            delay: element.delay,
          }}
          className="absolute text-6xl filter drop-shadow-lg"
          style={{ left: element.x, top: element.y }}
        >
          {element.icon}
        </motion.div>
      ))}
    </div>
  );
};

// Animated Stats Component
const AnimatedStats: React.FC = () => {
  const [stats, setStats] = useState({
    projects: 0,
    companies: 0,
    timeSaved: 0,
  });

  useEffect(() => {
    const targets = { projects: 2500, companies: 1000, timeSaved: 10 };
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setStats({
        projects: Math.floor(targets.projects * progress),
        companies: Math.floor(targets.companies * progress),
        timeSaved: Math.floor(targets.timeSaved * progress),
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setStats(targets);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
      className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-12"
    >
      <div className="text-center">
        <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {stats.projects.toLocaleString()}+
        </div>
        <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
          Aktive Projekte
        </div>
      </div>
      <div className="text-center">
        <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {stats.companies.toLocaleString()}+
        </div>
        <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
          Zufriedene Firmen
        </div>
      </div>
      <div className="text-center">
        <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
          {stats.timeSaved}h+
        </div>
        <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
          Zeitersparnis/Woche
        </div>
      </div>
    </motion.div>
  );
};

export default AnimatedHero;
