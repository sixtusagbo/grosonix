interface StatsGridProps {
  socialAccounts: any[] | null;
}

export function StatsGrid({ socialAccounts }: StatsGridProps) {
  const connectedPlatforms = socialAccounts?.length || 0;
  
  const stats = [
    {
      name: 'Connected Platforms',
      value: connectedPlatforms,
      change: '+0%',
      changeType: 'neutral' as const,
    },
    {
      name: 'Total Followers',
      value: '0',
      change: '+0%',
      changeType: 'neutral' as const,
    },
    {
      name: 'Engagement Rate',
      value: '0%',
      change: '+0%',
      changeType: 'neutral' as const,
    },
    {
      name: 'Growth Score',
      value: 'N/A',
      change: '+0%',
      changeType: 'neutral' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.name} className="glass-card p-6">
          <p className="text-sm text-silver">{stat.name}</p>
          <p className="text-2xl font-semibold text-white mt-2">{stat.value}</p>
          <p className={`text-sm mt-2 ${
            stat.changeType === 'increase' ? 'text-neon-green' :
            stat.changeType === 'decrease' ? 'text-danger-red' :
            'text-silver'
          }`}>
            {stat.change}
          </p>
        </div>
      ))}
    </div>
  );
}