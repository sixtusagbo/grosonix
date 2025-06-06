'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';

interface SocialConnectionsProps {
  accounts: any[] | null;
}

export function SocialConnections({ accounts }: SocialConnectionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const platforms = [
    { 
      id: 'twitter', 
      name: 'Twitter', 
      color: 'text-cyber-blue',
      description: 'Connect your Twitter account to track followers and engagement'
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      color: 'text-social-pink',
      description: 'Link Instagram to analyze your visual content performance'
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      color: 'text-linkedin-blue',
      description: 'Connect LinkedIn for professional content insights'
    },
  ];

  const handleConnect = async (platformId: string) => {
    setLoading(platformId);
    
    // Simulate connection process
    setTimeout(() => {
      toast.success(`${platformId} connection coming soon!`);
      setLoading(null);
    }, 2000);
  };

  const handleDisconnect = async (platformId: string) => {
    setLoading(platformId);
    
    try {
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('platform', platformId);

      if (error) throw error;

      toast.success(`${platformId} disconnected successfully!`);
      window.location.reload();
    } catch (error) {
      toast.error('Failed to disconnect account');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Social Connections</h2>
      
      <div className="space-y-4">
        {platforms.map((platform) => {
          const isConnected = accounts?.some(a => a.platform === platform.id);
          const isLoading = loading === platform.id;
          
          return (
            <div key={platform.id} className="bg-midnight rounded-lg p-4 border border-electric-purple/20">
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${platform.color}`}>
                  {platform.name}
                </span>
                
                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect(platform.id)}
                    disabled={isLoading}
                    className="text-danger-red hover:text-danger-red/80 text-sm disabled:opacity-50"
                  >
                    {isLoading ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(platform.id)}
                    disabled={isLoading}
                    className="text-cyber-blue hover:text-cyber-blue/80 text-sm disabled:opacity-50"
                  >
                    {isLoading ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
              
              <p className="text-sm text-silver">
                {platform.description}
              </p>
              
              {isConnected && (
                <div className="mt-2 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                  <span className="text-xs text-neon-green">Connected</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 p-4 bg-midnight/50 rounded-lg border border-warning-orange/20">
        <p className="text-sm text-warning-orange">
          <strong>Coming Soon:</strong> Social media integrations are currently in development. 
          You'll be able to connect your accounts and start tracking your growth metrics soon!
        </p>
      </div>
    </div>
  );
}