import Link from 'next/link';
import { User } from '@supabase/supabase-js';

interface DashboardNavProps {
  user: User;
}

export function DashboardNav({ user }: DashboardNavProps) {
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
          
          <div className="flex items-center space-x-4">
            <span className="text-silver">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-cyber-blue hover:text-cyber-blue/80 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}