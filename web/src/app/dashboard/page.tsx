import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { SocialAccounts } from '@/components/dashboard/SocialAccounts';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  const { data: socialAccounts } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', user?.id);

  return (
    <div className="space-y-6">
      <WelcomeCard profile={profile} />
      <StatsGrid socialAccounts={socialAccounts} />
      <SocialAccounts accounts={socialAccounts} />
    </div>
  );
}