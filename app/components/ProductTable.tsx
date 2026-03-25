"use client";

import { Product } from "../page";
import { useI18n } from "./I18nProvider";

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
            <th>{t("sku")}</th>
            <th>{t("quantity")}</th>
            <th>{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, i) => (
            <tr key={product.id} style={{ animationDelay: `${i * 0.02}s` }}>
              <td className="product-name">{product.name}</td>
              <td className="product-sku">{product.sku || "—"}</td>
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
                    {product.quantity}
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
                    ✏️ {t("edit")}
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => onDelete(product)}>
                    🗑️ {t("delete")}
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
