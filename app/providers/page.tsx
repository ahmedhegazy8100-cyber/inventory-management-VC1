"use client";

import { useState } from "react";
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

      <div className="bento-grid">
        {stats.map((stat, i) => (
          <div key={i} className={`card bento-card metric-${stat.color}`}>
            <div className="bento-icon">{stat.icon}</div>
            <div>
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

        <ProviderTable 
          providers={providers}
          loading={isLoading}
          onEdit={openEditModal}
          onDelete={setDeleteProvider}
        />

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
        }
        .haptic-btn {
          transition: transform 0.1s;
        }
        .haptic-btn:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}
