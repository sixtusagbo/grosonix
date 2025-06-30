import { createBrowserClient } from '@supabase/ssr';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      created_at: user.created_at || '',
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
