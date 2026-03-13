type DesktopApi = {
  isDesktop?: boolean;
};

declare global {
  interface Window {
    desktop?: DesktopApi;
  }
}

export function isDesktopRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.desktop?.isDesktop === true || window.location.protocol === "file:";
}
