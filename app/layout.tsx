import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import Providers from "./Providers";
import { I18nProvider } from "./components/I18nProvider";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventory Pro | 2026",
  description: "Advanced enterprise-grade inventory management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get("auth_token")?.value;

  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <Providers>
            {isAuthenticated ? (
              <div className="app-wrapper">
                <aside className="sidebar">
                  <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>📦</h1>
                    <LanguageSwitcher />
                  </div>
                  <nav className="side-nav">
                    <Link href="/" className="side-nav-item">Inventory</Link>
                    <Link href="/orders" className="side-nav-item">Orders</Link>
                    <Link href="/audit-logs" className="side-nav-item">Audit Logs</Link>
                  </nav>
                </aside>
                <main className="main-content">
                  {children}
                </main>
              </div>
            ) : (
              <div style={{ minHeight: "100vh" }}>
                {children}
              </div>
            )}
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
