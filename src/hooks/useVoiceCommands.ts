import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useThemeContext } from "@/contexts/ThemeContext";

export const useVoiceCommands = () => {
  const navigate = useNavigate();
  const { setTheme } = useThemeContext();

  const processCommand = (text: string) => {
    const cmd = text.toLowerCase();
    console.log("Processing voice command:", cmd);

    // Navigation Commands
    if (cmd.includes("gehe zu") || cmd.includes("öffne") || cmd.includes("zeige")) {
      if (cmd.includes("projekt")) {
        navigate("/projects");
        return "Navigiere zu Projekten";
      }
      if (cmd.includes("rechnung")) {
        navigate("/invoices");
        return "Navigiere zu Rechnungen";
      }
      if (cmd.includes("kalender") || cmd.includes("termine")) {
        navigate("/calendar");
        return "Navigiere zum Kalender";
      }
      if (cmd.includes("kunden")) {
        navigate("/customers");
        return "Navigiere zu Kunden";
      }
      if (cmd.includes("einstellungen")) {
        navigate("/settings");
        return "Öffne Einstellungen";
      }
      if (cmd.includes("dokumente")) {
        navigate("/documents");
        return "Öffne Dokumente";
      }
      if (cmd.includes("dashboard") || cmd.includes("übersicht")) {
        navigate("/dashboard");
        return "Gehe zum Dashboard";
      }
    }

    // Theme Commands
    if (cmd.includes("dunkel") || cmd.includes("dark mode")) {
      setTheme("dark");
      return "Dunkelmodus aktiviert";
    }
    if (cmd.includes("hell") || cmd.includes("light mode")) {
      setTheme("light");
      return "Hellmodus aktiviert";
    }
    if (cmd.includes("sonne") || cmd.includes("sunshine")) {
      setTheme("sunshine" as any);
      return "Sonnenschein-Modus aktiviert";
    }

    // Help
    if (cmd.includes("hilfe")) {
      toast.info("Verfügbare Befehle: 'Gehe zu Projekten', 'Öffne Kalender', 'Dunkelmodus', 'Sonnenschein-Modus'");
      return "Hilfe angezeigt";
    }

    return null;
  };

  return { processCommand };
};
