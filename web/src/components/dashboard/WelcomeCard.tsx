interface WelcomeCardProps {
  profile: {
    full_name: string | null;
  } | null;
}

export function WelcomeCard({ profile }: WelcomeCardProps) {
  return (
    <div className="glass-card p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
        Welcome back, {profile?.full_name || "User"}! 👋
      </h1>
      <p className="text-text-secondary">
        Track your social media growth and get AI-powered suggestions to boost
        your engagement.
      </p>
    </div>
  );
}