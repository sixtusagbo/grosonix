import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-space p-4">
      <div className="glass-card w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-electric-purple to-cyber-blue bg-clip-text text-transparent">
          Welcome Back
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}