"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Order modal state
  const [activeSuggestion, setActiveSuggestion] = useState<Product | null>(null);
  const [formProviderName, setFormProviderName] = useState("");
  const [formExpectedDate, setFormExpectedDate] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await fetch("/api/orders/suggestions");
      const data = await res.json();
      setSuggestions(data);
    } catch {
      showToast("Failed to load suggestions.", "error");
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch {
      showToast("Failed to load active orders.", "error");
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSuggestions(), fetchOrders()]);
    setLoading(false);
  }, [fetchSuggestions, fetchOrders]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleIgnore = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}/ignore`, { method: "PATCH" });
      if (res.ok) {
        showToast("Suggestion ignored.");
        fetchSuggestions();
      } else {
        showToast("Failed to ignore suggestion.", "error");
      }
    } catch {
      showToast("An error occurred.", "error");
    }
  };

  const openOrderModal = (product: Product) => {
    setActiveSuggestion(product);
    setFormProviderName("");
    // default date to tomorrow
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

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: activeSuggestion.id,
          providerName: formProviderName.trim(),
          expectedDate: formExpectedDate,
          quantity: qty,
          notes: formNotes.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormErrors(data.errors || {});
        return;
      }

      setActiveSuggestion(null);
      fetchAll();
      showToast("Order placed successfully!");
    } catch {
      showToast("Failed to place order.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 0 }}>
      {/* Suggestions Section */}
      <div className="card" style={{ marginBottom: "32px", borderColor: "rgba(245, 158, 11, 0.3)" }}>
        <div className="card-title">
          <span className="icon">⚠️</span> Low Stock Suggestions
        </div>
        <p style={{ color: "var(--text-secondary)", marginBottom: "20px", fontSize: "0.9rem" }}>
          These items have less than 50 pieces in stock. You can order more or ignore the suggestion.
        </p>
        
        {loading ? (
          <div className="empty-state">
            <p>Loading suggestions...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>All Good!</h3>
            <p>No low stock items need restocking right now.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Current Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((prod, i) => (
                  <tr key={prod.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <td className="product-name">{prod.name}</td>
                    <td className="product-sku">{prod.sku || "—"}</td>
                    <td>
                      <span className="quantity-badge stock-low">{prod.quantity}</span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleIgnore(prod.id)}
                          title="Ignore this suggestion"
                        >
                          ❌ Ignore
                        </button>
                        <button
                          className="btn-icon"
                          style={{ color: "var(--success)", borderColor: "var(--success)" }}
                          onClick={() => openOrderModal(prod)}
                          title="Place order"
                        >
                          📦 Order
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
      <div className="card">
        <div className="card-title">
          <span className="icon">🚚</span> Active Orders
        </div>
        
        {loading ? (
          <div className="empty-state">
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Active Orders</h3>
            <p>Orders you place will appear here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Provider</th>
                  <th>Ordered Qty</th>
                  <th>Expected Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={order.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <td>
                      <div className="product-name">{order.product.name}</div>
                      <div className="product-sku" style={{ fontSize: "0.75rem", marginTop: "2px" }}>
                        {order.product.sku || "No SKU"}
                      </div>
                    </td>
                    <td>{order.providerName}</td>
                    <td>{order.quantity}</td>
                    <td>{new Date(order.expectedDate).toLocaleDateString()}</td>
                    <td>
                      <span className="quantity-badge" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--accent-hover)" }}>
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
            <h3>Place Order</h3>
            
            <form onSubmit={handleOrderSubmit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Item Name</label>
                <input
                  type="text"
                  value={activeSuggestion.name}
                  disabled
                  style={{ opacity: 0.7 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label htmlFor="provider-name">Provider Name *</label>
                <input
                  id="provider-name"
                  type="text"
                  value={formProviderName}
                  onChange={(e) => {
                    setFormProviderName(e.target.value);
                    if (formErrors.providerName) setFormErrors((p) => ({ ...p, providerName: undefined }));
                  }}
                  className={formErrors.providerName ? "input-error" : ""}
                  placeholder="e.g. Acme Supplier Inc."
                />
                <span className="error-text">{formErrors.providerName || ""}</span>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label htmlFor="expected-date">Date of Receiving Shipment *</label>
                <input
                  id="expected-date"
                  type="date"
                  value={formExpectedDate}
                  onChange={(e) => {
                    setFormExpectedDate(e.target.value);
                    if (formErrors.expectedDate) setFormErrors((p) => ({ ...p, expectedDate: undefined }));
                  }}
                  className={formErrors.expectedDate ? "input-error" : ""}
                />
                <span className="error-text">{formErrors.expectedDate || ""}</span>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label htmlFor="order-qty">Quantity *</label>
                <input
                  id="order-qty"
                  type="number"
                  min="1"
                  step="1"
                  value={formQuantity}
                  onChange={(e) => {
                    setFormQuantity(e.target.value);
                    if (formErrors.quantity) setFormErrors((p) => ({ ...p, quantity: undefined }));
                  }}
                  className={formErrors.quantity ? "input-error" : ""}
                />
                <span className="error-text">{formErrors.quantity || ""}</span>
              </div>

              <div className="form-group">
                <label htmlFor="order-notes">Notes</label>
                <textarea
                  id="order-notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional delivery instructions..."
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    padding: "11px 14px",
                    color: "var(--text-primary)",
                    fontFamily: "inherit",
                    minHeight: "80px",
                    resize: "vertical"
                  }}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setActiveSuggestion(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? "Placing Order..." : "Submit Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
