"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "./../components/I18nProvider";
import { AlertCircle, Truck, Package, X, CheckCircle2, Plus } from "lucide-react";
import "./../globals.css";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
}

interface Order {
  id: string;
  productId: string;
  providerName: string;
  expectedDate: string;
  quantity: number;
  notes: string | null;
  status: string;
  createdAt: string;
  product: { name: string; sku: string | null };
}

interface FormErrors {
  providerName?: string;
  expectedDate?: string;
  quantity?: string;
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { t, isRTL } = useI18n();

  // Order modal state
  const [activeSuggestion, setActiveSuggestion] = useState<Product | null>(null);
  const [formProviderName, setFormProviderName] = useState("");
  const [formProviderId, setFormProviderId] = useState("");
  const [formExpectedDate, setFormExpectedDate] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formNotes, setFormNotes] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Fetch all products for the manual dropdown
  const { data: productsData } = useQuery({
    queryKey: ["products-all"],
    queryFn: async () => {
      const res = await fetch("/api/products?limit=1000"); // Get all for dropdown
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });
  const allProducts = productsData?.data || [];

  // Fetch providers for the dropdown
  const { data: providerData } = useQuery({
    queryKey: ["providers-list"],
    queryFn: async () => {
      const res = await fetch("/api/providers?limit=100");
      if (!res.ok) throw new Error("Failed to fetch providers");
      return res.json();
    },
  });
  const providerList = (providerData?.providers || []).filter((p: any) => p.status === "ACTIVE");

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Queries
  const { data: suggestions = [], isLoading: loadingSuggestions } = useQuery({
    queryKey: ["suggestions"],
    queryFn: async () => {
      const res = await fetch("/api/orders/suggestions");
      if (!res.ok) throw new Error("Failed to load suggestions");
      return res.json();
    },
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to load orders");
      return res.json();
    },
  });

  const loading = loadingSuggestions || loadingOrders;

  // Mutations
  const ignoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}/ignore`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to ignore suggestion");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      showToast("Suggestion ignored.");
    },
    onError: () => showToast("Failed to ignore suggestion.", "error"),
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw data.errors || { message: "Failed to place order" };
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "suggestions"] });
      setIsCreateModalOpen(false);
      showToast("Order placed successfully!");
    },
    onError: (err: any) => {
      setFormErrors(err);
      showToast("Failed to place order.", "error");
    },
  });

  const handleIgnore = (id: string) => {
    ignoreMutation.mutate(id);
  };

  const openOrderModal = (product: Product) => {
    setActiveSuggestion(product);
    setSelectedProductId(product.id);
    setFormProviderId("");
    setFormProviderName("");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormExpectedDate(tomorrow.toISOString().split("T")[0]);
    setFormQuantity("50");
    setFormNotes("");
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const openManualOrderModal = () => {
    setActiveSuggestion(null);
    setSelectedProductId("");
    setFormProviderId("");
    setFormProviderName("");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormExpectedDate(tomorrow.toISOString().split("T")[0]);
    setFormQuantity("100");
    setFormNotes("");
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalProductId = activeSuggestion?.id || selectedProductId;
    if (!finalProductId) {
      showToast("Please select a product.", "error");
      return;
    }

    const errors: FormErrors = {};
    if (!formProviderId) errors.providerName = "Provider is required.";
    if (!formExpectedDate) errors.expectedDate = "Expected date is required.";
    
    const qty = Number(formQuantity);
    if (isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
      errors.quantity = "Must be a positive whole number.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    placeOrderMutation.mutate({
      productId: finalProductId,
      providerId: formProviderId,
      providerName: formProviderName.trim(),
      expectedDate: formExpectedDate,
      quantity: qty,
      notes: formNotes.trim(),
    });
  };

  return (
    <div className="page-fade-in">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Truck size={28} color="var(--accent)" />
            {t("orders") || "Orders Management"}
          </h1>
          <p className="text-secondary">{t("manageShipments") || "Track and restock your inventory"}</p>
        </div>
        <button className="btn-add" onClick={openManualOrderModal} style={{ marginTop: 0 }}>
          <Plus size={18} /> {isRTL ? "إنشاء طلب" : "Create Order"}
        </button>
      </header>

      {/* Suggestions Section */}
      <div className="card" style={{ marginBottom: "32px", borderLeft: "4px solid var(--warning)" }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} color="var(--warning)" /> {t("lowStock")}
        </div>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "0.95rem" }}>
          {isRTL ? "هذه العناصر شارفت على النفاد. نوصي بإعادة طلبها الآن." : "These items are running low. We recommend restocking them immediately."}
        </p>
        
        {loading ? (
          <div className="empty-state">
            <p>{t("loading") || "Loading..."}</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ color: 'var(--success)' }}><CheckCircle2 size={48} /></div>
            <h3>{isRTL ? "المخزون مكتمل" : "Stock is Optimal"}</h3>
            <p>{isRTL ? "لا توجد عناصر تحتاج إلى إعادة طلب حالياً." : "No items require restocking at this time."}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t("name")}</th>
                  <th>{t("sku")}</th>
                  <th>{t("quantity")}</th>
                  <th>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((prod: Product, i: number) => (
                  <tr key={prod.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <td className="product-name">{prod.name}</td>
                    <td className="product-sku">{prod.sku || "—"}</td>
                    <td>
                      <span className="quantity-badge stock-low">{prod.quantity}</span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn-icon"
                          style={{ color: "var(--text-muted)", display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => handleIgnore(prod.id)}
                          disabled={ignoreMutation.isPending}
                        >
                          {ignoreMutation.isPending ? "..." : <><X size={14} /> {t("ignoring")}</>}
                        </button>
                        <button
                          className="btn-add"
                          style={{ marginTop: 0, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => openOrderModal(prod)}
                        >
                          <Package size={16} /> {t("placeOrder")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Orders Section */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="inventory-card-header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)' }}>
          <div className="card-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={20} color="var(--accent)" /> {t("activeOrders")}
          </div>
        </div>
        
        {loading ? (
          <div className="empty-state">
            <p>{t("loading") || "Loading orders..."}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p>No active orders found.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t("name")}</th>
                  <th>{t("provider")}</th>
                  <th>{t("quantity")}</th>
                  <th>{t("expectedDate")}</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: Order, i: number) => (
                  <tr key={order.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <td>
                      <div className="product-name">{order.product.name}</div>
                      <div className="product-sku" style={{ fontSize: "0.75rem" }}>
                        {order.product.sku || "No SKU"}
                      </div>
                    </td>
                    <td>{order.providerName}</td>
                    <td><span className="quantity-badge stock-ok">{order.quantity}</span></td>
                    <td dir="ltr">{new Date(order.expectedDate).toLocaleDateString()}</td>
                    <td>
                      <span className="quantity-badge" style={{ background: "var(--accent-glow)", color: "var(--accent)" }}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{activeSuggestion ? t("placeOrder") : (isRTL ? "إنشاء طلب جديد" : "Create New Order")}</h3>
            
            <form onSubmit={handleOrderSubmit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>{t("product") || "Product"} *</label>
                {activeSuggestion ? (
                  <input type="text" value={activeSuggestion.name} disabled style={{ opacity: 0.6 }} />
                ) : (
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', color: 'var(--text-primary)', width: '100%' }}
                  >
                    <option value="">-- Select Product --</option>
                    {allProducts.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ""}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label htmlFor="provider-select">{t("provider")} *</label>
                <select
                  id="provider-select"
                  value={formProviderId}
                  onChange={(e) => {
                    const p = providerList.find((prov: any) => prov.id === e.target.value);
                    setFormProviderId(e.target.value);
                    setFormProviderName(p ? p.name : "");
                  }}
                  className={formErrors.providerName ? "select-error" : ""}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', color: 'var(--text-primary)', width: '100%' }}
                >
                  <option value="">-- Select Provider --</option>
                  {providerList.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} ({t(p.category || "other")})</option>
                  ))}
                </select>
                {formErrors.providerName && <span className="error-text">{formErrors.providerName}</span>}
              </div>

              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
                <div className="form-group">
                  <label htmlFor="expected-date">{t("expectedDate")} *</label>
                  <input
                    id="expected-date"
                    type="date"
                    value={formExpectedDate}
                    onChange={(e) => setFormExpectedDate(e.target.value)}
                    className={formErrors.expectedDate ? "input-error" : ""}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="order-qty">{t("quantity")} *</label>
                  <input
                    id="order-qty"
                    type="number"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className={formErrors.quantity ? "input-error" : ""}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label htmlFor="order-notes">{t("notes")}</label>
                <textarea
                  id="order-notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Add instructions..."
                  style={{ minHeight: '80px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsCreateModalOpen(false)}>{t("cancel")}</button>
                <button type="submit" className="btn-save" disabled={placeOrderMutation.isPending}>
                  {placeOrderMutation.isPending ? "..." : t("submitOrder")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
