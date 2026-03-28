"use client";

import { Product } from "../page";
import { useI18n } from "./I18nProvider";
import { Edit2, Trash2 } from "lucide-react";

interface ProductTableProps {
  products: any[];
  loading: boolean;
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
  onQuantityChange: (product: any, delta: number) => void;
  getStockClass: (qty: number) => string;
}

export function ProductTable({
  products,
  loading,
  onEdit,
  onDelete,
  onQuantityChange,
  getStockClass,
}: ProductTableProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="empty-state">
        <p>Loading products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h3>No products found</h3>
        <p>Try adjusting your search or add a new product.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
        <thead>
          <tr>
            <th style={{ background: 'transparent', border: 'none' }}>{t("name")}</th>
            <th style={{ background: 'transparent', border: 'none' }}>SKU / Barcode</th>
            <th style={{ background: 'transparent', border: 'none' }}>Last Purchasing</th>
            <th style={{ background: 'transparent', border: 'none' }}>Last Selling</th>
            <th style={{ background: 'transparent', border: 'none' }}>{t("quantity")}</th>
            <th style={{ background: 'transparent', border: 'none' }}>{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, i) => (
            <tr key={product.id} className="bento-card-row" style={{ animationDelay: `${i * 0.02}s` }}>
              <td style={{ border: 'none' }}>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{product.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                   {product.provider?.name || "No Supplier Linked"}
                </div>
              </td>
              <td style={{ border: 'none' }}>
                <code style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                  {product.sku || product.barcode || "—"}
                </code>
              </td>
              <td style={{ border: 'none' }}>
                <div style={{ fontWeight: 600 }}>${(product.purchasePrice || 0).toFixed(2)}</div>
                <div style={{ fontSize: '10px', opacity: 0.6 }}>Per {product.unit}</div>
              </td>
              <td style={{ border: 'none' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent)' }}>${(product.price || 0).toFixed(2)}</div>
                <div style={{ fontSize: '10px', opacity: 0.6 }}>Retail Unit</div>
              </td>
              <td style={{ border: 'none' }}>
                <div className="quantity-controls">
                  <button
                    className="qty-btn qty-minus"
                    onClick={() => onQuantityChange(product, -1)}
                    disabled={product.quantity === 0}
                  >
                    −
                  </button>
                  <span className={`quantity-badge ${product.quantity > 0 ? "status-mint" : "status-wasabi"}`}>
                    {product.quantity > 0 ? "IN STOCK" : "OUT OF STOCK"}
                    <span style={{ marginLeft: '8px', opacity: 0.8, fontSize: '11px' }}>
                      ({product.quantity} {product.unit})
                    </span>
                  </span>
                  <button
                    className="qty-btn qty-plus"
                    onClick={() => onQuantityChange(product, 1)}
                  >
                    +
                  </button>
                </div>
              </td>
              <td style={{ border: 'none', textAlign: 'right' }}>
                <div className="actions">
                  <button className="btn-icon" onClick={() => onEdit(product)}>
                    <Edit2 size={14} />
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => onDelete(product)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .bento-card-row {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.2s ease;
        }
        .bento-card-row:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: scale(1.002) translateX(4px);
          border-color: rgba(99, 91, 255, 0.2);
        }
        td {
          padding: 16px !important;
        }
        tr:hover td {
           color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
