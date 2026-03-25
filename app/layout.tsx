import type { Metadata } from "next";
import { cookies } from "next/headers";
import Providers from "./Providers";
import { I18nProvider } from "./components/I18nProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { Sidebar } from "./components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventra | Modern Inventory SaaS",
  description: "Enterprise-grade inventory management powered by operational intelligence",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get("auth_token")?.value;

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <I18nProvider>
          <ThemeProvider>
            <Providers>
              {isAuthenticated ? (
                <div className="app-wrapper">
                  <Sidebar />
                  <main className="main-content">
                    <div className="container">
                      {children}
                    </div>
                  </main>
                </div>
              ) : (
                <div className="auth-wrapper">
                  {children}
                </div>
              )}
            </Providers>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
