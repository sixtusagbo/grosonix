import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Zap, Sparkles, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan-500/5 via-transparent to-emerald-500/5"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-neon-cyan-500/10 rounded-full blur-xl animate-float-slow"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl animate-float-medium"></div>
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-electric-orange-500/10 rounded-full blur-xl animate-float-fast"></div>
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Link 
            href="/auth/login"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-emerald-400 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-cyber-gradient rounded-2xl mb-4 shadow-glow-cyan">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-cyber-gradient bg-clip-text text-transparent mb-2">
              Reset Password
            </h1>
            <p className="text-text-secondary">
              Enter your email to receive reset instructions
            </p>
          </div>

          {/* Auth Card */}
          <div className="glass-card p-8 relative group">
            {/* Card Glow Effect */}
            <div className="absolute -inset-0.5 bg-cyber-gradient rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur-sm"></div>
            <div className="relative">
              <ForgotPasswordForm />
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-center mt-6 space-y-4">
            <p className="text-text-muted text-sm">
              Remember your password?{' '}
              <Link 
                href="/auth/login" 
                className="text-neon-cyan-400 hover:text-neon-cyan-300 font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
            
            <div className="flex items-center justify-center gap-2 text-text-muted text-xs">
              <Sparkles className="w-3 h-3" />
              <span>Secure password recovery</span>
              <Sparkles className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
