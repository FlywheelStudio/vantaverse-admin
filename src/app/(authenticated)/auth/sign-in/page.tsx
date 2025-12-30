import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Metadata } from 'next';
import { AuthNext } from './partials/next';
import { AuthGoogleSignInButton } from './partials/sign-in';
/**
 * SEO Metadata
 * @description SEO Metadata for the auth sign in page (starter copy)
 * @returns {Promise<Metadata>}
 */
export async function generateMetadata(): Promise<Metadata> {
  const metaTitle = 'Sign In - Starter';
  const metaDescription =
    'Sign in to your starter project account. Access features and manage your profile securely.';
  const metaKeywords = [
    'sign in',
    'login',
    'account',
    'starter',
    'authentication',
    'secure access',
  ];
  const metaUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/sign-in`;
  const metaUrlImage = `${process.env.NEXT_PUBLIC_APP_URL}/static/favicons/android-chrome-512x512.png`;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords,
    openGraph: {
      siteName: 'Starter',
      url: metaUrl,
      type: 'website',
      title: metaTitle,
      description: metaDescription,
      images: [
        {
          url: metaUrlImage,
          width: 512,
          height: 512,
          alt: 'Sign In - Starter Project',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [
        {
          url: metaUrlImage,
          alt: 'Sign In - Starter Project',
        },
      ],
    },
    alternates: {
      canonical: metaUrl,
    },
    robots: {
      index: true,
      follow: true,
      nocache: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  };
}

interface AuthSignInPageProps {
  params?: Promise<{
    error?: string;
  }>;
  searchParams?: Promise<{
    next?: string;
  }>;
}

export default async function AuthSignInPage({
  params,
  searchParams,
}: AuthSignInPageProps) {
  const { error } = (await params) ?? { error: undefined };
  const { next } = (await searchParams) ?? { next: undefined };

  return (
    <div className="w-full p-6">
      <h1 className="text-xl font-bold text-center">Sign In</h1>
      <p className="text-center mb-4">
        Sign in to your starter project account to get started.
      </p>
      <div className="flex flex-col gap-8 my-8">
        {error && (
          <Alert>
            <AlertTitle className="text-center">
              Oops! Something went wrong.
            </AlertTitle>
            <AlertDescription className="text-center w-full block">
              {error}
            </AlertDescription>
          </Alert>
        )}
        <AuthGoogleSignInButton />
        <AuthNext next={next} />
      </div>
    </div>
  );
}
