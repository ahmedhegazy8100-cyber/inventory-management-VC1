import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Inventory Tracker",
  description: "Manage your products and stock levels with ease.",
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
        {isAuthenticated ? (
          <div className="app-wrapper">
            <aside className="sidebar">
              <div className="sidebar-header">
                <h1>📦 Inventory</h1>
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
      </body>
    </html>
  );
}
