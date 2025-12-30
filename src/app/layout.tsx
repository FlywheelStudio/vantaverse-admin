import { AuthProvider } from '@/context/auth';
import { ThemeProvider } from '@/context/theme';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
