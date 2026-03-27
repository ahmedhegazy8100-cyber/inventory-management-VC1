"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Already dismissed
    if (sessionStorage.getItem("pwa-banner-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      if (navigator.vibrate) navigator.vibrate([50, 30, 100]);
    }
    setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  };

  if (!showBanner) return null;

  return (
    <>
      <style>{`
        .pwa-banner {
          position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
          width: calc(100% - 32px); max-width: 448px;
          background: rgba(20, 18, 48, 0.95);
          border: 1px solid rgba(99,91,255,0.4);
          border-radius: 18px; padding: 16px;
          display: flex; align-items: center; gap: 14px;
          backdrop-filter: blur(20px);
          z-index: 60;
          box-shadow: 0 8px 40px rgba(99,91,255,0.25);
          animation: bannerIn 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes bannerIn {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .pwa-banner-icon {
          width: 44px; height: 44px; flex-shrink: 0;
          background: linear-gradient(135deg, #635BFF, #8B85FF);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          box-shadow: 0 0 16px rgba(99,91,255,0.4);
        }
        .pwa-banner-text { flex: 1; }
        .pwa-banner-title { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 2px; }
        .pwa-banner-sub { font-size: 11px; color: rgba(255,255,255,0.45); }
        .pwa-banner-actions { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
        .pwa-install-btn {
          padding: 8px 14px; border-radius: 8px; border: none;
          background: linear-gradient(135deg, #635BFF, #8B85FF);
          color: #fff; font-size: 12px; font-weight: 700; font-family: inherit;
          cursor: pointer; white-space: nowrap;
          box-shadow: 0 2px 10px rgba(99,91,255,0.4);
        }
        .pwa-dismiss-btn {
          padding: 6px 10px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.12);
          background: transparent;
          color: rgba(255,255,255,0.35);
          font-size: 11px; font-family: inherit; cursor: pointer;
          text-align: center;
        }
      `}</style>
      <div className="pwa-banner" role="dialog" aria-label="Install Inventra">
        <div className="pwa-banner-icon">📦</div>
        <div className="pwa-banner-text">
          <div className="pwa-banner-title">Install Inventra</div>
          <div className="pwa-banner-sub">Add to home screen for instant access</div>
        </div>
        <div className="pwa-banner-actions">
          {installed ? (
            <div style={{ fontSize: 12, color: "#00FFC2", fontWeight: 700 }}>✓ Installed!</div>
          ) : (
            <button className="pwa-install-btn" onClick={handleInstall} id="pwa-install-btn">
              Install
            </button>
          )}
          <button className="pwa-dismiss-btn" onClick={handleDismiss} aria-label="Dismiss">
            Not now
          </button>
        </div>
      </div>
    </>
  );
}
