"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import toast from "react-hot-toast";

interface SocialConnectionsProps {
  accounts: any[] | null;
}

export function SocialConnections({ accounts }: SocialConnectionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({});
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const platforms = [
    {
      id: "twitter",
      name: "Twitter",
      color: "text-cyber-blue",
      description: "Connect your Twitter account to track followers and engagement",
      icon: "🐦",
    },
    {
      id: "instagram",
      name: "Instagram", 
      color: "text-social-pink",
      description: "Link Instagram to analyze your visual content performance",
      icon: "📸",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      color: "text-linkedin-blue", 
      description: "Connect LinkedIn for professional content insights",
      icon: "💼",
    },
  ];

  useEffect(() => {
    // Initialize connection status
    const status: Record<string, boolean> = {};
    platforms.forEach(platform => {
      status[platform.id] = accounts?.some(a => a.platform === platform.id) || false;
    });
    setConnectionStatus(status);

    // Check for OAuth callback results
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success) {
      const platform = success.replace('_connected', '');
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`);
      setConnectionStatus(prev => ({ ...prev, [platform]: true }));
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (error) {
      toast.error(`Connection failed: ${error.replace(/_/g, ' ')}`);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [accounts]);

  const handleConnect = async (platformId: string) => {
    setLoading(platformId);

    try {
      const response = await fetch('/api/social/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform: platformId }),
      });

      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }

      const data = await response.json();
      
      // Redirect to OAuth URL
      window.location.href = data.auth_url;
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect ${platformId}`);
      setLoading(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    setLoading(platformId);

    try {
      const { error } = await supabase
        .from("social_accounts")
        .delete()
        .eq("platform", platformId);

      if (error) throw error;

      toast.success(`${platformId} disconnected successfully!`);
      setConnectionStatus(prev => ({ ...prev, [platformId]: false }));
      window.location.reload();
    } catch (error) {
      toast.error("Failed to disconnect account");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold text-white mb-6">
        Social Connections
      </h2>

      <div className="space-y-4">
        {platforms.map((platform) => {
          const isConnected = connectionStatus[platform.id];
          const isLoading = loading === platform.id;

          return (
            <div
              key={platform.id}
              className="bg-midnight rounded-lg p-4 border border-electric-purple/20 hover:border-electric-purple/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <span className={`font-medium ${platform.color}`}>
                    {platform.name}
                  </span>
                </div>

                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect(platform.id)}
                    disabled={isLoading}
                    className="text-danger-red hover:text-danger-red/80 text-sm disabled:opacity-50 transition-colors">
                    {isLoading ? "Disconnecting..." : "Disconnect"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(platform.id)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-electric-purple text-white rounded-md hover:bg-electric-purple/90 text-sm disabled:opacity-50 transition-all">
                    {isLoading ? "Connecting..." : "Connect"}
                  </button>
                )}
              </div>

              <p className="text-sm text-silver">{platform.description}</p>

              {isConnected && (
                <div className="mt-2 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                  <span className="text-xs text-neon-green">Connected & Active</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-midnight/50 rounded-lg border border-cyber-blue/20">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-cyber-blue/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-cyber-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-cyber-blue font-medium">
              Real Social Media Integration
            </p>
            <p className="text-xs text-silver mt-1">
              Connect your accounts to start tracking real follower growth, engagement metrics, and get AI-powered content suggestions based on your actual posting history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}