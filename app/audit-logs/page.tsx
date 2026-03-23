"use client";

import { useQuery } from "@tanstack/react-query";
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
            <span className="icon">📝</span> Audit Log
          </div>
          
          {loading ? (
            <div className="empty-state" style={{ padding: "32px 24px" }}>
              <p style={{ color: "var(--text-muted)" }}>Loading audit logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px 24px" }}>
              <p style={{ color: "var(--text-muted)" }}>No actions recorded yet.</p>
            </div>
          ) : (
            <div className="audit-list" style={{ maxHeight: "calc(100vh - 250px)" }}>
              {auditLogs.map((log: AuditLog) => (
                <div key={log.id} className="audit-item">
                  <span className={`audit-badge ${log.action.toLowerCase()}`}>
                    {log.action}
                  </span>
                  <span className="audit-details">{log.details}</span>
                  <span className="audit-time">
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
