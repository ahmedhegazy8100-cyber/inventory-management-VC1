"use client";

import { useState, useEffect, useCallback } from "react";
import "./globals.css";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

interface FormErrors {
  name?: string;
  quantity?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);

  // Inventory state
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Form state (Add Product)
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formQuantity, setFormQuantity] = useState("0");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [adding, setAdding] = useState(false);

  // Edit modal
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editErrors, setEditErrors] = useState<FormErrors>({});

  // Delete modal
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      setUser(null);
    } finally {
      setLoadingApp(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.href = "/login";
    } catch {
      showToast("Error logging out", "error");
    }
  };

  const fetchProducts = useCallback(async () => {
    if (!user) return; // Only fetch if logged in
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/products${params}`);
      const data = await res.json();
      setProducts(data);
    } catch {
      showToast("Failed to load products.", "error");
    } finally {
      setLoading(false);
    }
  }, [search, user]);

  useEffect(() => {
    if (user) {
      const debounce = setTimeout(() => {
        fetchProducts();
      }, 250);
      return () => clearTimeout(debounce);
    }
  }, [fetchProducts, user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: FormErrors = {};

    if (!formName.trim()) errors.name = "Product name is required.";
    const qty = Number(formQuantity);
    if (isNaN(qty) || !Number.isInteger(qty))
      errors.quantity = "Must be a whole number.";
    else if (qty < 0) errors.quantity = "Cannot be negative.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          sku: formSku.trim() || null,
          quantity: qty,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormErrors(data.errors || {});
        return;
      }

      setFormName("");
      setFormSku("");
      setFormQuantity("0");
      setFormErrors({});
      fetchProducts();
      showToast("Product added successfully!");
    } catch {
      showToast("Failed to add product.", "error");
    } finally {
      setAdding(false);
    }
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setEditName(product.name);
    setEditSku(product.sku || "");
    setEditQuantity(String(product.quantity));
    setEditErrors({});
  };

  const handleEdit = async () => {
    if (!editProduct) return;
    const errors: FormErrors = {};

    if (!editName.trim()) errors.name = "Name cannot be empty.";
    const qty = Number(editQuantity);
    if (isNaN(qty) || !Number.isInteger(qty))
      errors.quantity = "Must be a whole number.";
    else if (qty < 0) errors.quantity = "Cannot be negative.";

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    try {
      const res = await fetch(`/api/products/${editProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          sku: editSku.trim() || null,
          quantity: qty,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setEditErrors(data.errors || {});
        return;
      }

      setEditProduct(null);
      fetchProducts();
      showToast("Product updated successfully!");
    } catch {
      showToast("Failed to update product.", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;

    try {
      await fetch(`/api/products/${deleteProduct.id}`, { method: "DELETE" });
      setDeleteProduct(null);
      fetchProducts();
      showToast("Product deleted.");
    } catch {
      showToast("Failed to delete product.", "error");
    }
  };

  const handleInlineQuantityChange = async (product: Product, delta: number) => {
    const newQty = product.quantity + delta;
    if (newQty < 0) return;

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, quantity: newQty } : p))
    );

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });

      if (!res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, quantity: product.quantity } : p
          )
        );
        showToast("Failed to update quantity.", "error");
      }
    } catch {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, quantity: product.quantity } : p
        )
      );
      showToast("Failed to update quantity.", "error");
    }
  };

  const getStockClass = (qty: number) => {
    if (qty === 0) return "stock-out";
    if (qty <= 20) return "stock-low";
    return "stock-ok";
  };

  if (loadingApp) {
    return (
      <div className="container" style={{ paddingTop: 64, textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading inventory application...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Middleware will redirect, but just in case
  }

  return (
    <div className="container" style={{ paddingTop: 0 }}>
      {/* Banner */}
      <div className="user-banner">
        <span className="user-greeting">Welcome back, <strong>{user.name}</strong></span>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>

      {/* Add Product Card */}
      <div className="card">
        <div className="card-title">
          <span className="icon">➕</span> Add Product
        </div>
        <form onSubmit={handleAdd}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="add-name">Name *</label>
              <input
                id="add-name"
                type="text"
                placeholder="Product name"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (formErrors.name) setFormErrors((p) => ({ ...p, name: undefined }));
                }}
                className={formErrors.name ? "input-error" : ""}
              />
              <span className="error-text">{formErrors.name || ""}</span>
            </div>
            <div className="form-group">
              <label htmlFor="add-sku">SKU</label>
              <input
                id="add-sku"
                type="text"
                placeholder="Optional SKU"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
              />
              <span className="error-text"></span>
            </div>
            <div className="form-group">
              <label htmlFor="add-quantity">Quantity</label>
              <input
                id="add-quantity"
                type="number"
                min="0"
                step="1"
                value={formQuantity}
                onChange={(e) => {
                  setFormQuantity(e.target.value);
                  if (formErrors.quantity)
                    setFormErrors((p) => ({ ...p, quantity: undefined }));
                }}
                className={formErrors.quantity ? "input-error" : ""}
              />
              <span className="error-text">{formErrors.quantity || ""}</span>
            </div>
            <button
              type="submit"
              className="btn-add"
              disabled={adding}
              id="btn-add-product"
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>

      {/* Inventory Table Card */}
      <div className="inventory-section">
        <div className="card">
          <div className="inventory-header">
            <div className="card-title" style={{ marginBottom: 0 }}>
              <span className="icon">📋</span> Inventory
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span className="product-count">
                <span>{products.length}</span> product
                {products.length !== 1 ? "s" : ""}
              </span>
              <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  id="search-input"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <p>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>
                {search ? "No products match your search" : "No products yet"}
              </h3>
              <p>
                {search
                  ? "Try adjusting your search term."
                  : "Add your first product using the form above."}
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, i) => (
                    <tr
                      key={product.id}
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <td className="product-name">{product.name}</td>
                      <td className="product-sku">
                        {product.sku || "—"}
                      </td>
                      <td>
                        <div className="quantity-controls">
                          <button
                            className="qty-btn qty-minus"
                            onClick={() => handleInlineQuantityChange(product, -1)}
                            disabled={product.quantity === 0}
                            title="Decrease quantity"
                            id={`qty-minus-${product.id}`}
                          >
                            −
                          </button>
                          <span
                            className={`quantity-badge ${getStockClass(
                              product.quantity
                            )}`}
                          >
                            {product.quantity}
                          </span>
                          <button
                            className="qty-btn qty-plus"
                            onClick={() => handleInlineQuantityChange(product, 1)}
                            title="Increase quantity"
                            id={`qty-plus-${product.id}`}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            className="btn-icon"
                            onClick={() => openEdit(product)}
                            title="Edit product"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => setDeleteProduct(product)}
                            title="Delete product"
                          >
                            🗑️ Delete
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
      </div>

      {/* Edit Modal */}
      {editProduct && (
        <div className="modal-overlay" onClick={() => setEditProduct(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Product</h3>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label htmlFor="edit-name">Name *</label>
              <input
                id="edit-name"
                type="text"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  if (editErrors.name)
                    setEditErrors((p) => ({ ...p, name: undefined }));
                }}
                className={editErrors.name ? "input-error" : ""}
              />
              <span className="error-text">{editErrors.name || ""}</span>
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label htmlFor="edit-sku">SKU</label>
              <input
                id="edit-sku"
                type="text"
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-quantity">Quantity</label>
              <input
                id="edit-quantity"
                type="number"
                min="0"
                step="1"
                value={editQuantity}
                onChange={(e) => {
                  setEditQuantity(e.target.value);
                  if (editErrors.quantity)
                    setEditErrors((p) => ({ ...p, quantity: undefined }));
                }}
                className={editErrors.quantity ? "input-error" : ""}
              />
              <span className="error-text">{editErrors.quantity || ""}</span>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setEditProduct(null)}
              >
                Cancel
              </button>
              <button className="btn-save" onClick={handleEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteProduct && (
        <div className="modal-overlay" onClick={() => setDeleteProduct(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Product</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: 4 }}>
              Are you sure you want to delete{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {deleteProduct.name}
              </strong>
              ?
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setDeleteProduct(null)}
              >
                Cancel
              </button>
              <button className="btn-delete-confirm" onClick={handleDelete}>
                Delete
              </button>
            </div>
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
