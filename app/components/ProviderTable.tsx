"use client";

import { useI18n } from "./I18nProvider";
import { Edit2, Trash2, Mail, Tag, User as UserIcon } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  category: string | null;
  contactName: string | null;
  email: string | null;
  status: string;
}

interface ProviderTableProps {
  providers: Provider[];
  loading: boolean;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
}

export function ProviderTable({ providers, loading, onEdit, onDelete }: ProviderTableProps) {
  const { t, isRTL } = useI18n();

  if (loading) {
    return (
      <div className="empty-state">
        <div className="loading-spinner"></div>
        <p>{t("loading") || "Loading providers..."}</p>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="empty-state">
        <p>{t("noProviders") || "No providers found."}</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>{t("name") || "Name"}</th>
            <th>{t("category") || "Category"}</th>
            <th>{t("contactPerson") || "Contact"}</th>
            <th>{t("status") || "Status"}</th>
            <th>{t("actions") || "Actions"}</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((p, index) => (
            <tr key={p.id} style={{ animationDelay: `${index * 0.05}s` }} className="staggered-row">
              <td className="product-name">{p.name}</td>
              <td>
                <span className="flex-center-gap">
                  <Tag size={14} className="text-muted" />
                  {p.category || "-"}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                   <span className="flex-center-gap" style={{ fontSize: '0.9rem' }}>
                    <UserIcon size={14} className="text-muted" />
                    {p.contactName || "-"}
                  </span>
                  {p.email && (
                    <span className="flex-center-gap text-muted" style={{ fontSize: '0.75rem' }}>
                      <Mail size={12} />
                      {p.email}
                    </span>
                  )}
                </div>
              </td>
              <td>
                <span className={`status-badge ${p.status.toLowerCase()}`}>
                  {p.status === "ACTIVE" ? (t("active") || "Active") : (t("inactive") || "Inactive")}
                </span>
              </td>
              <td className="actions">
                <button className="btn-icon" onClick={() => onEdit(p)} title={t("edit")}>
                  <Edit2 size={16} />
                </button>
                <button className="btn-icon btn-danger" onClick={() => onDelete(p)} title={t("delete")}>
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .staggered-row {
          animation: slideInLeft 0.4s ease-out forwards;
          opacity: 0;
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .flex-center-gap {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .status-badge.active {
          background: var(--success-bg);
          color: var(--success);
          box-shadow: 0 0 10px var(--success-bg);
        }
        .status-badge.inactive {
          background: rgba(148, 163, 184, 0.1);
          color: var(--text-muted);
        }
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border-color);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
