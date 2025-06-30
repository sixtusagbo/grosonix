"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import toast from "react-hot-toast";
import { GoogleAuthButton, GitHubAuthButton } from "./SocialAuthButton";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
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
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        }
      );

      if (signUpError) throw signUpError;

      if (authData.user) {
        toast.success("Account created successfully!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast.error(
        error.message || "Failed to create account. Please try again."
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
            htmlFor="fullName"
            className="block text-sm font-medium text-text-secondary mb-2 group-focus-within:text-electric-orange-400 transition-colors">
            Full Name
          </label>
          <div className="relative">
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="glass-input w-full px-4 py-3 rounded-xl text-text-primary placeholder:text-text-secondary focus:scale-[1.02] transition-all duration-200"
              placeholder="Enter your full name"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-electric-orange-500/20 to-emerald-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
        </div>

        <div className="group">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text-secondary mb-2 group-focus-within:text-electric-orange-400 transition-colors">
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
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-electric-orange-500/20 to-emerald-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
        </div>

        <div className="group">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text-secondary mb-2 group-focus-within:text-electric-orange-400 transition-colors">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="glass-input w-full px-4 py-3 rounded-xl text-text-primary placeholder:text-text-secondary focus:scale-[1.02] transition-all duration-200"
              placeholder="Create a strong password"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-electric-orange-500/20 to-emerald-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Must be at least 6 characters long
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          required
          className="w-4 h-4 mt-1 rounded border-border bg-surface text-electric-orange-500 focus:ring-electric-orange-500/20"
        />
        <label htmlFor="terms" className="text-sm text-text-muted">
          I agree to the{" "}
          <Link
            href="/terms"
            className="text-electric-orange-400 hover:text-electric-orange-300 transition-colors">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-electric-orange-400 hover:text-electric-orange-300 transition-colors">
            Privacy Policy
          </Link>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full relative group overflow-hidden bg-energy-gradient text-white font-semibold py-3 px-6 rounded-xl hover:shadow-glow-orange focus:outline-none focus:ring-2 focus:ring-electric-orange-500/50 disabled:opacity-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
        <span className="relative z-10">
          {loading ? "Creating account..." : "Create Account"}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-electric-orange-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>

      {/* TODO: Add OAuth signup later */}
      {/*
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-text-muted">
            or sign up with
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
