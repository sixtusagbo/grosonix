"use client";

import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Bell, Search, User as UserIcon, LogOut, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardNavProps {
  user: User;
}

export function DashboardNav({ user }: DashboardNavProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <nav className="bg-surface/95 backdrop-blur-xl border-b border-emerald-500/20 sticky top-0 z-40">
      <div className="px-6">
        <div className="flex items-center justify-between h-16">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
              <input
                type="text"
                placeholder="Search content, analytics, settings..."
                className="glass-input w-full pl-10 pr-4 py-2 text-sm"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationCenter userId={user.id} />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 px-3 hover:bg-emerald-500/10 hover:text-emerald-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-hero-gradient rounded-full flex items-center justify-center">
                      <UserIcon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-secondary">
                      {user.email?.split("@")[0]}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 glass-card border-emerald-500/20 bg-surface/90 backdrop-blur-xl">
                <DropdownMenuLabel className="text-emerald-400">
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer hover:bg-emerald-500/10">
                  <UserIcon className="h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer hover:bg-emerald-500/10">
                  <Crown className="h-4 w-4 text-electric-orange-400" />
                  <span>Upgrade to Pro</span>
                  <div className="ml-auto px-2 py-0.5 bg-electric-orange-500/20 text-electric-orange-400 text-xs rounded-full">
                    New
                  </div>
                </DropdownMenuItem>

                <Link href="/dashboard/settings">
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer hover:bg-emerald-500/10">
                    <UserIcon className="h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </Link>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2 cursor-pointer hover:bg-red-500/10 text-red-400">
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
