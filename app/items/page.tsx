"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "../components/I18nProvider";
import { ProductTable } from "../components/ProductTable";
import { 
  Plus, 
  Search, 
  Archive, 
  Folder,
  Tag,
  Package,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";

export default function ItemsPage() {
  const queryClient = useQueryClient();
  const { t } = useI18n();

  // Session
  const [user, setUser] = useState<any>(null);
  const [loadingApp, setLoadingApp] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);

  // Modals
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formBarcode, setFormBarcode] = useState("");
  const [formUnitBarcode, setFormUnitBarcode] = useState("");
  const [formPrice, setFormPrice] = useState("0");
  const [formUnit, setFormUnit] = useState("Piece");
  const [formErrors, setFormErrors] = useState<any>({});

  const [editProduct, setEditProduct] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPurchasePrice, setEditPurchasePrice] = useState("");
  const [editBarcode, setEditBarcode] = useState("");
  const [editUnitBarcode, setEditUnitBarcode] = useState("");
  const [editUnit, setEditUnit] = useState("Piece");
  const [editProviderId, setEditProviderId] = useState("");
  const [editErrors, setEditErrors] = useState<any>({});

  const [deleteProduct, setDeleteProduct] = useState<any>(null);

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

  // Mutations
  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw (await res.json()).errors;
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowAddForm(false);
      setFormName(""); 
      setFormSku(""); 
      setFormBarcode(""); 
      setFormUnitBarcode("");
      setFormPrice("0");
    },
    onError: (err: any) => setFormErrors(err),
  });

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
      setEditProduct(null);
    },
    onError: (err: any) => setEditErrors(err),
  });

  const openEdit = (product: any) => {
    setEditProduct(product);
    setEditName(product.name);
    setEditSku(product.sku || "");
    setEditPrice(String(product.price || 0));
    setEditPurchasePrice(String(product.purchasePrice || 0));
    setEditBarcode(product.barcode || "");
    setEditUnitBarcode(product.unitBarcode || "");
    setEditUnit(product.unit || "Piece");
    setEditProviderId(product.providerId || "");
    setEditErrors({});
  };

  if (loadingApp) return null;

  return (
    <div className="page-fade-in">
      <header className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Tag size={28} color="var(--accent)" />
            Items Master Repository
          </h1>
          <p className="text-secondary">Official catalog and SKU database definitions.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/" className="btn-icon">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <button onClick={() => setShowAddForm(true)} className="btn-add" style={{ marginTop: 0 }}>
            <Plus size={18} /> Add Item
          </button>
        </div>
      </header>

      <div className="card bento-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
          <div className="search-wrapper" style={{ width: 400 }}>
            <span className="search-icon"><Search size={16} /></span>
            <input 
              className="search-input" 
              placeholder="Search master items catalog..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button 
            className={`btn-icon ${showArchived ? 'active' : ''}`}
            onClick={() => setShowArchived(!showArchived)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {showArchived ? <Archive size={16} /> : <Folder size={16} />} 
            Show Archived
          </button>
        </div>

        <ProductTable 
          products={products}
          loading={loading}
          onEdit={openEdit}
          onDelete={setDeleteProduct}
          onQuantityChange={() => {}} // Disabled in Items Module
          getStockClass={() => "stock-ok"}
        />
        
        {products.length > 0 && (
          <div className="pagination-footer" style={{ padding: '20px 32px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn-page" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
            <button className="btn-page" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {/* Add Master Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '24px' }}>Create Master Catalog Entry</h3>
            <form onSubmit={(e) => { 
                e.preventDefault(); 
                addMutation.mutate({ 
                  name: formName, 
                  sku: formSku, 
                  price: Number(formPrice), 
                  unit: formUnit,
                  barcode: formBarcode,
                  unitBarcode: formUnitBarcode
                }); 
              }}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Item Name *</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} className={formErrors.name ? "input-error" : ""} />
                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>SKU (Alphanumeric)</label>
                <input value={formSku} onChange={e => setFormSku(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Selling Price ($) *</label>
                <input type="number" step="0.01" value={formPrice} onChange={e => setFormPrice(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 24 }}>
                <div className="form-group">
                  <label>Barcode per unit [Cartoon, Shrank, etc]</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input value={formUnitBarcode} onChange={e => setFormUnitBarcode(e.target.value)} style={{ flex: 1 }} />
                    <button type="button" onClick={() => setFormUnitBarcode(Math.random().toString().slice(2, 11))} className="qty-btn" style={{ borderRadius: '6px' }}>Gen</button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Barcode per piece [1 Piece, 1KG, etc]</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input value={formBarcode} onChange={e => setFormBarcode(e.target.value)} style={{ flex: 1 }} />
                    <button type="button" onClick={() => setFormBarcode(Math.random().toString().slice(2, 11))} className="qty-btn" style={{ borderRadius: '6px' }}>Gen</button>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn-save">Save Master Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Master Modal */}
      {editProduct && (
        <div className="modal-overlay" onClick={() => setEditProduct(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '24px' }}>Update Record: {editProduct.name}</h3>
            ...
    <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Item Name</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 24 }}>
              <div className="form-group">
                <label>SKU</label>
                <input value={editSku} onChange={e => setEditSku(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Selling Price ($)</label>
                <input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 24 }}>
              <div className="form-group">
                <label>Barcode per unit [Cartoon, Shrank, etc]</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={editUnitBarcode} onChange={e => setEditUnitBarcode(e.target.value)} style={{ flex: 1 }} />
                  <button type="button" onClick={() => setEditUnitBarcode(Math.random().toString().slice(2, 11))} className="qty-btn" style={{ borderRadius: '6px' }}>Gen</button>
                </div>
              </div>
              <div className="form-group">
                <label>Barcode per piece [1 Piece, 1KG, etc]</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={editBarcode} onChange={e => setEditBarcode(e.target.value)} style={{ flex: 1 }} />
                  <button type="button" onClick={() => setEditBarcode(Math.random().toString().slice(2, 11))} className="qty-btn" style={{ borderRadius: '6px' }}>Gen</button>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditProduct(null)}>Cancel</button>
              <button className="btn-save" onClick={() => updateMutation.mutate({ 
                id: editProduct.id, 
                data: { 
                  name: editName, 
                  sku: editSku, 
                  price: Number(editPrice),
                  barcode: editBarcode,
                  unitBarcode: editUnitBarcode
                } 
              })}>Update Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
