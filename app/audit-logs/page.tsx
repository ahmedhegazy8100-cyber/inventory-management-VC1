"use client";

import { useQuery } from "@tanstack/react-query";
import { useI18n } from "./../components/I18nProvider";
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
    <div className="container" style={{ paddingTop: 0 }}>
      <div className="audit-section" style={{ marginTop: 0 }}>
        <div className="card">
          <div className="card-title">
            <span className="icon">📝</span> {t("auditLogs")}
          </div>
          
          {loading ? (
            <div className="empty-state" style={{ padding: "32px 24px" }}>
              <p style={{ color: "var(--text-muted)" }}>{t("loading") || "Loading..."}</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px 24px" }}>
              <p style={{ color: "var(--text-muted)" }}>{isRTL ? "لم يتم تسجيل أي إجراءات بعد." : "No actions recorded yet."}</p>
            </div>
          ) : (
            <div className="audit-list" style={{ maxHeight: "calc(100vh - 250px)" }}>
               {auditLogs.map((log: AuditLog, i: number) => (
                <div key={log.id} className="audit-item" style={{ animationDelay: `${i * 0.04}s` }}>
                  <span className={`audit-badge ${log.action.toLowerCase()}`}>
                    {log.action}
                  </span>
                  <span className="audit-details">{log.details}</span>
                  <span className="audit-time" dir="ltr" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
