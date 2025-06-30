"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import toast from "react-hot-toast";
import { CheckCircle, Lock, Eye, EyeOff } from "lucide-react";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Check if we have the necessary tokens from the URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      toast.error("Invalid reset link. Please request a new one.");
      router.push('/auth/forgot-password');
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setPasswordReset(true);
      toast.success("Password updated successfully!");
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(
        error.message || "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (passwordReset) {
    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-text-primary">
            Password Updated!
          </h3>
          <p className="text-text-secondary">
            Your password has been successfully updated. You'll be redirected to the login page.
          </p>
        </div>

        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
          <p className="text-sm text-emerald-400">
            Redirecting you to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="group">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text-secondary mb-2 group-focus-within:text-emerald-400 transition-colors">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-text-muted" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="glass-input w-full pl-10 pr-12 py-3 rounded-xl text-text-primary placeholder:text-text-muted focus:scale-[1.02] transition-all duration-200"
              placeholder="Enter your new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-secondary transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/20 to-neon-cyan-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
        </div>

        <div className="group">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-text-secondary mb-2 group-focus-within:text-emerald-400 transition-colors">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-text-muted" />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="glass-input w-full pl-10 pr-12 py-3 rounded-xl text-text-primary placeholder:text-text-muted focus:scale-[1.02] transition-all duration-200"
              placeholder="Confirm your new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-secondary transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/20 to-neon-cyan-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Password Requirements */}
      <div className="bg-surface/30 rounded-xl p-4 border border-border/50">
        <h4 className="text-sm font-medium text-text-secondary mb-2">Password Requirements:</h4>
        <ul className="text-xs text-text-muted space-y-1">
          <li className={`flex items-center gap-2 ${password.length >= 6 ? 'text-emerald-400' : ''}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 6 ? 'bg-emerald-400' : 'bg-text-muted'}`}></div>
            At least 6 characters long
          </li>
          <li className={`flex items-center gap-2 ${password === confirmPassword && password.length > 0 ? 'text-emerald-400' : ''}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${password === confirmPassword && password.length > 0 ? 'bg-emerald-400' : 'bg-text-muted'}`}></div>
            Passwords match
          </li>
        </ul>
      </div>

      <button
        type="submit"
        disabled={loading || password !== confirmPassword || password.length < 6}
        className="w-full relative group overflow-hidden bg-hero-gradient text-white font-semibold py-3 px-6 rounded-xl hover:shadow-glow-emerald focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
        <span className="relative z-10">
          {loading ? "Updating Password..." : "Update Password"}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-neon-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>
    </form>
  );
}
