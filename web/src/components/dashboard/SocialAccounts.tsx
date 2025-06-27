import Link from "next/link";

interface SocialAccountsProps {
  accounts: any[] | null;
}

export function SocialAccounts({ accounts }: SocialAccountsProps) {
  const platforms = [
    {
      id: "twitter",
      name: "Twitter",
      color: "text-cyber-blue",
      available: true,
      description: "Track followers & engagement",
    },
    {
      id: "instagram",
      name: "Instagram",
      color: "text-social-pink",
      available: true,
      description: "Analyze visual content performance",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      color: "text-linkedin-blue",
      available: true,
      description: "Professional insights",
    },
  ];

  return (
    <div className="glass-card p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-text-primary mb-4">
        Social Accounts
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map((platform) => {
          const isConnected = accounts?.some((a) => a.platform === platform.id);

          return (
            <div
              key={platform.id}
              className={`bg-surface rounded-lg p-4 border transition-all ${
                platform.available
                  ? "border-electric-purple/20 hover:border-electric-purple/40"
                  : "border-muted/20 opacity-60"
              }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${platform.color}`}>
                  {platform.name}
                </span>

                {platform.available ? (
                  isConnected ? (
                    <span className="text-neon-green text-sm flex items-center space-x-1">
                      <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                      <span>Connected</span>
                    </span>
                  ) : (
                    <Link
                      href="/dashboard/settings"
                      className="text-cyber-blue hover:text-cyber-blue/80 text-sm transition-colors">
                      Connect
                    </Link>
                  )
                ) : (
                  <span className="text-warning-orange text-xs px-2 py-1 bg-warning-orange/20 rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>

              <p className="text-xs text-text-muted">{platform.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        <div className="p-3 bg-cyber-blue/10 rounded-lg border border-cyber-blue/20">
          <p className="text-xs text-cyber-blue">
            <strong>Phase 2 Focus:</strong> Twitter and Instagram integration
            with real-time metrics. LinkedIn professional features coming in
            Phase 3!
          </p>
        </div>

        <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <p className="text-xs text-yellow-400">
            <strong>Twitter Free Plan:</strong> Limited to 1 timeline request
            per 15 minutes. Data refreshes automatically within these limits.
          </p>
        </div>
      </div>
    </div>
  );
}