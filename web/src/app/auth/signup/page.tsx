import { SignUpForm } from "@/components/auth/SignUpForm";
import { Zap, Sparkles, ArrowRight, Users, Rocket } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-electric-orange-500/5 via-transparent to-emerald-500/5"></div>

      {/* Floating Elements */}
      <div className="absolute top-32 right-10 w-20 h-20 bg-electric-orange-500/10 rounded-full blur-xl animate-float"></div>
      <div
        className="absolute top-20 left-20 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl animate-float"
        style={{ animationDelay: "1s" }}></div>
      <div
        className="absolute bottom-32 right-32 w-24 h-24 bg-neon-cyan-500/10 rounded-full blur-xl animate-float"
        style={{ animationDelay: "3s" }}></div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-energy-gradient rounded-2xl mb-4 shadow-glow-orange">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-energy-gradient bg-clip-text text-transparent mb-2">
              Join Grosonix
            </h1>
            <p className="text-text-secondary">
              Start creating viral content with AI
            </p>
          </div>

          {/* Auth Card */}
          <div className="glass-card p-8 relative group">
            {/* Card Glow Effect */}
            <div className="absolute -inset-0.5 bg-energy-gradient rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur-sm"></div>
            <div className="relative">
              <SignUpForm />
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-center mt-6 space-y-4">
            <p className="text-text-muted text-sm">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition-colors">
                Sign in here
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>

            <div className="flex items-center justify-center gap-4 text-text-muted text-xs">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>10k+ creators</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>AI-powered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
