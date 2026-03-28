"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

interface Option {
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  error,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.sublabel?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="searchable-select-container" ref={containerRef}>
      {label && <label className="select-label">{label}</label>}
      
      <div 
        className={`select-trigger ${isOpen ? 'active' : ''} ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`selected-text ${!selectedOption ? 'placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className={`chevron ${isOpen ? 'rotate' : ''}`} />
      </div>

      {isOpen && (
        <div className="select-dropdown">
          <div className="search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={`option-item ${opt.id === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt.id)}
                >
                  <div className="option-content">
                    <span className="option-label">{opt.label}</span>
                    {opt.sublabel && <span className="option-sublabel">{opt.sublabel}</span>}
                  </div>
                  {opt.id === value && <Check size={14} className="check-icon" />}
                </div>
              ))
            ) : (
              <div className="no-options">No results found</div>
            )}
          </div>
        </div>
      )}

      {error && <span className="error-text">{error}</span>}

      <style jsx>{`
        .searchable-select-container {
          position: relative;
          width: 100%;
        }
        .select-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 8px;
          color: var(--text-secondary);
        }
        .select-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-base);
          min-height: 48px;
        }
        .select-trigger:hover:not(.disabled) {
          border-color: var(--accent);
          background: var(--bg-card);
        }
        .select-trigger.active {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
        .select-trigger.error {
          border-color: var(--error);
        }
        .select-trigger.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .selected-text {
          font-size: 0.95rem;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .selected-text.placeholder {
          color: var(--text-muted);
        }
        .chevron {
          color: var(--text-muted);
          transition: transform 0.2s;
        }
        .chevron.rotate {
          transform: rotate(180deg);
        }
        .select-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 100;
          overflow: hidden;
          backdrop-filter: blur(20px);
          animation: slideUp 0.2s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-bottom: 1px solid var(--border-color);
          background: rgba(255,255,255,0.02);
        }
        .search-icon {
          color: var(--text-muted);
        }
        .search-box input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.9rem;
          outline: none;
        }
        .options-list {
          max-height: 240px;
          overflow-y: auto;
        }
        .option-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .option-item:hover {
          background: var(--accent-glow);
        }
        .option-item.selected {
          background: rgba(99, 91, 255, 0.15);
        }
        .option-content {
          display: flex;
          flex-direction: column;
        }
        .option-label {
          font-size: 0.95rem;
          color: var(--text-primary);
        }
        .option-sublabel {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .check-icon {
          color: var(--accent);
        }
        .no-options {
          padding: 20px;
          text-align: center;
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        .error-text {
          display: block;
          font-size: 0.75rem;
          color: var(--error);
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
