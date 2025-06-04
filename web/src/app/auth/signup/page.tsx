import { SignUpForm } from '@/components/auth/SignUpForm';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-space p-4">
      <div className="glass-card w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-electric-purple to-cyber-blue bg-clip-text text-transparent">
          Create Account
        </h1>
        <SignUpForm />
      </div>
    </div>
  );
}