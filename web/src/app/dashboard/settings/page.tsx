import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { ProfileSettings } from '@/components/dashboard/ProfileSettings';
import { SocialConnections } from '@/components/dashboard/SocialConnections';

export default async function SettingsPage() {
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
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-silver">
          Manage your account settings and social media connections.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileSettings profile={profile} />
        <SocialConnections accounts={socialAccounts} />
      </div>
    </div>
  );
}