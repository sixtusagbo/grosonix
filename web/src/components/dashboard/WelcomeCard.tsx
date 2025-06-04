interface WelcomeCardProps {
  profile: {
    full_name: string | null;
  } | null;
}

export function WelcomeCard({ profile }: WelcomeCardProps) {
  return (
    <div className="glass-card p-6">
      <h1 className="text-2xl font-bold text-white mb-2">
        Welcome back, {profile?.full_name || 'User'}! 👋
      </h1>
      <p className="text-silver">
        Track your social media growth and get AI-powered suggestions to boost your engagement.
      </p>
    </div>
  );
}