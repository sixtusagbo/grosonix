import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { SocialAccounts } from "@/components/dashboard/SocialAccounts";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { GrowthChart } from "@/components/dashboard/GrowthChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

export default async function DashboardPage() {
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

  // Create service role client for profile creation (bypasses RLS)
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

  if (!user) {
    return null;
  }

  // Get or create profile
  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // If profile doesn't exist, create it using service role
  if (!profile) {
    console.log('Creating profile for user on dashboard:', user.id);
    const { data: newProfile, error: createError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || null,
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating profile on dashboard:', createError);
    } else {
      profile = newProfile;
    }
  }

  const { data: socialAccounts } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("user_id", user.id);

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