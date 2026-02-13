'use client';

import { Google } from '@/components/common/icons';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';
import { useTransition } from 'react';
import { serverSignInWithGoogle } from '../../actions';

export function AuthGoogleSignInButton() {
  const [isPending, startTransition] = useTransition();

  function handleSignInWithGoogle() {
    startTransition(async () => {
      await serverSignInWithGoogle();
    });
  }
  return (
    <Button
      onClick={handleSignInWithGoogle}
      type="button"
      disabled={isPending}
      variant="outline"
      className="flex items-center gap-2 cursor-pointer bg-card"
    >
      {isPending ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <Google className="w-4 h-4" />
          Sign in with Google
        </>
      )}
    </Button>
  );
}
