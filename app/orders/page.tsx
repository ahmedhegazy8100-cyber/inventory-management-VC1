"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "./../components/I18nProvider";
import { AlertCircle, Truck, Package, X, CheckCircle2 } from "lucide-react";
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
  const [formExpectedDate, setFormExpectedDate] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

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
      setActiveSuggestion(null);
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
    setFormProviderName("");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormExpectedDate(tomorrow.toISOString().split("T")[0]);
    setFormQuantity("50");
    setFormNotes("");
    setFormErrors({});
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSuggestion) return;

    const errors: FormErrors = {};
    if (!formProviderName.trim()) errors.providerName = "Provider name is required.";
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
      productId: activeSuggestion.id,
      providerName: formProviderName.trim(),
      expectedDate: formExpectedDate,
      quantity: qty,
      notes: formNotes.trim(),
    });
  };

  return (
    <div className="page-fade-in">
      <header className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Truck size={28} color="var(--accent)" />
            {t("orders") || "Orders Management"}
          </h1>
          <p className="text-secondary">{t("manageShipments") || "Track and restock your inventory"}</p>
        </div>
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
      {activeSuggestion && (
        <div className="modal-overlay" onClick={() => setActiveSuggestion(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t("placeOrder")}</h3>
            
            <form onSubmit={handleOrderSubmit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>{t("product") || "Product"}</label>
                <input type="text" value={activeSuggestion.name} disabled style={{ opacity: 0.6 }} />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label htmlFor="provider-name">{t("provider")} *</label>
                <input
                  id="provider-name"
                  type="text"
                  value={formProviderName}
                  onChange={(e) => setFormProviderName(e.target.value)}
                  className={formErrors.providerName ? "input-error" : ""}
                  placeholder="e.g. Acme Logistics"
                />
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
                <button type="button" className="btn-cancel" onClick={() => setActiveSuggestion(null)}>{t("cancel")}</button>
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
