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
      <table>
        <thead>
          <tr>
            <th>{t("name")}</th>
            <th>{t("barcode") || "Barcode"}</th>
            <th>{t("price") || "Price"}</th>
            <th>Margin</th>
            <th>{t("provider") || "Provider"}</th>
            <th>{t("quantity")}</th>

            <th>{t("actions")}</th>

          </tr>
        </thead>
        <tbody>
          {products.map((product, i) => (
            <tr key={product.id} style={{ animationDelay: `${i * 0.02}s` }}>
              <td className="product-name">{product.name}</td>
              <td className="product-sku">{product.barcode || product.sku || "—"}</td>
              <td className="product-price font-bold">${(product.price || 0).toFixed(2)}</td>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    color: product.profitMargin >= 30 ? '#10b981' : product.profitMargin >= 10 ? '#f59e0b' : '#ef4444' 
                  }}>
                    {product.profitMargin?.toFixed(1)}%
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    +${product.grossProfit?.toFixed(2)}/pc
                  </span>
                </div>
              </td>
              <td className="text-secondary" style={{ fontSize: '13px' }}>{product.provider?.name || "—"}</td>


              <td>
                <div className="quantity-controls">
                  <button
                    className="qty-btn qty-minus"
                    onClick={() => onQuantityChange(product, -1)}
                    disabled={product.quantity === 0}
                  >
                    −
                  </button>
                  <span className={`quantity-badge ${getStockClass(product.quantity)}`}>
                    {product.quantity} <span style={{ fontSize: '10px', opacity: 0.7 }}>{product.unit || "pcs"}</span>
                  </span>

                  <button
                    className="qty-btn qty-plus"
                    onClick={() => onQuantityChange(product, 1)}
                  >
                    +
                  </button>
                </div>
              </td>
              <td>
                <div className="actions">
                  <button className="btn-icon" onClick={() => onEdit(product)}>
                    <Edit2 size={16} /> {t("edit")}
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => onDelete(product)}>
                    <Trash2 size={16} /> {t("delete")}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
