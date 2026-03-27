"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "../../components/I18nProvider";
import { AddProviderModal } from "../../components/AddProviderModal";
import { 
  ArrowLeft, 
  Calendar, 
  Package, 
  List, 
  Filter, 
  ShoppingBag, 
  Mail, 
  Phone, 
  User as UserIcon,
  Tag,
  Clock,
  Edit,
  Power,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  price: number;
  unit: string;
}

interface Order {
  id: string;
  productId: string;
  product: {
    name: string;
    sku: string | null;
  };
  quantity: number;
  expectedDate: string;
  createdAt: string;
  status: string;
  notes: string | null;
}

interface Provider {
  id: string;
  name: string;
  category: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  products: Product[];
}

export default function ProviderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, isRTL } = useI18n();
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: provider, isLoading: loadingProvider } = useQuery<Provider>({
    queryKey: ["provider", id],
    queryFn: async () => {
      const res = await fetch(`/api/providers/${id}`);
      if (!res.ok) throw new Error("Provider not found");
      return res.json();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/providers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider", id] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery<Order[]>({
    queryKey: ["provider-orders", id, dateFilter],
    queryFn: async () => {
      let url = `/api/providers/${id}/orders`;
      const params = new URLSearchParams();
      if (dateFilter.start) params.append("startDate", dateFilter.start);
      if (dateFilter.end) params.append("endDate", dateFilter.end);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed up to fetch orders");
      return res.json();
    },
  });

  if (loadingProvider) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="error-container">
        <h2>{t("noProviders") || "Provider not found"}</h2>
        <button className="btn-secondary" onClick={() => router.push("/providers")}>
          <ArrowLeft size={16} /> {t("back") || "Go Back"}
        </button>
      </div>
    );
  }

  const toggleStatus = () => {
    const nextStatus = provider.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    statusMutation.mutate(nextStatus);
  };

  return (
    <div className="provider-detail-page">
      <header className="detail-header">
        <div className="header-top">
          <button className="btn-back haptic-btn" onClick={() => router.push("/providers")}>
            <ArrowLeft size={18} /> {isRTL ? "العودة" : "Back"}
          </button>
          
          <div className="header-actions">
            <button 
              className={`btn-status haptic-btn ${provider.status === "ACTIVE" ? 'active' : 'inactive'}`}
              onClick={toggleStatus}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? "..." : (
                <>
                  {provider.status === "ACTIVE" ? <XCircle size={16} /> : <CheckCircle size={16} />}
                  {provider.status === "ACTIVE" ? (isRTL ? "تعطيل" : "Deactivate") : (isRTL ? "تفعيل" : "Activate")}
                </>
              )}
            </button>
            <button className="btn-edit haptic-btn" onClick={() => setIsEditModalOpen(true)}>
              <Edit size={16} /> {t("edit")}
            </button>
          </div>
        </div>
        <div className="header-main">
          <div className="provider-avatar-large">
            {provider.name.charAt(0).toUpperCase()}
          </div>
          <div className="header-text">
            <h1 className="t-gradient">{provider.name}</h1>
            <span className="category-tag">{t(provider.category || "other")}</span>
          </div>
          <div className={`status-badge ${provider.status.toLowerCase()}`}>
            {t(provider.status.toLowerCase())}
          </div>
        </div>
      </header>

      <div className="detail-grid">
        {/* Sidebar: Details */}
        <aside className="detail-sidebar">
          <div className="card glass-card info-card">
            <h3>{t("contactPerson") || "Provider Info"}</h3>
            <div className="info-list">
              <div className="info-item">
                <UserIcon size={16} className="text-secondary" />
                <div>
                  <label>{t("contactPerson")}</label>
                  <p>{provider.contactName || "-"}</p>
                </div>
              </div>
              <div className="info-item">
                <Mail size={16} className="text-secondary" />
                <div>
                  <label>Email</label>
                  <p>{provider.email || "-"}</p>
                </div>
              </div>
              <div className="info-item">
                <Phone size={16} className="text-secondary" />
                <div>
                  <label>{t("phoneNumber")}</label>
                  <p>{provider.phone || "-"}</p>
                </div>
              </div>
              <div className="info-item">
                <Tag size={16} className="text-secondary" />
                <div>
                  <label>{t("category")}</label>
                  <p>{t(provider.category || "other")}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card glass-card metrics-card">
            <div className="metric">
              <span className="metric-label">Total Products</span>
              <span className="metric-value">{provider.products.length}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Total Orders</span>
              <span className="metric-value">{orders.length}</span>
            </div>
          </div>
        </aside>

        {/* Main Content: Tabs / Lists */}
        <main className="detail-main-content">
          {/* Linked Products (Item List) */}
          <div className="card glass-card">
            <div className="section-header">
              <div className="flex-center-gap">
                <Package size={20} className="text-accent" />
                <h2>Items from this provider</h2>
              </div>
            </div>
            
            <div className="table-container">
              {provider.products.length === 0 ? (
                <div className="empty-state-mini">
                  <p>No products linked to this provider yet.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>{t("name")}</th>
                      <th>{t("sku")}</th>
                      <th>{t("quantity")}</th>
                      <th>{t("price")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {provider.products.map(product => (
                      <tr key={product.id}>
                        <td className="font-semibold">{product.name}</td>
                        <td className="text-muted">{product.sku || "—"}</td>
                        <td>
                          <span className={`qty-indicator ${product.quantity < 10 ? 'low' : ''}`}>
                            {product.quantity} {product.unit}
                          </span>
                        </td>
                        <td>${product.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div style={{ height: '32px' }} />

          {/* Historical Orders */}
          <div className="card glass-card">
            <div className="section-header">
              <div className="flex-center-gap">
                <Clock size={20} className="text-accent" />
                <h2>Order History</h2>
              </div>
              
              <div className="filters">
                <div className="filter-group">
                  <Filter size={14} />
                  <input 
                    type="date" 
                    value={dateFilter.start} 
                    onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                  />
                  <span>to</span>
                  <input 
                    type="date" 
                    value={dateFilter.end} 
                    onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="table-container">
              {loadingOrders ? (
                <div className="spinner-center"><div className="spinner-small" /></div>
              ) : orders.length === 0 ? (
                <div className="empty-state-mini">
                  <p>No historical orders found.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Item</th>
                      <th>Date</th>
                      <th>Qty</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td className="mono-text">{order.id.slice(0, 8)}</td>
                        <td>
                          <div className="item-cell">
                            <span className="item-name">{order.product.name}</span>
                            <span className="sku-tag">{order.product.sku}</span>
                          </div>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="font-bold">{order.quantity}</td>
                        <td>
                          <span className={`status-tag ${order.status.toLowerCase()}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      <AddProviderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["provider", id] });
        }}
        initialData={provider}
      />

      <style jsx>{`
        .provider-detail-page {
          animation: fadeIn 0.4s ease-out;
          display: flex;
          flex-direction: column;
          gap: 32px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          padding-bottom: 60px;
        }
        .detail-header {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-actions {
          display: flex;
          gap: 12px;
        }
        .btn-status, .btn-edit {
          padding: 8px 16px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-status.active {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .btn-status.inactive {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .btn-edit {
          background: rgba(var(--accent-rgb), 0.1);
          color: var(--accent);
          border: 1px solid rgba(var(--accent-rgb), 0.2);
        }
        .btn-status:hover, .btn-edit:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
        }
        .btn-back {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          padding: 8px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          cursor: pointer;
        }
        .header-main {
          display: flex;
          align-items: center;
          gap: 24px;
          background: rgba(255, 255, 255, 0.02);
          padding: 24px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .provider-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 24px;
          background: linear-gradient(135deg, var(--accent), #4f46e5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 800;
          color: white;
          box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
        }
        .header-text h1 {
          margin: 0 0 4px 0;
          font-size: 2rem;
        }
        .category-tag {
          font-size: 0.85rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 12px;
          border-radius: 8px;
        }
        .status-badge {
          margin-left: auto;
          padding: 6px 16px;
          border-radius: 12px;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.05em;
        }
        .status-badge.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-badge.inactive { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .detail-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 32px;
        }
        .detail-sidebar {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .glass-card {
          background: rgba(15, 15, 25, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 24px;
        }
        .info-card h3 {
          margin-bottom: 20px;
          font-size: 1.1rem;
        }
        .info-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .info-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .info-item label {
          display: block;
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-bottom: 2px;
        }
        .info-item p {
          font-size: 0.95rem;
          font-weight: 500;
          margin: 0;
        }
        .metrics-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          text-align: center;
        }
        .metric-label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .metric-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--accent);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .flex-center-gap {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .section-header h2 {
          font-size: 1.25rem;
          margin: 0;
        }
        .table-container {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          text-align: left;
          padding: 12px 16px;
          color: var(--text-muted);
          font-size: 0.8rem;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        td {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          font-size: 0.95rem;
        }
        .qty-indicator {
          font-weight: 600;
        }
        .qty-indicator.low { color: #f59e0b; }
        
        .filters {
          display: flex;
          gap: 12px;
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.03);
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 0.85rem;
        }
        .filter-group input {
          background: transparent;
          border: none;
          color: white;
          outline: none;
          font-size: 0.85rem;
        }

        .status-tag {
          font-size: 0.75rem;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
        }
        .status-tag.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .status-tag.received { background: rgba(16, 185, 129, 0.1); color: #10b981; }

        .mono-text { font-family: monospace; color: var(--accent); }
        .empty-state-mini {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
        }
        .spinner-center { padding: 40px; display: flex; justify-content: center; }

        @media (max-width: 1000px) {
          .detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
