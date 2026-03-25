"use client";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      <span className="icon">
        {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
      </span>

      <style jsx>{`
        .theme-toggle {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: 1.1rem;
          padding: 0;
        }
        .theme-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--accent);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px var(--accent-glow);
        }
        .theme-toggle:active {
          transform: translateY(0);
        }
      `}</style>
    </button>
  );
}
