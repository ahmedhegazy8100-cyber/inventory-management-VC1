"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "../components/I18nProvider";
import { ProviderTable } from "../components/ProviderTable";
import { AddProviderModal } from "../components/AddProviderModal";
import { 
  Users, 
  Search, 
  Plus, 
  Filter,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

export default function ProvidersPage() {
  const router = useRouter();
  const { t, isRTL } = useI18n();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [deleteProvider, setDeleteProvider] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["providers", search, page],
    queryFn: async () => {
      const res = await fetch(`/api/providers?search=${search}&page=${page}&limit=10`);
      if (!res.ok) throw new Error("Failed to fetch providers");
      return res.json();
    },
  });

  const providers = data?.providers || [];
  const totalPages = data?.totalPages || 1;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/providers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete provider");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      setDeleteProvider(null);
    },
  });

  const openAddModal = () => {
    setSelectedProvider(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setSelectedProvider(p);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["providers"] });
  };

  const stats = [
    { label: t("totalProviders") || "Total Providers", value: data?.total || 0, icon: <Users size={24} />, color: "primary" },
    { label: t("active") || "Active", value: providers.filter((p: any) => p.status === "ACTIVE").length, icon: <ShieldCheck size={24} />, color: "success" },
    { label: t("inactive") || "Inactive", value: providers.filter((p: any) => p.status === "INACTIVE").length, icon: <AlertCircle size={24} />, color: "error" },
  ];

  return (
    <div className="providers-page">
      <header className="page-header">
        <div>
          <h1 className="t-gradient">{t("providers") || "Providers Hub"}</h1>
          <p className="text-secondary">{t("manageSuppliers") || "Directory of global supply chain partners"}</p>
        </div>
        <button className="btn-add haptic-btn" onClick={openAddModal}>
          <Plus size={18} /> {t("addProvider")}
        </button>
      </header>

      <div className="kpi-row">
        {stats.map((stat, i) => (
          <div key={i} className={`card kpi-card metric-${stat.color}`}>
            <div className="kpi-icon-wrapper">{stat.icon}</div>
            <div className="kpi-content">
              <div className="metric-label">{stat.label}</div>
              <div className="metric-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card inventory-card" style={{ marginTop: '32px' }}>
        <div className="inventory-card-header">
          <div className="card-title">
            <Users size={20} color="var(--accent)" /> {t("providerList") || "Supplier Directory"}
          </div>
          <div className="search-wrapper" style={{ width: 300 }}>
            <span className="search-icon"><Search size={16} /></span>
            <input
              type="text"
              className="search-input"
              placeholder={t("searchProviders") || "Filter by name or category..."}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="skeleton-container">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="empty-state-elite">
            <div className="empty-icon-bg">
              <Users size={80} className="text-muted opacity-10" />
            </div>
            <p className="text-secondary">{t("noProviders") || "Your supplier directory is empty."}</p>
            <button className="btn-add-ghost haptic-btn" onClick={openAddModal}>
              <Plus size={16} /> {t("addProvider")}
            </button>
          </div>
        ) : (
          <ProviderTable 
            providers={providers}
            loading={false}
            onEdit={openEditModal}
            onDelete={setDeleteProvider}
            onView={(p) => router.push(`/providers/${p.id}`)}
          />
        )}

        {totalPages > 1 && (
          <div className="pagination-footer">
            <button className="btn-page" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
            <span className="page-info">{t("page")} <strong>{page}</strong> {t("of")} <strong>{totalPages}</strong></span>
            <button className="btn-page" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      <AddProviderModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        initialData={selectedProvider}
      />

      {/* Delete Modal */}
      {deleteProvider && (
        <div className="modal-overlay" onClick={() => setDeleteProvider(null)}>
          <div className="modal glass-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Provider?</h3>
            <p className="text-secondary" style={{ marginBottom: 16 }}>
              Are you sure you want to delete <strong>{deleteProvider.name}</strong>? This will not affect existing inventory products.
            </p>
            <div className="modal-actions">
              <button className="btn-cancel haptic-btn" onClick={() => setDeleteProvider(null)}>{t("cancel")}</button>
              <button className="btn-delete-confirm haptic-btn" onClick={() => deleteMutation.mutate(deleteProvider.id)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .providers-page {
          animation: fadeIn 0.5s ease-out;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .kpi-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .kpi-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          border-radius: 20px;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .kpi-card:hover {
          transform: translateY(-5px);
        }

        .kpi-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(var(--accent-rgb), 0.1);
          color: var(--accent);
        }

        .metric-primary .kpi-icon-wrapper { background: rgba(var(--accent-rgb), 0.1); color: var(--accent); }
        .metric-success .kpi-icon-wrapper { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .metric-error .kpi-icon-wrapper { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .metric-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .skeleton-container {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-row {
          height: 48px;
          background: linear-gradient(90deg, var(--bg-input) 25%, var(--border-color) 50%, var(--bg-input) 75%);
          background-size: 200% 100%;
          animation: skeletonLoading 1.5s infinite;
          border-radius: 12px;
        }

        @keyframes skeletonLoading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .empty-state-elite {
          padding: 80px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          text-align: center;
        }

        .empty-icon-bg {
          width: 120px;
          height: 120px;
          background: rgba(var(--accent-rgb), 0.03);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .opacity-10 { opacity: 0.1; }

        .btn-add-ghost {
          background: transparent;
          border: 1px dashed var(--border-color);
          color: var(--accent);
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-add-ghost:hover {
          background: rgba(var(--accent-rgb), 0.05);
          border-style: solid;
        }

        .haptic-btn {
          transition: transform 0.1s;
        }
        .haptic-btn:active {
          transform: scale(0.95);
        }

        @media (max-width: 900px) {
          .kpi-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
