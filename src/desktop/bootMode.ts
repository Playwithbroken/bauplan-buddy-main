export type DesktopBootMode = "normal" | "safe";

export const DESKTOP_BOOT_MODE_KEY = "bauplan_desktop_boot_mode";
export const DESKTOP_BOOT_FAILURE_COUNT_KEY = "bauplan_desktop_boot_failures";
export const DESKTOP_BOOT_LAST_FAILURE_KEY = "bauplan_desktop_boot_last_failure";
export const DESKTOP_BOOT_LAST_FAILURE_AT_KEY = "bauplan_desktop_boot_last_failure_at";
export const DESKTOP_BOOT_LAST_SUCCESS_AT_KEY = "bauplan_desktop_boot_last_success_at";
export const DESKTOP_BOOT_LAST_ATTEMPT_AT_KEY = "bauplan_desktop_boot_last_attempt_at";
export const DESKTOP_BOOT_TIMEOUT_MS = 12000;

export interface DesktopBootDiagnostics {
  mode: DesktopBootMode;
  failureCount: number;
  lastFailure: string | null;
  lastFailureAt: string | null;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore localStorage failures in desktop boot helpers
  }
}

export function readDesktopBootMode(): DesktopBootMode {
  const stored = readStorage(DESKTOP_BOOT_MODE_KEY);
  return stored === "safe" ? "safe" : "normal";
}

export function writeDesktopBootMode(mode: DesktopBootMode): void {
  writeStorage(DESKTOP_BOOT_MODE_KEY, mode);
}

export function recordDesktopBootAttempt(): void {
  writeStorage(DESKTOP_BOOT_LAST_ATTEMPT_AT_KEY, new Date().toISOString());
}

export function recordDesktopBootSuccess(): void {
  writeDesktopBootMode("normal");
  writeStorage(DESKTOP_BOOT_FAILURE_COUNT_KEY, "0");
  writeStorage(DESKTOP_BOOT_LAST_SUCCESS_AT_KEY, new Date().toISOString());
}

export function recordDesktopBootFailure(reason: string): void {
  const currentFailureCount = Number.parseInt(
    readStorage(DESKTOP_BOOT_FAILURE_COUNT_KEY) ?? "0",
    10
  );
  writeDesktopBootMode("safe");
  writeStorage(DESKTOP_BOOT_FAILURE_COUNT_KEY, String(currentFailureCount + 1));
  writeStorage(DESKTOP_BOOT_LAST_FAILURE_KEY, reason);
  writeStorage(DESKTOP_BOOT_LAST_FAILURE_AT_KEY, new Date().toISOString());
}

export function getDesktopBootDiagnostics(): DesktopBootDiagnostics {
  return {
    mode: readDesktopBootMode(),
    failureCount: Number.parseInt(
      readStorage(DESKTOP_BOOT_FAILURE_COUNT_KEY) ?? "0",
      10
    ),
    lastFailure: readStorage(DESKTOP_BOOT_LAST_FAILURE_KEY),
    lastFailureAt: readStorage(DESKTOP_BOOT_LAST_FAILURE_AT_KEY),
    lastSuccessAt: readStorage(DESKTOP_BOOT_LAST_SUCCESS_AT_KEY),
    lastAttemptAt: readStorage(DESKTOP_BOOT_LAST_ATTEMPT_AT_KEY),
  };
}
