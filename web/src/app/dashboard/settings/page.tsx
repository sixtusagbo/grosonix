import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { ProfileSettings } from "@/components/dashboard/ProfileSettings";
import { SocialConnections } from "@/components/dashboard/SocialConnections";
import { CacheManager } from "@/components/dashboard/CacheManager";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";

export default async function SettingsPage() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  const { data: socialAccounts } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("user_id", user?.id);

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

      {/* Notification Settings */}
      {user && <NotificationSettings userId={user.id} />}

      {/* Cache Management */}
      <CacheManager />
    </div>
  );
}
