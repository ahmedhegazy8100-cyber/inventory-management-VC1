import type { Metadata } from "next";
import { cookies } from "next/headers";
import Providers from "./Providers";
import { I18nProvider } from "./components/I18nProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { Sidebar } from "./components/Sidebar";
import { LayoutWrapper } from "./components/LayoutWrapper";
import "./globals.css";

// ... (skipping metadata)

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
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
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
