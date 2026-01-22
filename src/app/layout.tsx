import { AuthProvider } from '@/context/auth';
import { ThemeProvider } from '@/context/theme';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from 'react-hot-toast';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const satoshi = localFont({
  src: [
    {
      path: '../fonts/Satoshi-Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../fonts/Satoshi-LightItalic.otf',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../fonts/Satoshi-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Satoshi-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/Satoshi-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/Satoshi-MediumItalic.otf',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../fonts/Satoshi-Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/Satoshi-BoldItalic.otf',
      weight: '700',
      style: 'italic',
    },
    {
      path: '../fonts/Satoshi-Black.otf',
      weight: '900',
      style: 'normal',
    },
    {
      path: '../fonts/Satoshi-BlackItalic.otf',
      weight: '900',
      style: 'italic',
    },
  ],
  variable: '--font-satoshi',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VantaThrive Admin',
  description: 'VantaThrive Admin panel for the VantaThrive application',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon0.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'VantaThrive Admin',
    description: 'VantaThrive Admin panel for the VantaThrive application',
    url: process.env.APP_URL,
    type: 'website',
    images: [
      {
        url: `${process.env.APP_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'VantaThrive Admin',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@flywheelstudio',
    title: 'VantaThrive Admin',
    description: 'VantaThrive Admin panel for the VantaThrive application',
    images: [
      {
        url: `${process.env.APP_URL}/twitter-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'VantaThrive Admin',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${satoshi.variable} antialiased`}>
        <div>
          <Toaster position="bottom-right" reverseOrder={false} />
        </div>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
