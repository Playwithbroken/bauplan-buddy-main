export type DesktopBootMode = "normal" | "safe";

export const DESKTOP_BOOT_MODE_KEY = "bauplan_desktop_boot_mode";
export const WEB_APP_READY_EVENT = "bauplan:web-app-mounted";
export const DESKTOP_BOOT_TIMEOUT_MS = 8000;

export function readDesktopBootMode(): DesktopBootMode {
  try {
    const stored = localStorage.getItem(DESKTOP_BOOT_MODE_KEY);
    return stored === "safe" ? "safe" : "normal";
  } catch {
    return "normal";
  }
}

export function writeDesktopBootMode(mode: DesktopBootMode): void {
  try {
    if (mode === "normal") {
      localStorage.removeItem(DESKTOP_BOOT_MODE_KEY);
      return;
    }

    localStorage.setItem(DESKTOP_BOOT_MODE_KEY, mode);
  } catch {
    // ignore localStorage failures in boot-mode helper
  }
}

