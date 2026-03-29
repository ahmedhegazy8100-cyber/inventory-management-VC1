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
  Package,
  Edit2,
  Trash2,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  quantity: number;
  price: number;
  purchasePrice: number;
  expiryDate: string | null;
  unit: string;
  providerId: string | null;
  provider?: Provider;
}

export interface Provider {
  id: string;
  name: string;
  category: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { t, isRTL } = useI18n();

  // Authentication & Session
  const [user, setUser] = useState<any>(null);
  const [loadingApp, setLoadingApp] = useState(true);

  // Inventory filter state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formBarcode, setFormBarcode] = useState("");
  const [formPrice, setFormPrice] = useState("0");
  const [formUnit, setFormUnit] = useState("Piece");
  const [formErrors, setFormErrors] = useState<any>({});

  // Edit modal
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editBarcode, setEditBarcode] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPurchasePrice, setEditPurchasePrice] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [editUnit, setEditUnit] = useState("Piece");
  const [editProviderId, setEditProviderId] = useState("");
  const [editErrors, setEditErrors] = useState<any>({});

  // Delete/Archive states
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
      query.set("limit", "15"); // Slightly more for dedicated view
      if (showArchived) query.set("includeDeleted", "true");
      const res = await fetch(`/api/products?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: !!user,
  });

  const products = result?.data || [];
  const totalPages = result?.meta?.totalPages || 1;

  // Add Product Mutation
  const addMutation = useMutation({
    mutationFn: async (newProduct: any) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      if (!res.ok) {
        const data = await res.json();
        throw data.errors || { message: "Failed to add product" };
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setFormName("");
      setFormSku("");
      setFormBarcode("");
      setFormPrice("0");
      setFormErrors({});
      setShowAddForm(false);
      showToast("Product added successfully!");
    },
    onError: (err: any) => setFormErrors(err),
  });

  // Update Product Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw errorData.errors || { message: "Failed to update" };
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditProduct(null);
      showToast("Product updated.");
    },
    onError: (err: any) => setEditErrors(err),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteProduct(null);
      showToast("Product archived.");
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      name: formName.trim(),
      sku: formSku.trim() || null,
      barcode: formBarcode.trim() || null,
      quantity: 0,
      price: Number(formPrice),
      purchasePrice: 0,
      unit: formUnit,
    });
  };

  const handleEdit = () => {
    if (!editProduct) return;
    updateMutation.mutate({
      id: editProduct.id,
      data: {
        name: editName.trim(),
        sku: editSku.trim() || null,
        barcode: editBarcode.trim() || null,
        quantity: Number(editQuantity),
        price: Number(editPrice),
        purchasePrice: Number(editPurchasePrice),
        expiryDate: editExpiry || null,
        unit: editUnit,
        providerId: editProviderId || null,
      },
    });
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setEditName(product.name);
    setEditSku(product.sku || "");
    setEditBarcode(product.barcode || "");
    setEditQuantity(String(product.quantity));
    setEditPrice(String(product.price || 0));
    setEditPurchasePrice(String(product.purchasePrice || 0));
    setEditExpiry(product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : "");
    setEditUnit(product.unit || "Piece");
    setEditProviderId(product.providerId || "");
    setEditErrors({});
  };

  if (loadingApp) return null;
  if (!user) return <div className="p-8">Please log in.</div>;

  return (
    <div className="page-fade-in" style={{ paddingBottom: '40px' }}>
      <header className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package size={28} color="var(--accent)" />
            Inventory Master Module
          </h1>
          <p className="text-secondary">Centralized master data repository for all stock items.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/" className="btn-icon">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <button onClick={() => setShowAddForm(true)} className="btn-add" style={{ marginTop: 0 }}>
            <Plus size={18} /> New Product
          </button>
        </div>
      </header>

      <div className="card bento-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
          <div className="search-wrapper" style={{ width: 400 }}>
            <span className="search-icon"><Search size={16} /></span>
            <input 
              className="search-input" 
              placeholder="Search by name, SKU, or barcode..." 
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
            {showArchived ? "Showing Archived" : "Show Archived"}
          </button>
        </div>

        <ProductTable 
          products={products}
          loading={loading}
          onEdit={openEdit}
          onDelete={setDeleteProduct}
          onQuantityChange={(product, delta) => {
             updateMutation.mutate({ id: product.id, data: { quantity: product.quantity + delta } });
          }}
          getStockClass={(qty) => qty === 0 ? "stock-out" : qty <= 20 ? "stock-low" : "stock-ok"}
        />

        {products.length > 0 && (
          <div className="pagination-footer" style={{ padding: '20px 32px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn-page" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
            <button className="btn-page" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '24px' }}>Add New Product</h3>
            <form onSubmit={handleAdd}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Product Name *</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} className={formErrors.name ? "input-error" : ""} />
                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 24 }}>
                <div className="form-group">
                  <label>SKU (Internal)</label>
                  <input value={formSku} onChange={e => setFormSku(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Item Barcode</label>
                  <input value={formBarcode} onChange={e => setFormBarcode(e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label>Initial Selling Price ($)</label>
                <input type="number" step="0.01" value={formPrice} onChange={e => setFormPrice(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={addMutation.isPending}>Add Master Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editProduct && (
        <div className="modal-overlay" onClick={() => setEditProduct(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '24px' }}>Update Item: {editProduct.name}</h3>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Product Name</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 16 }}>
              <div className="form-group">
                <label>SKU</label>
                <input value={editSku} onChange={e => setEditSku(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Barcode</label>
                <input value={editBarcode} onChange={e => setEditBarcode(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 24 }}>
              <div className="form-group">
                <label>Current Stock</label>
                <input type="number" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Selling Price ($)</label>
                <input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditProduct(null)}>Cancel</button>
              <button className="btn-save" onClick={handleEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation */}
      {deleteProduct && (
        <div className="modal-overlay" onClick={() => setDeleteProduct(null)}>
          <div className="modal" style={{ width: '400px' }}>
            <h3>Confirm Archive</h3>
            <p className="text-secondary" style={{ marginBottom: '24px' }}>
              Are you sure you want to archive <strong>{deleteProduct.name}</strong>? It will be hidden from the active list.
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteProduct(null)}>Cancel</button>
              <button className="btn-logout" onClick={() => deleteMutation.mutate(deleteProduct.id)}>Archive Item</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
