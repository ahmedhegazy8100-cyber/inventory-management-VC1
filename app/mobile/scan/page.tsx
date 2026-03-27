"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { InstallBanner } from "../components/InstallBanner";

// ─── Zod schemas ──────────────────────────────────────────────────────────────
const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  unit: z.string(),
});
const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      price: z.number().nonnegative(),
    })
  ).min(1),
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface CartItem {
  productId: string;
  name: string;
  barcode: string | null;
  price: number;
  quantity: number;
  unit: string;
  stock: number; // remaining stock at time of scan
}

type AlertKind = "wasabi" | "success" | "info" | "error";
interface Alert { message: string; kind: AlertKind; }

// ─── Haptic helpers ───────────────────────────────────────────────────────────
const vibrate = (pattern: number | number[]) => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

// ─── API calls ────────────────────────────────────────────────────────────────
async function lookupBarcode(barcode: string) {
  const res = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`);
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (!res.ok) throw new Error("LOOKUP_ERROR");
  const { product } = await res.json();
  return product as {
    id: string; name: string; barcode: string | null;
    price: number; quantity: number; unit: string;
  };
}

async function postSale(items: { productId: string; quantity: number; price: number }[]) {
  const res = await fetch("/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Checkout failed");
  return data;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MobileScanPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scannerRef = useRef<any>(null);
  const readerDivRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState<"scan" | "cart">("scan");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [successGlow, setSuccessGlow] = useState(false);
  const [scannerKey, setScannerKey] = useState(0); // re-mount scanner

  // ─── Alert helper ────────────────────────────────────────────────────────
  const showAlert = useCallback((message: string, kind: AlertKind, ms = 3500) => {
    setAlert({ message, kind });
    setTimeout(() => setAlert(null), ms);
  }, []);

  // ─── Scanner init ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== "scan") return;

    let scanner: any;
    let active = true;

    const initScanner = async () => {
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      if (!active) return;
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 15,
          qrbox: { width: 260, height: 180 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
        },
        false
      );
      scannerRef.current = scanner;

      scanner.render(
        async (decoded: string) => {
          if (lookingUp) return;
          scanner.pause(true);
          await handleBarcodeScan(decoded);
          if (active) scanner.resume();
        },
        () => {}
      );
    };

    initScanner();
    return () => {
      active = false;
      if (scanner) scanner.clear().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, scannerKey]);

  // ─── Barcode scan handler ─────────────────────────────────────────────────
  const handleBarcodeScan = async (barcode: string) => {
    setLookingUp(true);
    try {
      const product = await lookupBarcode(barcode);

      // Out-of-stock guard — Wasabi alert
      if (product.quantity <= 0) {
        vibrate([80, 40, 80, 40, 80]);
        showAlert(`⚠ Out of stock: ${product.name}`, "wasabi");
        setLookingUp(false);
        return;
      }

      // Check how much we already have in cart vs stock
      const inCart = cart.find((i) => i.productId === product.id);
      const cartQty = inCart ? inCart.quantity : 0;
      if (cartQty >= product.quantity) {
        vibrate([80, 40, 80]);
        showAlert(`⚠ Maximum stock reached for ${product.name}`, "wasabi");
        setLookingUp(false);
        return;
      }

      // Validate with Zod
      const parsed = cartItemSchema.safeParse({
        productId: product.id,
        quantity: 1,
        price: product.price,
        unit: product.unit,
      });
      if (!parsed.success) {
        showAlert("Invalid product data", "error");
        setLookingUp(false);
        return;
      }

      // Add to cart
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            barcode: product.barcode,
            price: product.price,
            quantity: 1,
            unit: product.unit,
            stock: product.quantity,
          },
        ];
      });
      vibrate([30, 20, 60]);
      showAlert(`✓ Added: ${product.name}`, "success", 1800);
    } catch (err: any) {
      if (err.message === "NOT_FOUND") {
        vibrate([80, 40, 80]);
        showAlert("Product not found for this barcode", "error");
      } else {
        showAlert("Lookup error. Retry.", "error");
      }
    } finally {
      setLookingUp(false);
    }
  };

  // ─── Cart controls ────────────────────────────────────────────────────────
  const incrementQty = (productId: string) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        if (i.quantity >= i.stock) {
          showAlert("Cannot exceed available stock", "wasabi", 2000);
          return i;
        }
        return { ...i, quantity: i.quantity + 1 };
      })
    );
    vibrate(20);
  };
  const decrementQty = (productId: string) => {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
    vibrate(20);
  };
  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
    vibrate([30, 30]);
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  // ─── Checkout mutation ────────────────────────────────────────────────────
  const checkoutMutation = useMutation({
    mutationFn: () => {
      const payload = checkoutSchema.safeParse({
        items: cart.map(({ productId, quantity, price }) => ({ productId, quantity, price })),
      });
      if (!payload.success) throw new Error("Invalid cart data");
      return postSale(payload.data.items);
    },
    onSuccess: () => {
      vibrate([50, 30, 50, 30, 200]);
      setSuccessGlow(true);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setTimeout(() => {
        setCart([]);
        setView("scan");
        setScannerKey((k) => k + 1);
        setSuccessGlow(false);
        showAlert("✓ Purchase complete! Stock updated.", "success", 4000);
      }, 1800);
    },
    onError: (err: Error) => {
      vibrate([100, 50, 100]);
      showAlert(err.message, "wasabi");
    },
  });

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pos-root {
          min-height: 100dvh;
          background: #080810;
          color: #f0f0ff;
          font-family: 'Inter', 'IBM Plex Sans Arabic', system-ui, sans-serif;
          max-width: 480px;
          margin: 0 auto;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Ambient orbs ── */
        .pos-orb {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(60px);
        }
        .pos-orb-1 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(99,91,255,0.28) 0%, transparent 70%);
          top: -100px; left: -80px;
        }
        .pos-orb-2 {
          width: 250px; height: 250px;
          background: radial-gradient(circle, rgba(0,255,194,0.16) 0%, transparent 70%);
          bottom: 80px; right: -60px;
        }

        /* ── Header ── */
        .pos-header {
          position: sticky; top: 0; z-index: 20;
          padding: 16px 20px;
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(8,8,16,0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .pos-back-btn {
          width: 38px; height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          font-size: 18px;
          transition: background 0.2s;
        }
        .pos-back-btn:hover { background: rgba(255,255,255,0.12); }
        .pos-header-title { font-size: 16px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }
        .pos-header-badge {
          height: 32px; padding: 0 14px;
          background: rgba(99,91,255,0.18);
          border: 1px solid rgba(99,91,255,0.35);
          border-radius: 20px;
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; color: #a89fff;
          cursor: pointer;
          transition: background 0.2s;
        }
        .pos-header-badge:hover { background: rgba(99,91,255,0.28); }
        .pos-badge-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #635BFF;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.6;transform:scale(0.8);} }

        /* ── Alert banner ── */
        .pos-alert {
          position: fixed; top: 76px; left: 50%; transform: translateX(-50%);
          z-index: 50;
          width: calc(100% - 32px);
          max-width: 448px;
          padding: 14px 18px;
          border-radius: 14px;
          font-size: 14px; font-weight: 600;
          backdrop-filter: blur(20px);
          animation: alertIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
          text-align: center;
        }
        @keyframes alertIn { from{opacity:0;transform:translateX(-50%) translateY(-10px);} to{opacity:1;transform:translateX(-50%) translateY(0);} }
        .pos-alert.wasabi { background: rgba(154,205,50,0.12); border: 1px solid rgba(154,205,50,0.4); color: #b8e066; }
        .pos-alert.success { background: rgba(0,255,194,0.10); border: 1px solid rgba(0,255,194,0.35); color: #00FFC2; }
        .pos-alert.error   { background: rgba(255,80,80,0.10); border: 1px solid rgba(255,80,80,0.3); color: #ff7070; }
        .pos-alert.info    { background: rgba(99,91,255,0.10); border: 1px solid rgba(99,91,255,0.3); color: #a89fff; }

        /* ── Content ── */
        .pos-content { padding: 20px 16px 100px; position: relative; z-index: 1; }

        /* ── Scanner card ── */
        .pos-scanner-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 24px;
          padding: 20px;
          backdrop-filter: blur(12px);
          overflow: hidden;
          position: relative;
        }
        .pos-scanner-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(99,91,255,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .pos-scanner-label {
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase; letter-spacing: 0.8px;
          margin-bottom: 14px;
          display: flex; align-items: center; gap: 6px;
        }
        .pos-scanner-label::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #635BFF; animation: pulse-dot 2s ease-in-out infinite; }

        /* html5-qrcode overrides */
        #qr-reader { border: none !important; border-radius: 16px; overflow: hidden; }
        #qr-reader video { border-radius: 14px; }
        #qr-reader__scan_region { border-radius: 16px !important; }
        #qr-reader__dashboard { display: none !important; }
        #qr-reader__scan_region img { display: none; }

        .pos-lookup-overlay {
          position: absolute; inset: 0;
          background: rgba(8,8,16,0.6);
          backdrop-filter: blur(4px);
          border-radius: 24px;
          display: flex; align-items: center; justify-content: center;
          z-index: 5;
        }
        .pos-spinner {
          width: 36px; height: 36px;
          border: 3px solid rgba(99,91,255,0.3);
          border-top-color: #635BFF;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Section title ── */
        .pos-section-label {
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase; letter-spacing: 0.8px;
          margin: 24px 0 12px;
        }

        /* ── Cart empty state ── */
        .pos-empty {
          text-align: center;
          padding: 40px 20px;
          border: 1px dashed rgba(255,255,255,0.10);
          border-radius: 20px;
        }
        .pos-empty-icon { font-size: 36px; margin-bottom: 10px; opacity: 0.5; }
        .pos-empty-text { font-size: 13px; color: rgba(255,255,255,0.3); }

        /* ── Cart item card ── */
        .pos-cart-item {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 14px 16px;
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 10px;
          backdrop-filter: blur(8px);
          transition: border-color 0.2s;
          animation: itemIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes itemIn { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
        .pos-cart-item:hover { border-color: rgba(99,91,255,0.3); }
        .pos-item-icon {
          width: 40px; height: 40px; flex-shrink: 0;
          background: rgba(99,91,255,0.15);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .pos-item-info { flex: 1; min-width: 0; }
        .pos-item-name { font-size: 14px; font-weight: 600; color: #f0f0ff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pos-item-meta { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 2px; }
        .pos-item-controls { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .pos-qty-btn {
          width: 30px; height: 30px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.07);
          color: #f0f0ff;
          font-size: 16px; font-weight: 600;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, transform 0.1s;
        }
        .pos-qty-btn:hover { background: rgba(99,91,255,0.25); }
        .pos-qty-btn:active { transform: scale(0.9); }
        .pos-qty-val { font-size: 15px; font-weight: 700; min-width: 22px; text-align: center; }
        .pos-remove-btn {
          width: 28px; height: 28px;
          border-radius: 8px;
          border: none; background: rgba(255,80,80,0.1);
          color: #ff7070; font-size: 14px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
          margin-left: 4px;
        }
        .pos-remove-btn:hover { background: rgba(255,80,80,0.2); }

        /* ── Total + CTA bar ── */
        .pos-footer {
          position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
          width: 100%; max-width: 480px;
          padding: 16px 16px 28px;
          background: rgba(8,8,16,0.9);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255,255,255,0.07);
          z-index: 20;
        }
        .pos-total-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .pos-total-label { font-size: 12px; color: rgba(255,255,255,0.4); font-weight: 500; }
        .pos-total-amount { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
        .pos-cta-row { display: flex; gap: 10px; }

        .pos-scan-btn {
          flex: 1;
          padding: 15px 12px;
          border-radius: 14px;
          border: 1px solid rgba(99,91,255,0.4);
          background: rgba(99,91,255,0.12);
          color: #a89fff;
          font-family: inherit;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .pos-scan-btn:hover { background: rgba(99,91,255,0.22); }
        .pos-scan-btn:active { transform: scale(0.97); }

        .pos-checkout-btn {
          flex: 2;
          padding: 15px 12px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #635BFF 0%, #8B85FF 100%);
          color: #fff;
          font-family: inherit;
          font-size: 15px; font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(99,91,255,0.4);
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .pos-checkout-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(99,91,255,0.5);
        }
        .pos-checkout-btn:active:not(:disabled) { transform: scale(0.97); }
        .pos-checkout-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .pos-checkout-btn.empty-cart { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.3); box-shadow: none; }

        /* ── Success glow overlay ── */
        .pos-success-overlay {
          position: fixed; inset: 0; z-index: 100;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: rgba(0,20,16,0.92);
          backdrop-filter: blur(20px);
          animation: fadeInGlow 0.4s ease both;
        }
        @keyframes fadeInGlow { from{opacity:0;} to{opacity:1;} }
        .pos-success-icon {
          font-size: 72px;
          animation: scaleIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both;
          filter: drop-shadow(0 0 30px rgba(0,255,194,0.8));
        }
        @keyframes scaleIn { from{transform:scale(0.4) rotate(-10deg);opacity:0;} to{transform:scale(1) rotate(0deg);opacity:1;} }
        .pos-success-text {
          margin-top: 20px;
          font-size: 22px; font-weight: 800;
          color: #00FFC2;
          letter-spacing: -0.5px;
          animation: scaleIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both;
          text-shadow: 0 0 40px rgba(0,255,194,0.5);
        }
        .pos-success-sub {
          margin-top: 8px;
          font-size: 14px; color: rgba(0,255,194,0.5);
          animation: scaleIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s both;
        }

        /* ─── View toggle tabs ─── */
        .pos-tabs {
          display: flex; gap: 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 4px;
          margin-bottom: 20px;
        }
        .pos-tab {
          flex: 1;
          padding: 10px;
          border-radius: 10px; border: none;
          background: transparent;
          color: rgba(255,255,255,0.4);
          font-family: inherit; font-size: 13px; font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .pos-tab.active {
          background: rgba(99,91,255,0.2);
          color: #a89fff;
        }
      `}</style>

      {/* Ambient orbs */}
      <div className="pos-root">
        <div className="pos-orb pos-orb-1" />
        <div className="pos-orb pos-orb-2" />

        {/* ── PWA Install Banner ── */}
        <InstallBanner />

        {/* ── Success Glow Overlay ── */}
        {successGlow && (
          <div className="pos-success-overlay">
            <div className="pos-success-icon">✓</div>
            <div className="pos-success-text">Purchase Complete!</div>
            <div className="pos-success-sub">Inventory updated across all devices</div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="pos-header">
          <button
            className="pos-back-btn"
            onClick={() => router.push("/")}
            aria-label="Back to dashboard"
          >
            ←
          </button>
          <span className="pos-header-title">Direct Checkout</span>
          <button
            className="pos-header-badge"
            onClick={() => setView(view === "scan" ? "cart" : "scan")}
            aria-label="Toggle cart"
          >
            <span className="pos-badge-dot" />
            {cartCount > 0 ? `${cartCount} item${cartCount > 1 ? "s" : ""}` : "Cart"}
          </button>
        </div>

        {/* ── Alert ── */}
        {alert && (
          <div className={`pos-alert ${alert.kind}`} role="alert">
            {alert.message}
          </div>
        )}

        {/* ── Main Content ── */}
        <div className="pos-content">
          {/* View Tabs */}
          <div className="pos-tabs">
            <button
              className={`pos-tab${view === "scan" ? " active" : ""}`}
              onClick={() => setView("scan")}
              id="tab-scan"
            >
              📷 Scan
            </button>
            <button
              className={`pos-tab${view === "cart" ? " active" : ""}`}
              onClick={() => setView("cart")}
              id="tab-cart"
            >
              🛒 Cart {cartCount > 0 && `(${cartCount})`}
            </button>
          </div>

          {/* ─── SCAN VIEW ─── */}
          {view === "scan" && (
            <div className="pos-scanner-card" style={{ position: "relative" }}>
              <div className="pos-scanner-label">Live Scanner</div>
              <div ref={readerDivRef} id="qr-reader" style={{ borderRadius: 16 }} />
              {lookingUp && (
                <div className="pos-lookup-overlay">
                  <div className="pos-spinner" />
                </div>
              )}
            </div>
          )}

          {/* ─── CART VIEW ─── */}
          {view === "cart" && (
            <>
              <div className="pos-section-label">Current Session</div>
              {cart.length === 0 ? (
                <div className="pos-empty">
                  <div className="pos-empty-icon">🛒</div>
                  <div className="pos-empty-text">No items yet. Switch to Scan to add products.</div>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="pos-cart-item">
                    <div className="pos-item-icon">📦</div>
                    <div className="pos-item-info">
                      <div className="pos-item-name">{item.name}</div>
                      <div className="pos-item-meta">
                        {item.price > 0
                          ? `${(item.price * item.quantity).toFixed(2)} — ${item.price.toFixed(2)} × ${item.quantity} ${item.unit}`
                          : `${item.quantity} ${item.unit}`}
                      </div>
                    </div>
                    <div className="pos-item-controls">
                      <button className="pos-qty-btn" onClick={() => decrementQty(item.productId)} aria-label="Decrease quantity">−</button>
                      <span className="pos-qty-val">{item.quantity}</span>
                      <button className="pos-qty-btn" onClick={() => incrementQty(item.productId)} aria-label="Increase quantity">+</button>
                      <button className="pos-remove-btn" onClick={() => removeItem(item.productId)} aria-label="Remove item">✕</button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* ── Footer CTA ── */}
        <div className="pos-footer">
          <div className="pos-total-row">
            <span className="pos-total-label">Session Total</span>
            <span className="pos-total-amount">
              {cartTotal > 0 ? `${cartTotal.toFixed(2)}` : cart.length > 0 ? `${cart.length} SKU(s)` : "—"}
            </span>
          </div>
          <div className="pos-cta-row">
            <button
              className="pos-scan-btn"
              onClick={() => setView("scan")}
              id="btn-scan-next"
            >
              📷 Scan Next
            </button>
            <button
              className={`pos-checkout-btn${cart.length === 0 ? " empty-cart" : ""}`}
              onClick={() => checkoutMutation.mutate()}
              disabled={cart.length === 0 || checkoutMutation.isPending || successGlow}
              id="btn-complete-purchase"
            >
              {checkoutMutation.isPending ? (
                <>
                  <span className="pos-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Processing…
                </>
              ) : (
                "Complete Purchase ✓"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
