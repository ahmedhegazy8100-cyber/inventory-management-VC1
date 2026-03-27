"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "./components/I18nProvider";
import { ProductTable } from "./components/ProductTable";
import Link from "next/link";
import { 
  BarChart3, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  Search, 
  Archive, 
  Folder,
  LayoutDashboard,
  LogOut
} from "lucide-react";


import "./globals.css";


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
  targetQuantity: number;
  ignoreRestock: boolean;
  provider?: Provider;
  createdAt: string;

  updatedAt: string;
  deletedAt: string | null;
}

export interface Provider {
  id: string;
  name: string;
  category: string | null;
  status: "ACTIVE" | "INACTIVE";
}


interface FormErrors {
  name?: string;
  quantity?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const queryClient = useQueryClient();

  // Inventory filter state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);

  // Form state (Add Product)
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formBarcode, setFormBarcode] = useState("");
  const [formQuantity, setFormQuantity] = useState("0");
  const [formPrice, setFormPrice] = useState("0");
  const [formExpiry, setFormExpiry] = useState("");
  const [formUnit, setFormUnit] = useState("Piece");
  const [formProviderId, setFormProviderId] = useState("");


  const [formErrors, setFormErrors] = useState<any>({});

  // Edit modal
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editBarcode, setEditBarcode] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [editUnit, setEditUnit] = useState("Piece");
  const [editProviderId, setEditProviderId] = useState("");


  const [editErrors, setEditErrors] = useState<any>({});


  // Delete modal
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  // Provider Management
  const [showProviders, setShowProviders] = useState(false);
  const [newProvName, setNewProvName] = useState("");
  const [newProvCat, setNewProvCat] = useState("");

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.href = "/login";
    } catch {
      showToast("Error logging out", "error");
    }
  };

  // React Query: Fetch Products
  const { data: result, isLoading: loading } = useQuery({
    queryKey: ["products", search, page, showArchived],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      query.set("page", String(page));
      query.set("limit", "10");
      if (showArchived) query.set("includeDeleted", "true");
      const res = await fetch(`/api/products?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: !!user,
  });

  const products = result?.data || [];
  const totalPages = result?.meta?.totalPages || 1;
  const totalProducts = result?.meta?.total || 0;

  // React Query: Fetch Providers
  const { data: providers = [] } = useQuery<Provider[]>({
    queryKey: ["providers"],
    queryFn: async () => {
      const res = await fetch("/api/providers");
      if (!res.ok) throw new Error("Failed to fetch providers");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!user,
  });



  // Mutations
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
      setFormQuantity("0");
      setFormUnit("Piece");
      setFormProviderId("");
      setFormErrors({});


      setShowAddForm(false);
      showToast("Product added successfully!");
    },
    onError: (err: any) => {
      setFormErrors(err);
      showToast(t("errorAdd") || "Failed to add product.", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw errorData.errors || { message: "Failed to update product" };
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditProduct(null);
      showToast(t("updatedSuccess") || "Product updated successfully!");

    },
    onError: (err: any) => {
      setEditErrors(err);
      showToast(t("errorUpdate") || "Failed to update product.", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteProduct(null);
      showToast("Product deleted.");
    },
    onError: () => {
      showToast("Failed to delete product.", "error");
    },
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: FormErrors = {};

    if (!formName.trim()) errors.name = "Product name is required.";
    const qty = Number(formQuantity);
    if (isNaN(qty) || !Number.isInteger(qty))
      errors.quantity = "Must be a whole number.";
    else if (qty < 0) errors.quantity = "Cannot be negative.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    addMutation.mutate({
      name: formName.trim(),
      sku: formSku.trim() || null,
      barcode: formBarcode.trim() || null,
      quantity: qty,
      price: Number(formPrice),
      expiryDate: formExpiry || null,
      unit: formUnit,
      providerId: formProviderId || null,
    });



  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setEditName(product.name);
    setEditSku(product.sku || "");
    setEditBarcode(product.barcode || "");
    setEditQuantity(String(product.quantity));
    setEditPrice(String(product.price || 0));
    setEditExpiry(product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : "");
    setEditUnit(product.unit || "Piece");
    setEditProviderId(product.providerId || "");


    setEditErrors({});
  };


  const handleEdit = async () => {
    if (!editProduct) return;
    const errors: FormErrors = {};

    if (!editName.trim()) errors.name = "Name cannot be empty.";
    const qty = Number(editQuantity);
    if (isNaN(qty) || !Number.isInteger(qty))
      errors.quantity = "Must be a whole number.";
    else if (qty < 0) errors.quantity = "Cannot be negative.";

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    updateMutation.mutate({
      id: editProduct.id,
      data: {
        name: editName.trim(),
        sku: editSku.trim() || null,
        barcode: editBarcode.trim() || null,
        quantity: qty,
        price: Number(editPrice),
        expiryDate: editExpiry || null,
        unit: editUnit,
        providerId: editProviderId || null,
      },
    });


  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    deleteMutation.mutate(deleteProduct.id);
  };

  const handleInlineQuantityChange = async (product: Product, delta: number) => {
    const newQty = product.quantity + delta;
    if (newQty < 0) return;

    updateMutation.mutate({
      id: product.id,
      data: { quantity: newQty },
    });
  };

  const getStockClass = (qty: number) => {
    if (qty === 0) return "stock-out";
    if (qty <= 20) return "stock-low";
    return "stock-ok";
  };

  const { t, isRTL } = useI18n();

  if (loadingApp) {
    return (
      <div className="empty-state" style={{ paddingTop: 64 }}>
        <p style={{ color: "var(--text-muted)" }}>{t("loadingApp") || "Initializing Inventra..."}</p>
      </div>
    );
  }

  if (!user) return null;

  const lowStockCount = products.filter((p: Product) => p.quantity < 50).length;
  
  const expiringSoonCount = products.filter((p: Product) => {
    if (!p.expiryDate) return false;
    const expiry = new Date(p.expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return expiry > today && expiry <= thirtyDaysFromNow;
  }).length;


  return (
    <div className="page-fade-in">
      <header className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LayoutDashboard size={28} color="var(--accent)" />
            {t("dashboard") || "Dashboard Overview"}
          </h1>
          <p className="text-secondary">{t("welcomeBack") || "Welcome back"}, {user.name}</p>
        </div>
        <div className="header-actions">
          <Link
            href="/mobile/scan"
            target="_blank"
            rel="noopener noreferrer"
            id="btn-download-cashier"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: 'linear-gradient(135deg,#00C49A,#00FFC2)',
              color: '#051a14',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(0,255,194,0.25)',
            }}
          >
            📲 Download Cashier View
          </Link>
          <button onClick={() => setShowProviders(!showProviders)} className="btn-icon">
            {showProviders ? "Back to Products" : "Manage Suppliers"}
          </button>
          <button onClick={() => setShowAddForm(true)} className="btn-add" style={{ marginTop: 0 }}>
            <Plus size={18} /> {t("addProduct")}
          </button>
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={18} /> {t("logout")}
          </button>
        </div>

      </header>

      {/* Bento Grid Metrics */}
      <div className="bento-grid">
        <div className="card bento-card metric-primary">
          <div className="bento-icon"><TrendingUp size={32} /></div>
          <div>
            <div className="metric-label">{t("invValue") || "Inv. Value"}</div>
            <div className="metric-value">${stats?.totalValue?.toFixed(2) || "0.00"}</div>
            <p className="metric-subtext">Total procurement cost</p>
          </div>
        </div>

        <div className="card bento-card metric-success">
          <div className="bento-icon"><BarChart3 size={32} /></div>
          <div>
            <div className="metric-label">{t("expProfit") || "Exp. Profit"}</div>
            <div className="metric-value">${stats?.expectedProfit?.toFixed(2) || "0.00"}</div>
            <p className="metric-subtext">On current stock</p>
          </div>
        </div>
      </div>



      <style jsx>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }
        .header-actions {
          display: flex;
          gap: 12px;
        }
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: minmax(140px, auto);
          gap: 20px;
          margin-bottom: 32px;
        }
        .bento-card {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 24px 32px;
        }
        .bento-icon {
          font-size: 2.2rem;
          background: rgba(255, 255, 255, 0.05);
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
        }
        .metric-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .metric-value {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1;
          margin: 4px 0;
        }
        .metric-subtext {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .metric-warning .bento-icon { color: var(--warning); }
        .metric-success .bento-icon { color: var(--success); }
        .metric-primary .bento-icon { color: var(--accent); }
        .metric-error .bento-icon { color: #ef4444; }
        .metric-muted .bento-icon { color: var(--text-muted); }


        .inventory-card {
          padding: 0;
          overflow: hidden;
        }
        .inventory-card-header {
          padding: 24px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
        }

        @media (max-width: 1024px) {
          .bento-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .bento-grid { grid-template-columns: 1fr; }
          .page-header { flex-direction: column; gap: 16px; }
        }
      `}</style>

      {/* Inventory Section */}
      <div className="card inventory-card">
        <div className="inventory-card-header">
          <div className="card-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Archive size={20} color="var(--accent)" /> {t("inventory") || "Inventory"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div className="search-wrapper" style={{ width: 260 }}>
              <span className="search-icon"><Search size={16} /></span>
              <input
                type="text"
                className="search-input"
                placeholder={t("search")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <button 
              className={`btn-icon ${showArchived ? 'active' : ''}`}
              onClick={() => setShowArchived(!showArchived)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {showArchived ? <Archive size={16} /> : <Folder size={16} />} 
              {t("archived")}
            </button>
          </div>
        </div>

        {!showProviders ? (
          <ProductTable 
            products={products}
            loading={loading}
            onEdit={openEdit}
            onDelete={setDeleteProduct}
            onQuantityChange={handleInlineQuantityChange}
            getStockClass={getStockClass}
          />
        ) : (
          <div className="provider-manager" style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem' }}>Suppliers / Providers</h2>
            </div>
            
            <div className="card" style={{ background: 'var(--bg-secondary)', marginBottom: '24px', padding: '16px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>Add New Supplier</h4>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  placeholder="Supplier Name" 
                  value={newProvName} 
                  onChange={e => setNewProvName(e.target.value)} 
                  style={{ flex: 1 }}
                />
                <input 
                  placeholder="Category (e.g. Dairy)" 
                  value={newProvCat} 
                  onChange={e => setNewProvCat(e.target.value)} 
                  style={{ flex: 1 }}
                />
                <button 
                  className="btn-save"
                  onClick={async () => {
                    if (!newProvName) return;
                    await fetch("/api/providers", {
                      method: "POST",
                      body: JSON.stringify({ name: newProvName, category: newProvCat })
                    });
                    setNewProvName("");
                    setNewProvCat("");
                    queryClient.invalidateQueries({ queryKey: ["providers"] });
                    showToast("Supplier added!");
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.category || "—"}</td>
                      <td>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: p.status === 'ACTIVE' ? 'var(--success)' : 'var(--text-muted)' }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {providers.length === 0 && (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '32px' }}>No suppliers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {products.length > 0 && (
          <div className="pagination-footer">
            <button 
              className="btn-page" 
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Previous
            </button>
            <span className="page-info">
              {t("page")} <strong>{page}</strong> {t("of")} <strong>{totalPages}</strong>
            </span>
            <button 
              className="btn-page" 
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t("addProduct")}</h3>
            <form onSubmit={handleAdd}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Item name *</label>

                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={formErrors.name ? "input-error" : ""}
                />
                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', marginBottom: 24 }}>
                <div className="form-group">
                  <label>SKU</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Item code</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setFormBarcode(Math.random().toString().slice(2, 11))}
                      style={{ padding: '0 8px', fontSize: '12px', background: 'var(--accent)', borderRadius: '4px' }}
                    >
                      Gen
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', marginBottom: 24 }}>
                <div className="form-group">
                  <label>Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. Piece, Box"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Provider</label>
                  <select
                    value={formProviderId}
                    onChange={(e) => setFormProviderId(e.target.value)}
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '11px', color: 'var(--text-primary)' }}
                  >
                    <option value="">Select Provider</option>
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "..." : "Add Product"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editProduct && (
        <div className="modal-overlay" onClick={() => setEditProduct(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit {editProduct.name}</h3>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Item name *</label>

              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={editErrors.name ? "input-error" : ""}
              />
              {editErrors.name && <span className="error-text">{editErrors.name}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', marginBottom: 16 }}>

              <div className="form-group">
                <label>SKU</label>
                <input
                  type="text"
                  value={editSku}
                  onChange={(e) => setEditSku(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Item code</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={editBarcode}
                    onChange={(e) => setEditBarcode(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setEditBarcode(Math.random().toString().slice(2, 11))}
                    style={{ padding: '0 8px', fontSize: '12px', background: 'var(--accent)', borderRadius: '4px' }}
                  >
                    Gen
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', marginBottom: 24 }}>

              <div className="form-group">
                <label>Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className={editErrors.quantity ? "input-error" : ""}
                />
                {editErrors.quantity && <span className="error-text">{editErrors.quantity}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', marginBottom: 24 }}>
              <div className="form-group">
                <label>Unit</label>
                <input
                  type="text"
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Provider</label>
                <select
                  value={editProviderId}
                  onChange={(e) => setEditProviderId(e.target.value)}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '11px', color: 'var(--text-primary)' }}
                >
                  <option value="">Select Provider</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>

              <label>{t("expiryDate") || "Expiry Date"}</label>
              <input
                type="date"
                value={editExpiry}
                onChange={(e) => setEditExpiry(e.target.value)}
                className="w-full"
              />
            </div>


            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditProduct(null)}>Cancel</button>
              <button className="btn-save" onClick={handleEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteProduct && (
        <div className="modal-overlay" onClick={() => setDeleteProduct(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Product?</h3>
            <p className="text-secondary" style={{ marginBottom: 16 }}>
              Are you sure you want to delete <strong>{deleteProduct.name}</strong>? This action is permanent.
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteProduct(null)}>Cancel</button>
              <button className="btn-delete-confirm" onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}



      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
