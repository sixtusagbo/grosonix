import { LoginForm } from "@/components/auth/LoginForm";
import { Zap, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-neon-cyan-500/5"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl animate-float"></div>
      <div
        className="absolute top-40 right-20 w-32 h-32 bg-electric-orange-500/10 rounded-full blur-xl animate-float"
        style={{ animationDelay: "2s" }}></div>
      <div
        className="absolute bottom-20 left-20 w-24 h-24 bg-neon-cyan-500/10 rounded-full blur-xl animate-float"
        style={{ animationDelay: "4s" }}></div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-hero-gradient rounded-2xl mb-4 shadow-glow-emerald">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-hero-gradient bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-text-secondary">
              Sign in to continue your creative journey
            </p>
          </div>

          {/* Auth Card */}
          <div className="glass-card p-8 relative group">
            {/* Card Glow Effect */}
            <div className="absolute -inset-0.5 bg-hero-gradient rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur-sm"></div>
            <div className="relative">
              <LoginForm />
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-center mt-6 space-y-4">
            <p className="text-text-muted text-sm">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition-colors">
                Create one now
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>

            <div className="flex items-center justify-center gap-2 text-text-muted text-xs">
              <Sparkles className="w-3 h-3" />
              <span>Powered by Grosonix AI</span>
              <Sparkles className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
