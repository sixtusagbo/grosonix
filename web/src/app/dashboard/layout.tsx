import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-deep-space">
      <DashboardNav user={session.user} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}