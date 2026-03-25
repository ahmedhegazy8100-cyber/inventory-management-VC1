"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
