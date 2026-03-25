"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./I18nProvider";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Package, Truck, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { t, isRTL } = useI18n();

  const navItems = [
    { name: t("inventory") || "Inventory", href: "/", icon: <Package size={18} /> },
    { name: t("orders") || "Orders", href: "/orders", icon: <Truck size={18} /> },
    { name: t("auditLogs") || "Audit Logs", href: "/audit-logs", icon: <ClipboardList size={18} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/" className="logo-link">
          <span className="logo-icon"><Package size={28} color="var(--accent)" /></span>
          {!isCollapsed && <span className="logo-text">Inventra</span>}
        </Link>
        <button onClick={onToggle} className="toggle-btn" title={isCollapsed ? "Expand" : "Collapse"}>
          {isCollapsed ? (isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />) : (isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)}
        </button>
      </div>

      <nav className="side-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`side-nav-item ${isActive ? "active" : ""}`}
              title={isCollapsed ? item.name : ""}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-text">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-controls">
          <ThemeToggle />
          {!isCollapsed && <LanguageSwitcher />}
        </div>
        {!isCollapsed && <div className="sidebar-version">v2.0.26</div>}
      </div>

      <style jsx>{`
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: ${isCollapsed ? 'center' : 'space-between'};
          margin-bottom: 32px;
          padding: 0 8px;
          position: relative;
        }
        .toggle-btn {
          position: absolute;
          right: ${isCollapsed ? '-12px' : '-4px'};
          top: 50%;
          transform: translateY(-50%);
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-base);
          z-index: 10;
          box-shadow: var(--shadow-sm);
        }
        .toggle-btn:hover {
          color: var(--accent);
          border-color: var(--accent);
          transform: translateY(-50%) scale(1.1);
        }
        .logo-link {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          padding: 8px;
          overflow: hidden;
        }
        .logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
        }
        .logo-text {
          font-size: 1.4rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--text-primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.03em;
          white-space: nowrap;
        }
        .sidebar-footer {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px 8px;
          border-top: 1px solid var(--border-color);
        }
        .sidebar-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: center;
          flex-direction: ${isCollapsed ? 'column' : 'row'};
        }
        .sidebar-version {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-align: center;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: inherit;
          min-width: 24px;
        }
        .nav-text {
          white-space: nowrap;
          opacity: 1;
        }
      `}</style>
    </aside>
  );
}
