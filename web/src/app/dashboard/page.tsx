import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { SocialAccounts } from '@/components/dashboard/SocialAccounts';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { GrowthChart } from '@/components/dashboard/GrowthChart';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';

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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <StatsGrid socialAccounts={socialAccounts} />
          <GrowthChart />
        </div>
        
        <div className="space-y-6">
          <QuickActions />
          <ActivityFeed />
        </div>
      </div>
      
      <SocialAccounts accounts={socialAccounts} />
    </div>
  );
}