"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Sparkles,
  BarChart3,
  Settings,
  FileText,
  Zap,
  Users,
  Calendar,
  TrendingUp,
  Palette,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & metrics",
  },
  {
    name: "AI Content",
    href: "/dashboard/content",
    icon: Sparkles,
    description: "Generate content",
    badge: "AI",
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    description: "Growth insights",
  },
  {
    name: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    description: "Schedule posts",
    badge: "Soon",
  },
  {
    name: "Trends",
    href: "/dashboard/trends",
    icon: TrendingUp,
    description: "Viral content",
    badge: "New",
  },
  {
    name: "Team",
    href: "/dashboard/team",
    icon: Users,
    description: "Collaborate",
    badge: "Pro",
  },
];

const bottomNavigation = [
  {
    name: "API Docs",
    href: "/docs",
    icon: FileText,
    description: "Documentation",
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    description: "Preferences",
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-surface/95 backdrop-blur-xl border-r border-emerald-500/20 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-emerald-500/20">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-hero-gradient rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-hero-gradient bg-clip-text text-transparent">
              Grosonix
            </span>
          </Link>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-emerald-500/10 hover:text-emerald-400">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden",
                active
                  ? "bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/25"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover/50",
                isCollapsed ? "justify-center" : "justify-start"
              )}>
              {/* Active indicator */}
              {active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-r-full" />
              )}

              <Icon
                className={cn(
                  "flex-shrink-0 transition-all duration-200",
                  active ? "w-5 h-5 text-emerald-400" : "w-5 h-5",
                  isCollapsed ? "mx-0" : "mr-3"
                )}
              />

              {!isCollapsed && (
                <>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "px-2 py-0.5 text-xs font-semibold rounded-full",
                            item.badge === "AI" &&
                              "bg-emerald-500/20 text-emerald-400",
                            item.badge === "New" &&
                              "bg-electric-orange-500/20 text-electric-orange-400",
                            item.badge === "Soon" &&
                              "bg-neon-cyan-500/20 text-neon-cyan-400",
                            item.badge === "Pro" &&
                              "bg-electric-orange-500/20 text-electric-orange-400"
                          )}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 truncate">
                      {item.description}
                    </p>
                  </div>
                </>
              )}

              {/* Hover effect */}
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-emerald-500/20 space-y-2">
        {bottomNavigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden",
                active
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover/50",
                isCollapsed ? "justify-center" : "justify-start"
              )}>
              <Icon
                className={cn(
                  "flex-shrink-0 transition-all duration-200",
                  active ? "w-5 h-5 text-emerald-400" : "w-5 h-5",
                  isCollapsed ? "mx-0" : "mr-3"
                )}
              />

              {!isCollapsed && (
                <div className="flex-1">
                  <span className="truncate">{item.name}</span>
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Hover effect */}
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
            </Link>
          );
        })}
      </div>

      {/* Upgrade Banner */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="neo-brutal-card p-4 bg-gradient-to-br from-electric-orange-500/10 to-emerald-500/10">
            <div className="flex items-center space-x-2 mb-2">
              <Palette className="w-5 h-5 text-electric-orange-400" />
              <span className="font-semibold text-text-primary">
                Upgrade to Pro
              </span>
            </div>
            <p className="text-xs text-text-secondary mb-3">
              Unlock unlimited AI generations and advanced analytics
            </p>
            <Button size="sm" className="w-full neo-brutal-button text-xs">
              Upgrade Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
