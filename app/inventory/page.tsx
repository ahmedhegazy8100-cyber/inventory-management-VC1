"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "../components/I18nProvider";
import { InventoryTable } from "../components/InventoryTable";
import { 
  Plus, 
  Search, 
  Archive, 
  Folder,
  Package,
  LayoutDashboard,
  Barcode
} from "lucide-react";
import Link from "next/link";

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { t } = useI18n();

  // Session
  const [user, setUser] = useState<any>(null);
  const [loadingApp, setLoadingApp] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);

  // Operations Modals
  const [manageBarcodeItem, setManageBarcodeItem] = useState<any>(null);
  const [tempBarcode, setTempBarcode] = useState("");

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      setUser(null);
    } finally {
      setLoadingApp(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Fetch Products
  const { data: result, isLoading: loading } = useQuery({
    queryKey: ["products", search, page, showArchived],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      query.set("page", String(page));
      query.set("limit", "15");
      if (showArchived) query.set("includeDeleted", "true");
      const res = await fetch(`/api/products?${query.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user,
  });

  const products = result?.data || [];
  const totalPages = result?.meta?.totalPages || 1;

  // Mutations (Operational)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw (await res.json()).errors;
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setManageBarcodeItem(null);
    },
  });

  const handleQuantityDelta = (product: any, delta: number) => {
    const newQty = product.quantity + delta;
    if (newQty < 0) return;
    updateMutation.mutate({ id: product.id, data: { quantity: newQty } });
  };

  if (loadingApp) return null;

  return (
    <div className="page-fade-in">
      <header className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package size={28} color="var(--accent)" />
            Inventory Stock Tracker
          </h1>
          <p className="text-secondary">Track live availability, reconcile stock, and manage barcodes.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/" className="btn-icon">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link href="/items" className="btn-add" style={{ marginTop: 0 }}>
             Update Master Catalog
          </Link>
        </div>
      </header>

      <div className="card bento-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
          <div className="search-wrapper" style={{ width: 400 }}>
            <span className="search-icon"><Search size={16} /></span>
            <input 
              className="search-input" 
              placeholder="Quick search by name or barcode..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
               Live Items: <span style={{ color: 'var(--accent)' }}>{result?.meta?.total || 0}</span>
            </div>
            <button 
              className={`btn-icon ${showArchived ? 'active' : ''}`}
              onClick={() => setShowArchived(!showArchived)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {showArchived ? <Archive size={16} /> : <Folder size={16} />} 
              Inventory Archives
            </button>
          </div>
        </div>

        <InventoryTable 
          products={products}
          loading={loading}
          onQuantityChange={handleQuantityDelta}
          onManageBarcode={(p) => { setManageBarcodeItem(p); setTempBarcode(p.barcode || ""); }}
        />
        
        {products.length > 0 && (
          <div className="pagination-footer" style={{ padding: '20px 32px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn-page" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
            <button className="btn-page" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {/* Barcode Management Modal */}
      {manageBarcodeItem && (
        <div className="modal-overlay" onClick={() => setManageBarcodeItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Barcode size={24} color="var(--accent)" />
              Re-assign Barcode: {manageBarcodeItem.name}
            </h3>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Electronic Barcode (GTIN-8/12/13)</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  value={tempBarcode} 
                  onChange={e => setTempBarcode(e.target.value)} 
                  autoFocus 
                  style={{ flex: 1 }}
                  placeholder="Scan or type barcode..."
                />
                <button 
                  className="btn-icon" 
                  onClick={() => setTempBarcode(Math.random().toString().slice(2, 11))}
                >
                   Gen
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setManageBarcodeItem(null)}>Cancel</button>
              <button className="btn-save" onClick={() => updateMutation.mutate({ id: manageBarcodeItem.id, data: { barcode: tempBarcode } })}>Update Identifier</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
