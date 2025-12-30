'use server';

import type { ReactNode } from 'react';

/**
 * Simple starter login layout.
 */
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md bg-white dark:bg-background rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
          Iniciar sesión
        </h1>
        <main>{children}</main>
      </div>
    </div>
  );
}
