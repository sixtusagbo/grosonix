const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function upgradeUser(email, plan = 'pro') {
  try {
    console.log(`Looking for user with email: ${email}`);
    
    // First, get the user by email from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }
    
    const user = authUsers.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      return;
    }
    
    console.log(`Found user: ${user.id}`);
    
    // Check if user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileError);
      return;
    }
    
    // Create profile if it doesn't exist
    if (!profile) {
      console.log('Creating profile...');
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        });
      
      if (createProfileError) {
        console.error('Error creating profile:', createProfileError);
        return;
      }
      console.log('Profile created successfully');
    }
    
    // Check existing subscription
    const { data: existingSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (subError && subError.code !== 'PGRST116') {
      console.error('Error checking subscription:', subError);
      return;
    }
    
    const subscriptionData = {
      user_id: user.id,
      plan: plan,
      status: 'active',
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
    };
    
    if (existingSubscription) {
      // Update existing subscription
      console.log(`Updating existing subscription to ${plan}...`);
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return;
      }
      console.log(`Subscription updated to ${plan} successfully!`);
    } else {
      // Create new subscription
      console.log(`Creating new ${plan} subscription...`);
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData);
      
      if (insertError) {
        console.error('Error creating subscription:', insertError);
        return;
      }
      console.log(`${plan} subscription created successfully!`);
    }
    
    // Verify the upgrade
    const { data: newSubscription, error: verifyError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (verifyError) {
      console.error('Error verifying subscription:', verifyError);
      return;
    }
    
    console.log('✅ User upgrade completed!');
    console.log(`Email: ${email}`);
    console.log(`Plan: ${newSubscription.plan}`);
    console.log(`Status: ${newSubscription.status}`);
    console.log(`Expires: ${newSubscription.current_period_end}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Get email from command line argument
const email = process.argv[2];
const plan = process.argv[3] || 'pro';

if (!email) {
  console.error('Usage: node upgrade-user.js <email> [plan]');
  console.error('Example: node upgrade-user.js user@example.com pro');
  process.exit(1);
}

upgradeUser(email, plan);
