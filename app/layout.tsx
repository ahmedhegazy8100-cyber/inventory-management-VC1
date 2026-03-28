import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import Providers from "./Providers";
import { I18nProvider } from "./components/I18nProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { Sidebar } from "./components/Sidebar";
import { LayoutWrapper } from "./components/LayoutWrapper";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const ibmPlexArabic = IBM_Plex_Sans_Arabic({ 
  subsets: ["arabic"], 
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic"
});

export const metadata: Metadata = {
  title: "Inventra — Warehouse Management",
  description: "High-speed inventory and cashier management for warehouse operators.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Inventra",
  },
  icons: {
    apple: "/icon-192.png",
    icon: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#635BFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      <body className={`${inter.className} ${ibmPlexArabic.variable}`}>
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
