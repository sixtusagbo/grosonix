import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="glass-card max-w-4xl w-full p-8 text-center">
        <h1 className="text-4xl font-bold mb-6 bg-hero-gradient bg-clip-text text-transparent">
          Welcome to Grosonix
        </h1>
        <p className="text-xl text-text-secondary mb-8">
          Transform your social media presence with AI-powered growth
          predictions
        </p>
        <div className="space-x-4">
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all">
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="inline-block px-6 py-3 border-2 border-neon-cyan-400 text-neon-cyan-400 rounded-lg hover:bg-neon-cyan-400 hover:text-charcoal-900 transition-all">
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
