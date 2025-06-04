import { CalendarDaysIcon, ChartBarIcon, UserPlusIcon } from '@heroicons/react/24/outline';

const activities = [
  {
    id: 1,
    type: 'follower',
    description: 'No new followers yet',
    icon: UserPlusIcon,
    timestamp: 'Just now',
  },
  {
    id: 2,
    type: 'engagement',
    description: 'Waiting for engagement data',
    icon: ChartBarIcon,
    timestamp: '1h ago',
  },
  {
    id: 3,
    type: 'scheduled',
    description: 'No scheduled posts',
    icon: CalendarDaysIcon,
    timestamp: '2h ago',
  },
];

export function ActivityFeed() {
  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
      <div className="space-y-6">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-4">
            <div className="bg-midnight p-2 rounded-lg">
              <activity.icon className="w-5 h-5 text-cyber-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-silver">{activity.description}</p>
              <p className="text-sm text-muted">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}