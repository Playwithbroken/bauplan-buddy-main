import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import ThemeService, { Theme, ThemeConfig } from "@/services/themeService";
import AccessibilityService from "@/services/accessibilityService";

export type ThemeMode =
  | Theme
  | "high-contrast"
  | "high-contrast-dark"
  | "sunshine";

const deriveThemeMode = (
  baseTheme: ThemeMode,
  highContrast: boolean,
  effectiveTheme: "light" | "dark"
): ThemeMode => {
  if (baseTheme === "sunshine") {
    return "sunshine";
  }

  if (!highContrast) {
    return baseTheme as Theme;
  }

  return effectiveTheme === "dark" ? "high-contrast-dark" : "high-contrast";
};

interface ThemeContextType {
  theme: ThemeMode;
  baseTheme: Theme;
  effectiveTheme: "light" | "dark";
  isDarkMode: boolean;
  isHighContrast: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setHighContrast: (enabled: boolean) => void;
  toggleHighContrast: () => void;
  config: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [baseTheme, setBaseTheme] = useState<Theme>(
    ThemeService.getCurrentTheme()
  );
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(
    ThemeService.getEffectiveCurrentTheme()
  );
  const [config, setConfig] = useState<ThemeConfig>(ThemeService.getConfig());
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return (
        localStorage.getItem("highContrast") === "true" ||
        document.documentElement.classList.contains("hc")
      );
    } catch {
      return document.documentElement.classList.contains("hc");
    }
  });

  useEffect(() => {
    // Use the singleton instance directly

    // Set up listener for theme changes
    const unsubscribe = ThemeService.onThemeChange((newEffectiveTheme) => {
      setBaseTheme(ThemeService.getCurrentTheme());
      setEffectiveTheme(newEffectiveTheme);
      setConfig(ThemeService.getConfig());
    });

    // Apply initial theme
    const initialEffectiveTheme = ThemeService.getEffectiveCurrentTheme();
    setEffectiveTheme(initialEffectiveTheme);

    return unsubscribe;
  }, []);

  const handleSetTheme = (newTheme: ThemeMode) => {
    if (newTheme === "high-contrast" || newTheme === "high-contrast-dark") {
      const targetBase = newTheme === "high-contrast-dark" ? "dark" : "light";
      ThemeService.setTheme(targetBase);
      setBaseTheme(targetBase);
      setIsHighContrast(true);
      return;
    }

    if (newTheme === "sunshine") {
      ThemeService.setTheme("light"); // Base it on light
      setBaseTheme("sunshine" as any);
      setIsHighContrast(false);
      return;
    }

    ThemeService.setTheme(newTheme as Theme);
    setBaseTheme(newTheme as Theme);
    setIsHighContrast(false);
  };

  const handleToggleTheme = () => {
    if (isHighContrast) {
      const nextBase = effectiveTheme === "dark" ? "light" : "dark";
      ThemeService.setTheme(nextBase);
      setBaseTheme(nextBase);
      return;
    }

    ThemeService.toggleTheme();
  };

  const handleSetHighContrast = (enabled: boolean) => {
    setIsHighContrast(enabled);
  };

  const handleToggleHighContrast = () => {
    setIsHighContrast((prev) => !prev);
  };

  const themeMode = useMemo(
    () => deriveThemeMode(baseTheme, isHighContrast, effectiveTheme),
    [baseTheme, isHighContrast, effectiveTheme]
  );

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const nextThemeAttribute = isHighContrast
      ? effectiveTheme === "dark"
        ? "high-contrast-dark"
        : "high-contrast"
      : themeMode === "sunshine"
      ? "sunshine"
      : null;

    root.classList.toggle("hc", isHighContrast);
    root.classList.toggle("sunshine", themeMode === "sunshine");

    if (nextThemeAttribute) {
      root.setAttribute("data-theme", nextThemeAttribute);
    } else {
      root.removeAttribute("data-theme");
    }

    try {
      localStorage.setItem("highContrast", isHighContrast ? "true" : "false");
    } catch (error) {
      console.warn(
        "ThemeContext: Failed to persist high contrast preference",
        error
      );
    }

    try {
      AccessibilityService.updateSettings({ highContrast: isHighContrast });
    } catch (error) {
      console.warn("ThemeContext: AccessibilityService unavailable", error);
    }
  }, [isHighContrast, effectiveTheme]);

  const contextValue: ThemeContextType = {
    theme: themeMode,
    baseTheme,
    effectiveTheme,
    isDarkMode: effectiveTheme === "dark",
    isHighContrast,
    setTheme: handleSetTheme,
    toggleTheme: handleToggleTheme,
    setHighContrast: handleSetHighContrast,
    toggleHighContrast: handleToggleHighContrast,
    config,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
