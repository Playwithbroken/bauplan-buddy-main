import DesktopBootstrapApp from "@/desktop/DesktopBootstrapApp";
import {
  DESKTOP_BOOT_TIMEOUT_MS,
  WEB_APP_READY_EVENT,
  readDesktopBootMode,
  writeDesktopBootMode,
} from "@/desktop/bootMode";
import WebApp from "@/WebApp";
import { isDesktopRuntime } from "@/utils/runtime";
import { useEffect, useState } from "react";

const isDesktopFileRuntime = isDesktopRuntime();

export default function App() {
  const [desktopBootMode, setDesktopBootMode] = useState<"normal" | "safe">(
    () => (isDesktopFileRuntime ? readDesktopBootMode() : "normal")
  );

  useEffect(() => {
    if (!isDesktopFileRuntime || desktopBootMode === "safe") {
      return;
    }

    let isReady = false;

    const handleReady = () => {
      isReady = true;
    };

    window.addEventListener(WEB_APP_READY_EVENT, handleReady);

    const timeoutId = window.setTimeout(() => {
      if (isReady) {
        return;
      }

      // Persist safe mode after a startup timeout so the next launch is stable.
      writeDesktopBootMode("safe");
      setDesktopBootMode("safe");
    }, DESKTOP_BOOT_TIMEOUT_MS);

    return () => {
      window.removeEventListener(WEB_APP_READY_EVENT, handleReady);
      window.clearTimeout(timeoutId);
    };
  }, [desktopBootMode]);

  if (isDesktopFileRuntime && desktopBootMode === "safe") {
    return (
      <DesktopBootstrapApp
        onSwitchToNormalMode={() => {
          writeDesktopBootMode("normal");
          setDesktopBootMode("normal");
          window.location.reload();
        }}
      />
    );
  }

  return <WebApp />;
}
