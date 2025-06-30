"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import toast from "react-hot-toast";
import { GoogleAuthButton, GitHubAuthButton } from "./SocialAuthButton";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Signed in successfully!");
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error(
        error.message || "Failed to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="group">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text-secondary mb-2 group-focus-within:text-emerald-400 transition-colors">
            Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="glass-input w-full px-4 py-3 rounded-xl text-text-primary placeholder:text-text-secondary focus:scale-[1.02] transition-all duration-200"
              placeholder="Enter your email"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/20 to-neon-cyan-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
        </div>

        <div className="group">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text-secondary mb-2 group-focus-within:text-emerald-400 transition-colors">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="glass-input w-full px-4 py-3 rounded-xl text-text-primary placeholder:text-text-secondary focus:scale-[1.02] transition-all duration-200"
              placeholder="Enter your password"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/20 to-neon-cyan-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-text-secondary">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-border bg-surface text-emerald-500 focus:ring-emerald-500/20"
          />
          Remember me
        </label>
        <Link
          href="/auth/forgot-password"
          className="text-emerald-400 hover:text-emerald-300 transition-colors">
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full relative group overflow-hidden bg-hero-gradient text-white font-semibold py-3 px-6 rounded-xl hover:shadow-glow-emerald focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
        <span className="relative z-10">
          {loading ? "Signing in..." : "Sign In"}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-neon-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>

      {/* TODO: Add OAuth login later */}
      {/*
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-text-muted">
            or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GoogleAuthButton
          onClick={() => {
            // TODO: Implement Google OAuth
            console.log("Google auth clicked");
          }}
        />
        <GitHubAuthButton
          onClick={() => {
            // TODO: Implement GitHub OAuth
            console.log("GitHub auth clicked");
          }}
        />
      </div>
      */}
    </form>
  );
}
