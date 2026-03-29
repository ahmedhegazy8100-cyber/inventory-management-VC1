"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "./components/I18nProvider";
import Link from "next/link";
import { 
  BarChart3, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  Search, 
  Archive, 
  Folder,
  LayoutDashboard,
  LogOut,
  DollarSign,
  Package,
  ExternalLink,
  ChevronRight
} from "lucide-react";

import "./globals.css";

export interface Product {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    price: number;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const { t, isRTL } = useI18n();

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
       // mute
    }
  };

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: result } = useQuery({
    queryKey: ["products", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/products?limit=5");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user,
  });

  const products = result?.data || [];
  const lowStock = (products as Product[]).filter(p => p.quantity < 50);

  if (loadingApp) return <div className="p-8">Initializing Inventra...</div>;
  if (!user) return null;

  return (
    <div className="page-fade-in">
      <header className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LayoutDashboard size={28} color="var(--accent)" />
            {t("dashboard") || "Dashboard Overview"}
          </h1>
          <p className="text-secondary">{t("welcomeBack") || "Welcome back"}, {user.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleLogout} className="btn-logout" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogOut size={18} /> {t("logout")}
          </button>
        </div>
      </header>

      {/* Bento Metrics */}
      <div className="bento-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="card bento-card" style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '24px 32px' }}>
          <div className="bento-icon" style={{ color: 'var(--accent)', background: 'rgba(99, 102, 241, 0.1)', padding: '16px', borderRadius: '12px' }}>
            <TrendingUp size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>INV. VALUE</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>${stats?.totalValue?.toFixed(2) || "0.00"}</div>
          </div>
        </div>

        <div className="card bento-card" style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '24px 32px' }}>
          <div className="bento-icon" style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px' }}>
            <BarChart3 size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>EXP. PROFIT</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>${stats?.expectedProfit?.toFixed(2) || "0.00"}</div>
          </div>
        </div>

        <div className="card bento-card" style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '24px 32px' }}>
          <div className="bento-icon" style={{ color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '12px' }}>
            <DollarSign size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL REVENUE</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>${stats?.totalPotentialRevenue?.toFixed(2) || "0.00"}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
        <div className="card bento-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} color="var(--warning)" />
              Critical Stock Alerts
            </h3>
            <Link href="/inventory" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lowStock.length > 0 ? lowStock.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Retail: ${p.price.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--danger)', fontWeight: 700 }}>{p.quantity} {p.unit}</div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remaining</div>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                No critical stock alerts at this time.
              </div>
            )}
          </div>
        </div>

        <div className="card bento-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3>Modules Quick Access</h3>
          
          <Link href="/inventory" className="side-nav-item" style={{ background: 'rgba(99, 102, 241, 0.05)', color: 'var(--text-primary)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <Package size={20} />
            <div>
              <div style={{ fontWeight: 700 }}>Inventory Module</div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>Manage products, prices & stock levels</div>
            </div>
            <ExternalLink size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
          </Link>

          <Link href="/orders" className="side-nav-item">
            <TrendingUp size={20} color="var(--success)" />
            <div>
              <div style={{ fontWeight: 700 }}>Procurement (Orders)</div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>Restock and track supplier orders</div>
            </div>
          </Link>

          <Link href="/providers" className="side-nav-item">
            <Search size={20} color="var(--warning)" />
            <div>
              <div style={{ fontWeight: 700 }}>Supplier Directory</div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>Manage your vendor relationships</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
