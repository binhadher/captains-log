import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { CurrencyProvider } from '@/components/providers/CurrencyProvider';
import { TermsCheck } from '@/components/providers/TermsCheck';
import { PWAInstallPrompt } from '@/components/pwa/InstallPrompt';
import { BottomNav } from '@/components/layout/BottomNav';
import './globals.css';

export const metadata: Metadata = {
  title: "Captain's Log 🖖",
  description: 'Boat maintenance and document management system',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Captain's Log",
  },
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        </head>
        <body className="min-h-screen bg-gray-50 dark:bg-gray-900 antialiased transition-colors">
          <ThemeProvider>
            <CurrencyProvider>
              <TermsCheck>
                <div className="pb-20 md:pb-0">
                  {children}
                </div>
                <BottomNav />
                <PWAInstallPrompt />
              </TermsCheck>
            </CurrencyProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
