"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 1000 * 30 },
        },
      })
  );

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[Inventra PWA] Service worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[Inventra PWA] SW registration failed:", err);
        });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* PWA meta tags injected via dangerouslySetInnerHTML in head — handled by root layout */}
      <div
        dir="auto"
        style={{
          minHeight: "100dvh",
          fontFamily: "'Inter', 'IBM Plex Sans Arabic', sans-serif",
        }}
      >
        {children}
      </div>
    </QueryClientProvider>
  );
}
