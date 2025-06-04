import Link from 'next/link';

interface SocialAccountsProps {
  accounts: any[] | null;
}

export function SocialAccounts({ accounts }: SocialAccountsProps) {
  const platforms = [
    { id: 'twitter', name: 'Twitter', color: 'text-cyber-blue' },
    { id: 'instagram', name: 'Instagram', color: 'text-social-pink' },
    { id: 'linkedin', name: 'LinkedIn', color: 'text-linkedin-blue' },
  ];

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Social Accounts</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map((platform) => {
          const isConnected = accounts?.some(a => a.platform === platform.id);
          
          return (
            <div key={platform.id} className="bg-midnight rounded-lg p-4 border border-electric-purple/20">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${platform.color}`}>
                  {platform.name}
                </span>
                
                {isConnected ? (
                  <span className="text-neon-green text-sm">Connected</span>
                ) : (
                  <Link
                    href={`/dashboard/connect/${platform.id}`}
                    className="text-cyber-blue hover:text-cyber-blue/80 text-sm"
                  >
                    Connect
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}