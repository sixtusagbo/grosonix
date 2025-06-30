import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SubscriptionDashboard } from "@/components/subscription/SubscriptionDashboard";

export const dynamic = 'force-dynamic';

export default async function SubscriptionPage() {
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-text-secondary">Please log in to view your subscription.</p>
        </div>
      </div>
    );
  }

  // Get current subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Subscription Management
          </h1>
          <p className="text-text-secondary">
            Manage your subscription, view usage, and upgrade your plan.
          </p>
        </div>

        <SubscriptionDashboard 
          userId={user.id}
          currentSubscription={subscription}
        />
      </div>
    </div>
  );
}
