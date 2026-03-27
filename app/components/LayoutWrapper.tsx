import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { usePathname } from "next/navigation";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobileRoute = pathname?.startsWith("/mobile");

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  // Skip sidebar for mobile routes to provide a clean app-like experience
  if (isMobileRoute) {
    return <>{children}</>;
  }

  return (
    <div className={`app-wrapper ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      <main className="main-content">
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
}
