"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import toast from "react-hot-toast";
import { CheckCircle, Mail } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success("Password reset email sent!");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(
        error.message || "Failed to send reset email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-text-primary">
            Check your email
          </h3>
          <p className="text-text-secondary">
            We've sent password reset instructions to{" "}
            <span className="text-emerald-400 font-medium">{email}</span>
          </p>
        </div>

        <div className="bg-surface/50 rounded-xl p-4 border border-border">
          <p className="text-sm text-text-muted">
            Didn't receive the email? Check your spam folder or{" "}
            <button
              onClick={() => setEmailSent(false)}
              className="text-neon-cyan-400 hover:text-neon-cyan-300 transition-colors">
              try again
            </button>
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
            htmlFor="email"
            className="block text-sm font-medium text-text-secondary mb-2 group-focus-within:text-neon-cyan-400 transition-colors">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-text-muted" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-text-primary placeholder:text-text-secondary focus:scale-[1.02] transition-all duration-200"
              placeholder="Enter your email address"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon-cyan-500/20 to-emerald-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
        </div>
      </div>

      <div className="bg-surface/50 rounded-xl p-4 border border-border">
        <p className="text-sm text-text-secondary">
          We'll send you a secure link to reset your password. The link will
          expire in 1 hour for security.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full relative group overflow-hidden bg-cyber-gradient text-white font-semibold py-3 px-6 rounded-xl hover:shadow-glow-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan-500/50 disabled:opacity-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
        <span className="relative z-10">
          {loading ? "Sending..." : "Send Reset Link"}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>
    </form>
  );
}
