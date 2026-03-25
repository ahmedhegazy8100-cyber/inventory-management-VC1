"use client";

import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Scan, ShoppingCart, ArrowLeft, Package, Trash2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface CartItem {
  id: string;
  name: string;
  barcode: string | null;
  price: number;
  quantity: number;
}

export default function MobileScanPage() {
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          handleScan(decodedText);
          scanner.clear();
          setIsScanning(false);
        },
        (error) => {
          // Skip errors
        }
      );

      return () => {
         scanner.clear().catch(e => console.error("Scanner clear failed", e));
      };
    }
  }, [isScanning]);

  const handleScan = async (barcode: string) => {
    setScannedResult(barcode);
    setStatus({ message: "Searching product...", type: 'info' });

    try {
      // Look up product by barcode
      const res = await fetch(`/api/products?search=${barcode}`);
      const data = await res.json();
      
      const product = data.data.find((p: any) => p.barcode === barcode);

      if (product) {
        addToCart(product);
        setStatus({ message: `Added ${product.name}`, type: 'success' });
      } else {
        setStatus({ message: "Product not found", type: 'error' });
      }
    } catch (err) {
      setStatus({ message: "Error looking up product", type: 'error' });
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        price: product.price || 0,
        quantity: 1
      }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    setStatus({ message: "Processing checkout...", type: 'info' });

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
          }))
        })
      });

      if (res.ok) {
        setCart([]);
        setStatus({ message: "Checkout successful!", type: 'success' });
      } else {
        const data = await res.json();
        setStatus({ message: data.error || "Checkout failed", type: 'error' });
      }
    } catch (err) {
      setStatus({ message: "Network error", type: 'error' });
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="mobile-pos">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b bg-background sticky top-0 z-10">
        <Link href="/" className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold">Mobile POS</h1>
        <div className="relative">
          <ShoppingCart size={24} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Scanner Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Scan size={16} /> Scanner
            </h2>
            {!isScanning && (
              <button 
                onClick={() => setIsScanning(true)}
                className="text-primary text-sm font-medium"
              >
                Scan Again
              </button>
            )}
          </div>
          
          {isScanning ? (
            <div id="reader" className="overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/50 bg-muted/20 aspect-square flex items-center justify-center">
              <p className="text-xs text-muted-foreground animate-pulse">Initializing Camera...</p>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-xl p-8 flex flex-col items-center justify-center border border-muted text-center space-y-2">
               <CheckCircle2 className="text-success" size={32} />
               <p className="text-sm font-medium">Scanned: {scannedResult}</p>
            </div>
          )}
        </div>

        {/* Status Toast Style (In-UI) */}
        {status && (
          <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
            status.type === 'error' ? 'bg-error/10 text-error' : 
            status.type === 'success' ? 'bg-success/10 text-success' : 
            'bg-primary/10 text-primary'
          }`}>
            {status.message}
          </div>
        )}

        {/* Cart View */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Package size={16} /> Shopping Cart
          </h2>
          
          {cart.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
              <p className="text-sm">Scan items to add them here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-card border rounded-lg shadow-sm">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeFromCart(item.id)} className="text-error">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t mt-4">
                <div className="flex items-center justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full mt-4 py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isCheckingOut ? "Processing..." : "Complete Sale"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .mobile-pos {
          min-height: 100vh;
          background: var(--background);
          color: var(--foreground);
          max-width: 500px;
          margin: 0 auto;
        }
        .text-success { color: #10b981; }
        .bg-success\/10 { background-color: rgba(16, 185, 129, 0.1); }
        .text-error { color: #ef4444; }
        .bg-error\/10 { background-color: rgba(239, 68, 68, 0.1); }
      `}</style>
    </div>
  );
}
