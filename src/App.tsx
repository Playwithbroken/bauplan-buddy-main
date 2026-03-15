import DesktopBootstrapApp from "@/desktop/DesktopBootstrapApp";
import {
  DESKTOP_BOOT_TIMEOUT_MS,
  recordDesktopBootAttempt,
  recordDesktopBootFailure,
  recordDesktopBootSuccess,
  readDesktopBootMode,
  writeDesktopBootMode,
} from "@/desktop/bootMode";
import WebApp from "@/WebApp";
import { isDesktopRuntime } from "@/utils/runtime";
import { ErrorInfo, useCallback, useEffect, useRef, useState } from "react";

const isDesktopFileRuntime = isDesktopRuntime();

export default function App() {
  const [desktopBootMode, setDesktopBootMode] = useState<"normal" | "safe">(
    () => (isDesktopFileRuntime ? readDesktopBootMode() : "normal")
  );
  const desktopReadyRef = useRef(false);

  const handleDesktopReady = useCallback(() => {
    desktopReadyRef.current = true;
    recordDesktopBootSuccess();
  }, []);

  const activateDesktopRecovery = useCallback((reason: string) => {
    desktopReadyRef.current = false;
    recordDesktopBootFailure(reason);
    setDesktopBootMode("safe");
  }, []);

  useEffect(() => {
    if (!isDesktopFileRuntime || desktopBootMode === "safe") {
      return;
    }

    recordDesktopBootAttempt();
    desktopReadyRef.current = false;

    const timeoutId = window.setTimeout(() => {
      if (desktopReadyRef.current) {
        return;
      }

      activateDesktopRecovery("startup_timeout");
    }, DESKTOP_BOOT_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activateDesktopRecovery, desktopBootMode]);

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

  return (
    <WebApp
      onDesktopReady={isDesktopFileRuntime ? handleDesktopReady : undefined}
      onDesktopError={
        isDesktopFileRuntime
          ? (error: Error, errorInfo: ErrorInfo) => {
              activateDesktopRecovery(
                `react_error:${error.name}:${error.message}:${errorInfo.componentStack?.split("\n")[1]?.trim() ?? "unknown"}`
              );
            }
          : undefined
      }
    />
  );
}
