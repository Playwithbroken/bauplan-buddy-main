import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppConfigProvider } from "./contexts/AppConfigContext";
import "./index.css";
import "./styles/fonts.css";
import "./styles/micro-interactions.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const hideLoadingScreen = () => {
  document.body.classList.add("app-ready");
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.style.display = "none";
  }
};

window.addEventListener("error", (event) => {
  console.error("Bauplan Buddy runtime error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Bauplan Buddy async error:", event.reason);
});

hideLoadingScreen();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <QueryClientProvider client={queryClient}>
    <AppConfigProvider>
      <App />
    </AppConfigProvider>
  </QueryClientProvider>,
);

setTimeout(hideLoadingScreen, 100);
