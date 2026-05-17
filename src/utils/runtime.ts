export function isDesktopRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.desktop?.isDesktop === true || window.location.protocol === "file:";
}
