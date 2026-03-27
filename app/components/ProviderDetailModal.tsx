"use client";

import React, { useState } from "react";
import { useI18n } from "./I18nProvider";
import { X, Calendar, Package, DollarSign, List, Filter, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
}

interface ProviderDetailModalProps {
  provider: Provider;
  isOpen: boolean;
  onClose: () => void;
}

export function ProviderDetailModal({ provider, isOpen, onClose }: ProviderDetailModalProps) {
  const { t, isRTL } = useI18n();
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["provider-orders", provider.id, dateFilter],
    queryFn: async () => {
      let url = `/api/providers/${provider.id}/orders`;
      const params = new URLSearchParams();
      if (dateFilter.start) params.append("startDate", dateFilter.start);
      if (dateFilter.end) params.append("endDate", dateFilter.end);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content detail-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '900px', width: '95%' }}
      >
        <div className="modal-header">
          <div className="header-info">
            <div className="provider-avatar">
              {provider.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2>{provider.name}</h2>
              <span className="category-badge">{t(provider.category || "other")}</span>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body custom-scrollbar">
          {/* Main Info Cards */}
          <div className="info-grid">
            <div className="info-card">
              <List size={18} className="text-accent" />
              <div>
                <label>{t("contactPerson")}</label>
                <p>{provider.contactName || "-"}</p>
              </div>
            </div>
            <div className="info-card">
              <Package size={18} className="text-accent" />
              <div>
                <label>{t("phoneNumber")}</label>
                <p>{provider.phone || "-"}</p>
              </div>
            </div>
            <div className="info-card">
              <ShoppingBag size={18} className="text-accent" />
              <div>
                <label>Email</label>
                <p>{provider.email || "-"}</p>
              </div>
            </div>
          </div>

          <div className="section-divider" />

          {/* Orders Section */}
          <div className="orders-section">
            <div className="section-header">
              <div className="flex-center-gap">
                <Calendar size={20} className="text-accent" />
                <h3>{t("orders")} History</h3>
              </div>
              
              <div className="filters">
                <div className="filter-group">
                  <Filter size={14} />
                  <input 
                    type="date" 
                    value={dateFilter.start} 
                    onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                    placeholder="Start Date"
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

            <div className="table-container mini-table">
              {isLoading ? (
                <div className="loading-state">
                  <div className="spinner-small" />
                </div>
              ) : orders.length === 0 ? (
                <div className="empty-orders">
                   <p>No orders found for this provider.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
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
                        <td className="qty-cell">{order.quantity}</td>
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
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" style={{ width: '100%' }} onClick={onClose}>
            {t("cancel")}
          </button>
        </div>

        <style jsx>{`
          .detail-modal {
            background: rgba(15, 15, 25, 0.9);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            max-height: 90vh;
            display: flex;
            flex-direction: column;
          }
          .custom-scrollbar {
            overflow-y: auto;
            padding: 24px;
          }
          .header-info {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .provider-avatar {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            background: linear-gradient(135deg, var(--accent), #4f46e5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            font-weight: 700;
            color: white;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          }
          .category-badge {
            font-size: 0.75rem;
            padding: 2px 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            color: var(--text-muted);
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }
          .info-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .info-card label {
            display: block;
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-bottom: 2px;
          }
          .info-card p {
            font-weight: 600;
            font-size: 0.9rem;
            margin: 0;
          }
          .section-divider {
            height: 1px;
            background: linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent);
            margin: 24px 0;
          }
          .flex-center-gap {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 16px;
          }
          .filters {
            display: flex;
            gap: 12px;
          }
          .filter-group {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(0, 0, 0, 0.2);
            padding: 6px 12px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 0.8rem;
          }
          .filter-group input {
            background: transparent;
            border: none;
            color: white;
            font-size: 0.8rem;
            outline: none;
          }
          .mini-table {
            background: rgba(255, 255, 255, 0.01);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.03);
            overflow: hidden;
          }
          .mini-table table {
            width: 100%;
            border-collapse: collapse;
          }
          .mini-table th {
            text-align: left;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.02);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
          }
          .mini-table td {
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.02);
            font-size: 0.85rem;
          }
          .mono-text {
            font-family: monospace;
            color: var(--accent);
          }
          .item-cell {
            display: flex;
            flex-direction: column;
          }
          .sku-tag {
            font-size: 0.7rem;
            color: var(--text-muted);
          }
          .qty-cell {
            font-weight: 700;
            color: var(--text-primary);
          }
          .status-tag {
            font-size: 0.7rem;
            padding: 2px 8px;
            border-radius: 999px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .status-tag.pending {
            background: rgba(245, 158, 11, 0.1);
            color: #f59e0b;
          }
          .status-tag.received {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
          }
          .loading-state, .empty-orders {
            padding: 40px;
            text-align: center;
            color: var(--text-muted);
          }
          .text-accent { color: var(--accent); }
          .modal-header {
            padding: 20px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .btn-close {
            background: rgba(255, 255, 255, 0.05);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-close:hover {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
          }
          .modal-footer {
            padding: 16px 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
          .btn-secondary {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            padding: 10px 20px;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
          }
        `}</style>
      </div>
    </div>
  );
}
