import DesktopBootstrapApp from "@/desktop/DesktopBootstrapApp";
import { Suspense, lazy } from "react";

const WebApp = lazy(() => import("@/WebApp"));

const isDesktopFileRuntime =
  typeof window !== "undefined" && window.location.protocol === "file:";

export default function App() {
  if (isDesktopFileRuntime) {
    return <DesktopBootstrapApp />;
  }

  return (
    <Suspense fallback={null}>
      <WebApp />
    </Suspense>
  );
}
