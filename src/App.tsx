import DesktopBootstrapApp from "@/desktop/DesktopBootstrapApp";
import {
  DESKTOP_BOOT_TIMEOUT_MS,
  readDesktopBootMode,
  writeDesktopBootMode,
} from "@/desktop/bootMode";
import WebApp from "@/WebApp";
import { isDesktopRuntime } from "@/utils/runtime";
import { useCallback, useEffect, useRef, useState } from "react";

const isDesktopFileRuntime = isDesktopRuntime();

export default function App() {
  const [desktopBootMode, setDesktopBootMode] = useState<"normal" | "safe">(
    () => (isDesktopFileRuntime ? readDesktopBootMode() : "normal")
  );
  const desktopReadyRef = useRef(false);

  const handleDesktopReady = useCallback(() => {
    desktopReadyRef.current = true;
  }, []);

  useEffect(() => {
    if (!isDesktopFileRuntime || desktopBootMode === "safe") {
      return;
    }
    desktopReadyRef.current = false;

    const timeoutId = window.setTimeout(() => {
      if (desktopReadyRef.current) {
        return;
      }

      // Persist safe mode after a startup timeout so the next launch is stable.
      writeDesktopBootMode("safe");
      setDesktopBootMode("safe");
    }, DESKTOP_BOOT_TIMEOUT_MS);

    return () => {
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

  return <WebApp onDesktopReady={isDesktopFileRuntime ? handleDesktopReady : undefined} />;
}
