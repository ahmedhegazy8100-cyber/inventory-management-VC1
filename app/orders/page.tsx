"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "./../components/I18nProvider";
import { AlertCircle, Truck, Package, X, CheckCircle2, Plus, Calculator, Calendar, DollarSign, TrendingUp } from "lucide-react";
import "./../globals.css";
import { SearchableSelect } from "./../components/SearchableSelect";
import { calculateUnitCost } from "./../../lib/normalization";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  unit?: string;
  piecesPerUnit?: number;
}

interface Order {
  id: string;
  productId: string;
  providerName: string;
  expectedDate: string;
  expiryDate?: string | null;
  quantity: number;
  unitType?: string | null;
  unitQuantity?: number | null;
  piecesPerUnit?: number | null;
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
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formUnitQuantity, setFormUnitQuantity] = useState("1");
  const [formUnitType, setFormUnitType] = useState("Piece");
  const [formPiecesPerUnit, setFormPiecesPerUnit] = useState("1");
  const [formTotalCost, setFormTotalCost] = useState("0");
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
    setFormExpiryDate("");
    setFormUnitQuantity("1");
    setFormUnitType(product.unit || "Piece");
    setFormPiecesPerUnit(String((product as any).piecesPerUnit || 1));
    setFormTotalCost("0");
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
    setFormExpiryDate("");
    setFormUnitQuantity("1");
    setFormUnitType("Piece");
    setFormPiecesPerUnit("1");
    setFormTotalCost("0");
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
    
    const unitQty = Number(formUnitQuantity);
    if (isNaN(unitQty) || unitQty <= 0) {
      errors.quantity = "Unit quantity must be positive.";
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
      expiryDate: formExpiryDate || null,
      unitQuantity: unitQty,
      unitType: formUnitType,
      piecesPerUnit: Number(formPiecesPerUnit),
      totalCost: Number(formTotalCost),
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
                    <td>
                      <div className="quantity-badge stock-ok" style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start', background: 'transparent', padding: 0 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {order.unitQuantity || order.quantity} {order.unitType || 'Piece'}
                        </span>
                        {order.unitType && order.unitType !== 'Piece' && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            ({order.quantity} total pieces)
                          </span>
                        )}
                      </div>
                    </td>
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
                  <input type="text" value={`${activeSuggestion.name} ${activeSuggestion.sku ? `(${activeSuggestion.sku})` : ""}`} disabled style={{ opacity: 0.6 }} />
                ) : (
                  <SearchableSelect
                    options={allProducts.map((p: any) => ({
                      id: p.id,
                      label: p.name,
                      sublabel: p.sku || undefined
                    }))}
                    value={selectedProductId}
                    onChange={(id) => {
                      setSelectedProductId(id);
                      const p = allProducts.find((prod: any) => prod.id === id);
                      if (p) {
                        setFormUnitType(p.unit || "Piece");
                        setFormPiecesPerUnit(String(p.piecesPerUnit || 1));
                      }
                    }}
                    placeholder="Search product by name or SKU..."
                  />
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>{t("provider") || "Provider"} *</label>
                <SearchableSelect
                  options={providerList.map((p: any) => ({
                    id: p.id,
                    label: p.name,
                    sublabel: t(p.category || "other")
                  }))}
                  value={formProviderId}
                  onChange={(id) => {
                    const p = providerList.find((prov: any) => prov.id === id);
                    setFormProviderId(id);
                    setFormProviderName(p ? p.name : "");
                  }}
                  placeholder="Search provider..."
                  error={formErrors.providerName}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', marginBottom: 16, alignItems: 'end' }}>
                <div className="form-group">
                  <label>Quantity Unit *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formUnitQuantity}
                    onChange={(e) => setFormUnitQuantity(e.target.value)}
                    className={formErrors.quantity ? "input-error" : ""}
                  />
                </div>
                <div className="form-group">
                  <label>Unit Type</label>
                  <select
                    value={formUnitType}
                    onChange={(e) => setFormUnitType(e.target.value)}
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', color: 'var(--text-primary)', width: '100%' }}
                  >
                    <option value="Piece">Piece</option>
                    <option value="KG">KG</option>
                    <option value="Carton">Carton</option>
                    <option value="Shrenk">Shrenk</option>
                    <option value="Box">Box</option>
                    <option value="Bag">Bag</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Pcs/Unit</label>
                  <input
                    type="number"
                    value={formPiecesPerUnit}
                    onChange={(e) => setFormPiecesPerUnit(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Total Order Cost ($) *</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="number"
                    step="0.01"
                    style={{ paddingLeft: '36px' }}
                    value={formTotalCost}
                    onChange={(e) => setFormTotalCost(e.target.value)}
                    placeholder="Enter total price for this order"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '12px', marginBottom: 16 }}>
                <div className="info-alert" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calculator size={18} color="var(--text-muted)" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Pieces</span>
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {Math.round(Number(formUnitQuantity || 0) * Number(formPiecesPerUnit || 1))}
                    </span>
                  </div>
                </div>
                <div className="info-alert" style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent)', padding: '12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="var(--accent)" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 600 }}>Est. Unit Cost</span>
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      ${calculateUnitCost(Number(formTotalCost || 0), Number(formUnitQuantity || 0), Number(formPiecesPerUnit || 1)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 24 }}>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> Expected Delivery *
                  </label>
                  <input
                    type="date"
                    value={formExpectedDate}
                    onChange={(e) => setFormExpectedDate(e.target.value)}
                    className={formErrors.expectedDate ? "input-error" : ""}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
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
