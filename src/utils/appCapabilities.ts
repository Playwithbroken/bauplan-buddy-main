import { isDesktopRuntime } from "@/utils/runtime";

export type AppCapabilityMode = "product" | "desktop-beta" | "recovery";

export type AppCapabilities = {
  mode: AppCapabilityMode;
  isDesktop: boolean;
  isLocalFirst: boolean;
  showBetaNavigation: boolean;
  showGlobalSearch: boolean;
  showNotifications: boolean;
  showPresence: boolean;
  showStorageWarning: boolean;
  showLanguageSelector: boolean;
};

export function getAppCapabilities(
  mode: AppCapabilityMode = "product",
): AppCapabilities {
  const isDesktop = isDesktopRuntime();
  const isBetaSurface = mode === "desktop-beta";

  return {
    mode,
    isDesktop,
    isLocalFirst: isBetaSurface || mode === "recovery" || isDesktop,
    showBetaNavigation: isBetaSurface,
    showGlobalSearch: !isBetaSurface && mode !== "recovery",
    showNotifications: !isBetaSurface && mode !== "recovery",
    showPresence: !isBetaSurface && mode !== "recovery",
    showStorageWarning: !isBetaSurface && mode !== "recovery",
    showLanguageSelector: !isBetaSurface && mode !== "recovery",
  };
}
