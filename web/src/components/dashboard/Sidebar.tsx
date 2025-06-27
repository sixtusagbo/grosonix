"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Target,
  Palette,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Menu,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
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
    name: "Saved Content",
    href: "/dashboard/saved-content",
    icon: BookOpen,
    description: "Your content library",
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
  },
  {
    name: "Goals",
    href: "/dashboard/goals",
    icon: Target,
    description: "Track progress",
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

export function Sidebar({ className, isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsedInternal, setIsCollapsedInternal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Use the prop if provided, otherwise use internal state
  const collapsed = isCollapsed !== undefined ? isCollapsed : isCollapsedInternal;

  // Check if current path matches a navigation item
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  // Initialize collapsed state based on screen size
  useEffect(() => {
    setIsMounted(true);
    
    // Set initial state based on screen width
    const handleResize = () => {
      if (window.innerWidth < 1024) { // md breakpoint is typically 768px, lg is 1024px
        setIsCollapsedInternal(true);
      } else {
        setIsCollapsedInternal(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Clean up event listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle navigation item click
  const handleNavClick = () => {
    // On medium screens and below, collapse sidebar after navigation
    if (window.innerWidth < 1024) {
      if (onToggle) {
        onToggle();
      } else {
        setIsCollapsedInternal(true);
      }
    }
  };

  // Handle toggle click
  const handleToggleClick = () => {
    if (onToggle) {
      onToggle();
    } else {
      setIsCollapsedInternal(!isCollapsedInternal);
    }
  };

  // Don't render anything during SSR to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div
        className={cn(
          "flex flex-col h-full bg-surface/95 backdrop-blur-xl border-r border-emerald-500/20 transition-all duration-300",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-surface/95 backdrop-blur-xl border-r border-emerald-500/20 transition-all duration-300 fixed lg:static z-50",
        collapsed ? "w-16" : "w-64",
        className
      )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-emerald-500/20">
        {!collapsed && (
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
          onClick={handleToggleClick}
          className="h-8 w-8 p-0 hover:bg-emerald-500/10 hover:text-emerald-400">
          {collapsed ? (
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
              onClick={handleNavClick}
              className={cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden",
                active
                  ? "bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/25"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover/50",
                collapsed ? "justify-center" : "justify-start"
              )}>
              {/* Active indicator */}
              {active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-r-full" />
              )}

              <Icon
                className={cn(
                  "flex-shrink-0 transition-all duration-200",
                  active ? "w-5 h-5 text-emerald-400" : "w-5 h-5",
                  collapsed ? "mx-0" : "mr-3"
                )}
              />

              {!collapsed && (
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
              onClick={handleNavClick}
              className={cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden",
                active
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover/50",
                collapsed ? "justify-center" : "justify-start"
              )}>
              <Icon
                className={cn(
                  "flex-shrink-0 transition-all duration-200",
                  active ? "w-5 h-5 text-emerald-400" : "w-5 h-5",
                  collapsed ? "mx-0" : "mr-3"
                )}
              />

              {!collapsed && (
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
      {!collapsed && (
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