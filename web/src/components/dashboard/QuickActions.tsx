import Link from "next/link";
import {
  PlusIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

export function QuickActions() {
  const actions = [
    {
      name: "Generate Content",
      description: "Get AI-powered content suggestions",
      href: "/dashboard/content",
      icon: PlusIcon,
      color: "bg-electric-purple",
    },
    {
      name: "View Analytics",
      description: "Check your growth metrics",
      href: "/dashboard/analytics",
      icon: ChartBarIcon,
      color: "bg-cyber-blue",
    },
    {
      name: "Connect Accounts",
      description: "Link your social media accounts",
      href: "/dashboard/settings",
      icon: LinkIcon,
      color: "bg-neon-green",
    },
    {
      name: "Settings",
      description: "Manage your preferences",
      href: "/dashboard/settings",
      icon: Cog6ToothIcon,
      color: "bg-warning-orange",
    },
  ];

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold text-text-primary mb-6">
        Quick Actions
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className="group bg-surface rounded-lg p-4 border border-electric-purple/20 hover:border-electric-purple/40 transition-all duration-300 hover:transform hover:scale-105">
            <div className="flex items-start space-x-3">
              <div
                className={`${action.color} p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-text-primary group-hover:text-emerald-400 transition-colors">
                  {action.name}
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}