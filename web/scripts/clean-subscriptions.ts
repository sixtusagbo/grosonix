import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanSubscriptions() {
  try {
    console.log("🧹 Cleaning subscription data...");

    // Delete all subscription records
    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records

    if (subscriptionError) {
      console.error("❌ Error deleting subscriptions:", subscriptionError);
      return;
    }

    console.log("✅ All subscription records deleted");

    // Reset user subscription status (if you have a user_subscriptions table)
    const { error: userError } = await supabase
      .from("user_subscriptions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records

    if (userError && userError.code !== "PGRST116") {
      // PGRST116 = table doesn't exist
      console.error("❌ Error deleting user subscriptions:", userError);
      return;
    }

    if (userError?.code !== "PGRST116") {
      console.log("✅ All user subscription records deleted");
    }

    console.log("🎉 Subscription cleanup completed successfully!");
    console.log("📝 All users are now on the free plan");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  }
}

// Run the cleanup
cleanSubscriptions()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
