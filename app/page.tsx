"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  // Inventory filter state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Form state (Add Product)
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formQuantity, setFormQuantity] = useState("0");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

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

  // React Query: Fetch Products
  const { data: result, isLoading: loading } = useQuery({
    queryKey: ["products", search, page],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      query.set("page", String(page));
      query.set("limit", "10");
      const res = await fetch(`/api/products?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: !!user,
  });

  const products = result?.data || [];
  const totalPages = result?.meta?.totalPages || 1;
  const totalProducts = result?.meta?.total || 0;

  // Mutations
  const addMutation = useMutation({
    mutationFn: async (newProduct: any) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      if (!res.ok) {
        const data = await res.json();
        throw data.errors || { message: "Failed to add product" };
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setFormName("");
      setFormSku("");
      setFormQuantity("0");
      setFormErrors({});
      showToast("Product added successfully!");
    },
    onError: (err: any) => {
      setFormErrors(err);
      showToast("Failed to add product.", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw errorData.errors || { message: "Failed to update product" };
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditProduct(null);
      showToast("Product updated successfully!");
    },
    onError: (err: any) => {
      setEditErrors(err);
      showToast("Failed to update product.", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteProduct(null);
      showToast("Product deleted.");
    },
    onError: () => {
      showToast("Failed to delete product.", "error");
    },
  });

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

    addMutation.mutate({
      name: formName.trim(),
      sku: formSku.trim() || null,
      quantity: qty,
    });
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

    updateMutation.mutate({
      id: editProduct.id,
      data: {
        name: editName.trim(),
        sku: editSku.trim() || null,
        quantity: qty,
      },
    });
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    deleteMutation.mutate(deleteProduct.id);
  };

  const handleInlineQuantityChange = async (product: Product, delta: number) => {
    const newQty = product.quantity + delta;
    if (newQty < 0) return;

    updateMutation.mutate({
      id: product.id,
      data: { quantity: newQty },
    });
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
              disabled={addMutation.isPending}
              id="btn-add-product"
            >
              {addMutation.isPending ? "Adding..." : "Add"}
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
                <span>{totalProducts}</span> total
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
            <>
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
                    {products.map((product: Product, i: number) => (
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
              <div className="pagination-footer">
                <button 
                  className="btn-page" 
                  disabled={page <= 1 || loading}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Previous
                </button>
                <span className="page-info">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </span>
                <button 
                  className="btn-page" 
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next →
                </button>
              </div>
            </>
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
              <button className="btn-save" onClick={handleEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
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
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button className="btn-delete-confirm" onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
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
