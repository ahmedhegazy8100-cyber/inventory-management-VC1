"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

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
          mutations: {},
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
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
