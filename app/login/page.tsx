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
    <div className="container auth-container">
      <header className="header" style={{ marginBottom: "32px", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, background: "linear-gradient(135deg, var(--text-primary), var(--accent-hover))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>📦 Inventory Tracker</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Please {authMode === "login" ? "log in" : "sign up"} to continue</p>
      </header>

      <div className="card auth-card">
        <div className="auth-tabs">
          <button
            className={`auth-tab ${authMode === "login" ? "active" : ""}`}
            onClick={() => {
              setAuthMode("login");
              setAuthErrors({});
            }}
          >
            Login
          </button>
          <button
            className={`auth-tab ${authMode === "signup" ? "active" : ""}`}
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
            <div className="form-group">
              <label htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                type="text"
                placeholder="Your full name"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                className={authErrors.name ? "input-error" : ""}
              />
              <span className="error-text">{authErrors.name || ""}</span>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className={authErrors.email ? "input-error" : ""}
            />
            <span className="error-text">{authErrors.email || ""}</span>
          </div>
          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className={authErrors.password ? "input-error" : ""}
            />
            <span className="error-text">{authErrors.password || ""}</span>
          </div>
          {authMode === "signup" && (
            <div className="form-group">
              <label htmlFor="auth-confirm">Confirm Password</label>
              <input
                id="auth-confirm"
                type="password"
                placeholder="••••••••"
                value={authConfirmPassword}
                onChange={(e) => setAuthConfirmPassword(e.target.value)}
                className={authErrors.confirmPassword ? "input-error" : ""}
              />
              <span className="error-text">
                {authErrors.confirmPassword || ""}
              </span>
            </div>
          )}

          <button type="submit" className="btn-add btn-auth" disabled={isSubmittingAuth}>
            {isSubmittingAuth
              ? "Please wait..."
              : authMode === "login"
              ? "Log In"
              : "Create Account"}
          </button>
        </form>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
