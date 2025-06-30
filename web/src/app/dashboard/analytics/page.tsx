import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
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

  // Get user's social accounts
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let socialAccounts = null;

  if (user) {
    const { data } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", user.id);
    socialAccounts = data;
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-theme-primary mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-theme-secondary">
          Track your social media growth and engagement metrics across all
          platforms.
        </p>
      </div>

      <DashboardMetrics socialAccounts={socialAccounts} />

      <div className="glass-card p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-theme-primary mb-2">
            Advanced Analytics Coming Soon
          </h3>
          <p className="text-theme-secondary max-w-md mx-auto">
            Connect your social accounts to unlock detailed analytics, growth
            predictions, and performance insights.
          </p>
        </div>
      </div>
    </div>
  );
}