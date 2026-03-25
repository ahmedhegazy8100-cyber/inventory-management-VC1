"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./I18nProvider";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Package, Truck, ClipboardList } from "lucide-react";

export function Sidebar() {
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
          <span className="logo-text">Inventra</span>
        </Link>
      </div>

      <nav className="side-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`side-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-controls">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <div className="sidebar-version">v2.0.26</div>
      </div>

      <style jsx>{`
        .logo-link {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          padding: 8px;
        }
        .logo-icon {
          font-size: 1.8rem;
          filter: drop-shadow(0 0 10px var(--accent-glow));
        }
        .logo-text {
          font-size: 1.4rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--text-primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.03em;
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
        }
      `}</style>
    </aside>
  );
}
