'use client';

import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { Icon } from '@/components/medvanta';
import { serverSignInWithGoogle } from '@/app/(authenticated)/auth/actions';

/** HTML login form — SSO only (no OTP product). */
export function LoginForm(): React.ReactElement {
  const [isPending, startTransition] = useTransition();

  const handleSsoSignIn = (): void => {
    startTransition(async () => {
      await serverSignInWithGoogle();
    });
  };

  return (
    <div style={{ width: '100%', maxWidth: 372 }}>
      <h2
        style={{
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '-.02em',
        }}
      >
        Admin sign in
      </h2>
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-muted)',
          margin: '7px 0 26px',
        }}
      >
        Sign in with your MedVanta organization account to access the admin
        console.
      </p>

      <button
        type="button"
        className="btn btn-pri btn-lg btn-full"
        onClick={handleSsoSignIn}
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Redirecting…
          </>
        ) : (
          <>
            <Icon name="ShieldCheck" size={19} />
            Continue with MedVanta SSO
          </>
        )}
      </button>

      <p
        style={{
          fontSize: 12,
          color: 'var(--text-faint)',
          marginTop: 26,
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        Protected by MedVanta identity.
        <br />
        HIPAA-compliant access · Sessions expire after 12 hours.
      </p>
    </div>
  );
}
