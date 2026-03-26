"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function MobileLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError("");

    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        fieldErrors[String(i.path[0])] = i.message;
      });
      setErrors(fieldErrors);
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(
          data.errors?.email || data.errors?.password || "Invalid credentials"
        );
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
        setLoading(false);
        return;
      }

      if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
      setSuccess(true);
      setTimeout(() => router.replace("/mobile/scan"), 600);
    } catch {
      setServerError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .ml-root {
          min-height: 100dvh;
          background: #0a0a12;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Inter', 'IBM Plex Sans Arabic', system-ui, sans-serif;
          overflow: hidden;
          position: relative;
        }

        .ml-orb-1 {
          position: absolute;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(99,91,255,0.35) 0%, transparent 70%);
          top: -100px; left: -100px;
          pointer-events: none;
          animation: float1 8s ease-in-out infinite;
        }
        .ml-orb-2 {
          position: absolute;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(0,255,194,0.2) 0%, transparent 70%);
          bottom: -80px; right: -80px;
          pointer-events: none;
          animation: float2 10s ease-in-out infinite;
        }
        @keyframes float1 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(40px,30px);} }
        @keyframes float2 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(-30px,-25px);} }

        .ml-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.10);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 24px;
          padding: 40px 32px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 0 0 1px rgba(99,91,255,0.15), 0 32px 80px rgba(0,0,0,0.5);
          position: relative;
          z-index: 1;
          animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes slideUp { from{opacity:0;transform:translateY(32px);} to{opacity:1;transform:translateY(0);} }

        .ml-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
        }
        .ml-logo-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #635BFF, #8B85FF);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 0 20px rgba(99,91,255,0.5);
        }
        .ml-logo-text { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
        .ml-logo-sub { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 500; margin-top: 1px; }

        .ml-title { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .ml-subtitle { font-size: 13px; color: rgba(255,255,255,0.45); margin-bottom: 28px; }

        .ml-field { margin-bottom: 16px; }
        .ml-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .ml-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 12px;
          font-size: 15px;
          color: #fff;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-text-fill-color: #fff;
        }
        .ml-input::placeholder { color: rgba(255,255,255,0.25); }
        .ml-input:focus {
          border-color: rgba(99,91,255,0.6);
          background: rgba(99,91,255,0.08);
          box-shadow: 0 0 0 3px rgba(99,91,255,0.15);
        }
        .ml-input.error { border-color: rgba(154,205,50,0.6); }
        .ml-error { font-size: 12px; color: #9ACD32; margin-top: 6px; }

        .ml-server-error {
          background: rgba(154,205,50,0.08);
          border: 1px solid rgba(154,205,50,0.3);
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 13px;
          color: #9ACD32;
          margin-bottom: 16px;
          text-align: center;
        }

        .ml-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #635BFF 0%, #8B85FF 100%);
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          font-family: inherit;
          cursor: pointer;
          margin-top: 8px;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          box-shadow: 0 4px 20px rgba(99,91,255,0.4);
          position: relative;
          overflow: hidden;
        }
        .ml-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(99,91,255,0.5);
        }
        .ml-btn:active:not(:disabled) { transform: scale(0.98); }
        .ml-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .ml-btn.success {
          background: linear-gradient(135deg, #00C49A 0%, #00FFC2 100%);
          box-shadow: 0 4px 30px rgba(0,255,194,0.5);
        }

        .ml-spinner {
          display: inline-block;
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }
        @keyframes spin { to{transform:rotate(360deg);} }
      `}</style>
      <div className="ml-root">
        <div className="ml-orb-1" />
        <div className="ml-orb-2" />
        <div className="ml-card">
          <div className="ml-logo">
            <div className="ml-logo-icon">📦</div>
            <div>
              <div className="ml-logo-text">Inventra</div>
              <div className="ml-logo-sub">WAREHOUSE MOBILE</div>
            </div>
          </div>

          <div className="ml-title">Welcome back</div>
          <div className="ml-subtitle">Sign in to start your cashier session</div>

          {serverError && (
            <div className="ml-server-error">⚠ {serverError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="ml-field">
              <label className="ml-label" htmlFor="mob-email">Email</label>
              <input
                id="mob-email"
                type="email"
                className={`ml-input${errors.email ? " error" : ""}`}
                placeholder="operator@inventra.io"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                autoComplete="email"
                inputMode="email"
              />
              {errors.email && <div className="ml-error">{errors.email}</div>}
            </div>

            <div className="ml-field">
              <label className="ml-label" htmlFor="mob-password">Password</label>
              <input
                id="mob-password"
                type="password"
                className={`ml-input${errors.password ? " error" : ""}`}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
              />
              {errors.password && <div className="ml-error">{errors.password}</div>}
            </div>

            <button
              id="mob-login-btn"
              type="submit"
              className={`ml-btn${success ? " success" : ""}`}
              disabled={loading || success}
            >
              {loading && <span className="ml-spinner" />}
              {success ? "✓ Entering the floor..." : loading ? "Authenticating..." : "Start Shift →"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
