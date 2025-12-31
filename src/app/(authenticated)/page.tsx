'use server';

import { createClient } from '@/lib/supabase/core/server';
import { redirect } from 'next/navigation';
import Header from './header';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-b from-[#0D47A1] via-[#2196F3] to-[#B3E5FC]"
      style={{
        background:
          'linear-gradient(180deg, #0D47A1 0%, #2196F3 50%, #B3E5FC 100%)',
      }}
    >
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome</h1>
        </div>
      </div>
    </div>
  );
}
