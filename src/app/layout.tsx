import { AuthProvider } from '@/context/auth';
import { ThemeProvider } from '@/context/theme';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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

const gas = localFont({
  src: '../fonts/GAS.TTF',
  variable: '--font-gas',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Flywheel Starter for Next.js and Supabase',
  description: 'Flywheel Starter for Next.js and Supabase',
  icons: {
    icon: '/static/favicons/favicon.ico',
    apple: '/static/favicons/apple-touch-icon.png',
    shortcut: '/static/favicons/favicon.ico',
    other: {
      rel: 'icon',
      url: '/static/favicons/favicon.ico',
    },
  },
  openGraph: {
    title: 'Flywheel Starter for Next.js and Supabase',
    description: 'Flywheel Starter for Next.js and Supabase',
    url: process.env.APP_URL,
    type: 'website',
    images: [
      {
        url: `${process.env.APP_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Flywheel Starter for Next.js and Supabase',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@flywheelstudio',
    title: 'Flywheel Starter for Next.js and Supabase',
    description: 'Flywheel Starter for Next.js and Supabase',
    images: [
      {
        url: `${process.env.APP_URL}/twitter-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Flywheel Starter for Next.js and Supabase',
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
      <body
        className={`${satoshi.variable} ${gas.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
