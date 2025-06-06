'use client';

import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface DashboardNavProps {
  user: User;
}

export function DashboardNav({ user }: DashboardNavProps) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <nav className="bg-midnight border-b border-electric-purple/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link 
            href="/dashboard" 
            className="text-xl font-bold bg-gradient-to-r from-electric-purple to-cyber-blue bg-clip-text text-transparent"
          >
            Grosonix
          </Link>
          
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/dashboard" 
                className="text-silver hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/dashboard/content" 
                className="text-silver hover:text-white transition-colors"
              >
                Content
              </Link>
              <Link 
                href="/dashboard/analytics" 
                className="text-silver hover:text-white transition-colors"
              >
                Analytics
              </Link>
              <Link 
                href="/dashboard/settings" 
                className="text-silver hover:text-white transition-colors"
              >
                Settings
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <span className="text-silver text-sm">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="text-cyber-blue hover:text-cyber-blue/80 transition-colors text-sm"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}