import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppToaster } from "@/components/ui/toaster";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes data freshness: instant page transitions without loading spinners
      gcTime: 1000 * 60 * 10,   // 10 minutes memory retention
      refetchOnWindowFocus: false, // Prevent laggy background refetches on tab switch
      refetchOnReconnect: true,
      retry: 1, // Fast failover with 1 quick retry
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <AppToaster position="bottom-right" />
  </QueryClientProvider>
);
