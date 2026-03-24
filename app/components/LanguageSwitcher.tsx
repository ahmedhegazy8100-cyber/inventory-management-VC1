"use client";

import { useI18n } from "./I18nProvider";

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="language-switcher">
      <button
        onClick={() => setLanguage("en")}
        className={language === "en" ? "active" : ""}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("ar")}
        className={language === "ar" ? "active" : ""}
      >
        AR
      </button>

      <style jsx>{`
        .language-switcher {
          display: flex;
          gap: 4px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
        }
        button {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 4px 8px;
          border-radius: calc(var(--radius-sm) - 4px);
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        button:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }
        button.active {
          background: var(--accent);
          color: white;
          box-shadow: 0 2px 8px var(--accent-glow);
        }
      `}</style>
    </div>
  );
}
