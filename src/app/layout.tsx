import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { CurrencyProvider } from '@/components/providers/CurrencyProvider';
import { TermsCheck } from '@/components/providers/TermsCheck';
import './globals.css';

export const metadata: Metadata = {
  title: 'Captain\'s Log 🖖',
  description: 'Boat maintenance and document management system',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Captain\'s Log',
  },
};

export const viewport: Viewport = {
  themeColor: '#0891b2',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-gray-50 dark:bg-gray-900 antialiased transition-colors">
          <ThemeProvider>
            <CurrencyProvider>
              <TermsCheck>
                {children}
              </TermsCheck>
            </CurrencyProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
