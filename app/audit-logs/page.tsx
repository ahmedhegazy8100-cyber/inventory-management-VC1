"use client";

import { useQuery } from "@tanstack/react-query";
import { useI18n } from "./../components/I18nProvider";
import { History, ClipboardList, Database, FileText } from "lucide-react";
import "./../globals.css";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const { t, isRTL } = useI18n();
  const { data: auditLogs = [], isLoading: loading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const res = await fetch("/api/audit-logs");
      if (!res.ok) throw new Error("Failed to load audit logs");
      return res.json();
    },
  });

  return (
    <div className="page-fade-in">
      <header className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <History size={28} color="var(--accent)" />
            {t("auditLogs") || "Audit Logs"}
          </h1>
          <p className="text-secondary">{t("systemActivity") || "Track all system changes and actions"}</p>
        </div>
      </header>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="inventory-card-header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)' }}>
          <div className="card-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList size={20} color="var(--shadow-lg)" /> {isRTL ? "سجل العمليات" : "Recent Activity"}
          </div>
        </div>
        
        {loading ? (
          <div className="empty-state" style={{ padding: "48px" }}>
            <p style={{ color: "var(--text-muted)" }}>{t("loading") || "Loading logs..."}</p>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="empty-state" style={{ padding: "48px" }}>
            <div className="empty-icon">📁</div>
            <p style={{ color: "var(--text-muted)" }}>{isRTL ? "لم يتم تسجيل أي إجراءات بعد." : "No actions recorded yet."}</p>
          </div>
        ) : (
          <div className="audit-list" style={{ padding: '8px 0' }}>
             {auditLogs.map((log: AuditLog, i: number) => (
              <div key={log.id} className="audit-item" style={{ 
                animationDelay: `${i * 0.03}s`,
                padding: '16px 32px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                borderBottom: i === auditLogs.length - 1 ? 'none' : '1px solid var(--border-color)',
                transition: 'background 0.2s ease'
              }}>
                <span className={`audit-badge ${log.action.toLowerCase()}`} style={{
                  minWidth: '100px',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: log.action === 'CREATE' ? 'rgba(34, 197, 94, 0.1)' : 
                              log.action === 'UPDATE' ? 'rgba(59, 130, 246, 0.1)' : 
                              'rgba(239, 68, 68, 0.1)',
                  color: log.action === 'CREATE' ? 'var(--success)' : 
                         log.action === 'UPDATE' ? 'var(--accent)' : 
                         'var(--danger)'
                }}>
                  {log.action}
                </span>
                <span className="audit-details" style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  {log.details}
                </span>
                <span className="audit-time" dir="ltr" style={{ 
                  color: 'var(--text-muted)', 
                  fontSize: '0.85rem',
                  minWidth: '160px',
                  textAlign: isRTL ? 'left' : 'right'
                }}>
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .audit-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }
      `}</style>
    </div>
  );
}
