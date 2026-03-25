"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../globals.css";

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authErrors, setAuthErrors] = useState<Record<string, string>>({});
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    // Check if already logged in
    fetch("/api/auth/me").then((res) => {
      if (res.ok) {
        res.json().then((data) => {
          if (data.user) {
            router.push("/");
          }
        });
      }
    });
  }, [router]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrors({});
    setIsSubmittingAuth(true);

    try {
      const url = authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body =
        authMode === "login"
          ? { email: authEmail, password: authPassword }
          : {
              name: authName,
              email: authEmail,
              password: authPassword,
              confirmPassword: authConfirmPassword,
            };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setAuthErrors(data.errors);
        else showToast(data.error || "Authentication failed", "error");
        return;
      }

      showToast(authMode === "login" ? "Logged in!" : "Account created!");
      
      // Redirect to home page
      setTimeout(() => {
         router.push("/");
         router.refresh(); // Force layout refresh
      }, 500);

    } catch {
      showToast("Network error during authentication.", "error");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  return (
    <div className="auth-container page-fade-in" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.05) 0%, transparent 70%)'
    }}>
      <header style={{ marginBottom: "48px", textAlign: "center" }}>
        <div style={{ 
          fontSize: "3rem", 
          fontWeight: 900, 
          letterSpacing: "-0.05em",
          background: "linear-gradient(135deg, #fff 0%, var(--accent) 100%)", 
          WebkitBackgroundClip: "text", 
          WebkitTextFillColor: "transparent",
          marginBottom: '8px'
        }}>
          Inventra
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: '1.1rem' }}>
          {authMode === "login" ? "Welcome back to your logistics hub" : "Start your journey with Inventra"}
        </p>
      </header>

      <div className="card auth-card" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        <div className="auth-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            className={`auth-tab ${authMode === "login" ? "active" : ""}`}
            style={{ 
              flex: 1, 
              padding: '10px', 
              borderRadius: 'var(--radius-sm)',
              background: authMode === 'login' ? 'var(--accent)' : 'transparent',
              color: authMode === 'login' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
            onClick={() => {
              setAuthMode("login");
              setAuthErrors({});
            }}
          >
            Log In
          </button>
          <button
            className={`auth-tab ${authMode === "signup" ? "active" : ""}`}
            style={{ 
              flex: 1, 
              padding: '10px', 
              borderRadius: 'var(--radius-sm)',
              background: authMode === 'signup' ? 'var(--accent)' : 'transparent',
              color: authMode === 'signup' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
            onClick={() => {
              setAuthMode("signup");
              setAuthErrors({});
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
          {authMode === "signup" && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="auth-name" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name</label>
              <input
                id="auth-name"
                type="text"
                placeholder="John Doe"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                className={authErrors.name ? "input-error" : ""}
              />
              {authErrors.name && <span className="error-text" style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{authErrors.name}</span>}
            </div>
          )}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="auth-email" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address</label>
            <input
              id="auth-email"
              type="email"
              placeholder="name@company.com"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              className={authErrors.email ? "input-error" : ""}
            />
            {authErrors.email && <span className="error-text" style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{authErrors.email}</span>}
          </div>
          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label htmlFor="auth-password" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              className={authErrors.password ? "input-error" : ""}
            />
            {authErrors.password && <span className="error-text" style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{authErrors.password}</span>}
          </div>

          <button type="submit" className="btn-add" style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700, marginTop: 0 }} disabled={isSubmittingAuth}>
            {isSubmittingAuth
              ? "Authenticating..."
              : authMode === "login"
              ? "Access Dashboard"
              : "Create Business Account"}
          </button>
        </form>
      </div>

      <footer style={{ marginTop: '48px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        &copy; 2026 Inventra Logistics Systems. All rights reserved.
      </footer>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
