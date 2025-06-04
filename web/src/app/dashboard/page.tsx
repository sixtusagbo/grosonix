import { headers } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { SocialAccounts } from '@/components/dashboard/SocialAccounts';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { GrowthChart } from '@/components/dashboard/GrowthChart';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies: () => headers().get('cookie') });
  
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
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WelcomeCard profile={profile} />
        </div>
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full py-2 px-4 bg-electric-purple text-white rounded-lg hover:bg-opacity-90 transition-all">
              New Post
            </button>
            <button className="w-full py-2 px-4 border-2 border-cyber-blue text-cyber-blue rounded-lg hover:bg-cyber-blue hover:text-white transition-all">
              Schedule Content
            </button>
          </div>
        </div>
      </div>

      <StatsGrid socialAccounts={socialAccounts} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GrowthChart />
        <ActivityFeed />
      </div>

      <SocialAccounts accounts={socialAccounts} />
    </div>
  );
}