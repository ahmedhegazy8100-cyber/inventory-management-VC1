"use client";

import { Edit2 } from "lucide-react";

interface InventoryTableProps {
  products: any[];
  loading: boolean;
  onQuantityChange: (product: any, delta: number) => void;
  onManageBarcode: (product: any) => void;
}

export function InventoryTable({
  products,
  loading,
  onQuantityChange,
  onManageBarcode,
}: InventoryTableProps) {
  
  if (loading) return <div className="p-8 text-center text-muted">Loading stock levels...</div>;
  
  if (products.length === 0) return (
    <div style={{ padding: '64px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
      <h3 style={{ color: 'var(--text-secondary)' }}>Empty Stock</h3>
      <p style={{ color: 'var(--text-muted)' }}>No items found in active inventory.</p>
    </div>
  );

  return (
    <div className="table-wrapper">
      <table style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
        <thead>
          <tr>
            <th style={{ background: 'transparent', border: 'none' }}>Live Product</th>
            <th style={{ background: 'transparent', border: 'none' }}>Identfier / Barcode</th>
            <th style={{ background: 'transparent', border: 'none' }}>Availability Status</th>
            <th style={{ background: 'transparent', border: 'none' }}>Current Stock</th>
            <th style={{ background: 'transparent', border: 'none', textAlign: 'right' }}>Ops</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, i) => (
            <tr key={product.id} className="bento-card-row" style={{ animationDelay: `${i * 0.02}s` }}>
              <td style={{ border: 'none' }}>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{product.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{product.unit} Unit</div>
              </td>
              <td style={{ border: 'none' }}>
                <code style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                  {product.barcode || "NO BARCODE"}
                </code>
              </td>
              <td style={{ border: 'none' }}>
                <span className={`quantity-badge ${product.quantity > 0 ? "status-mint" : "status-wasabi"}`}>
                  {product.quantity > 0 ? "IN STOCK" : "OUT OF STOCK"}
                </span>
              </td>
              <td style={{ border: 'none' }}>
                <div className="quantity-controls">
                  <button className="qty-btn qty-minus" onClick={() => onQuantityChange(product, -1)} disabled={product.quantity <= 0}>−</button>
                  <span style={{ fontWeight: 800, minWidth: '40px', textAlign: 'center' }}>{product.quantity}</span>
                  <button className="qty-btn qty-plus" onClick={() => onQuantityChange(product, 1)}>+</button>
                </div>
              </td>
              <td style={{ border: 'none', textAlign: 'right' }}>
                <button className="btn-icon" onClick={() => onManageBarcode(product)}>
                  <Edit2 size={14} /> Barcode
                </button>
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
          transform: translateX(4px);
        }
        td { padding: 16px !important; }
      `}</style>
    </div>
  );
}
