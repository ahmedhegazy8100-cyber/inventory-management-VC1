"use client";

export default function OfflinePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .offline-root {
          min-height: 100dvh;
          background: #080810;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          font-family: 'Inter', system-ui, sans-serif;
          color: #f0f0ff;
          text-align: center;
          padding: 32px;
        }
        .offline-icon {
          font-size: 64px;
          margin-bottom: 20px;
          filter: grayscale(0.4);
        }
        .offline-title {
          font-size: 22px; font-weight: 800;
          color: #fff; margin-bottom: 8px;
        }
        .offline-sub {
          font-size: 14px; color: rgba(255,255,255,0.4);
          max-width: 280px; line-height: 1.6;
          margin-bottom: 28px;
        }
        .offline-btn {
          padding: 14px 28px;
          background: linear-gradient(135deg, #635BFF, #8B85FF);
          border: none; border-radius: 12px;
          color: #fff; font-family: inherit;
          font-size: 15px; font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(99,91,255,0.4);
          transition: transform 0.15s;
        }
        .offline-btn:hover { transform: translateY(-2px); }
      `}</style>
      <div className="offline-root">
        <div className="offline-icon">📡</div>
        <div className="offline-title">You&apos;re offline</div>
        <div className="offline-sub">
          Inventra needs a connection to sync inventory. Please reconnect to continue.
        </div>
        <button className="offline-btn" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    </>
  );
}
