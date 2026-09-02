import Link from 'next/link';

/**
 * Shown when an authenticated user fails the admin panel login gate
 * (`profiles_admins` row + active org admin membership).
 */
export default function ForbiddenPage(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Access denied</h1>
      <p className="text-muted-foreground max-w-md text-center">
        This account does not have admin access. Sign in with an admin account
        or contact a platform administrator.
      </p>
      <Link className="lnk" href="/login">
        Back to login
      </Link>
    </main>
  );
}
