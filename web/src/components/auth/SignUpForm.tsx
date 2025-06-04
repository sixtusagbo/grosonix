'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: (await supabase.auth.getUser()).data.user?.id, email, full_name: fullName }]);

      if (profileError) throw profileError;

      router.push('/dashboard');
      router.refresh();
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-silver">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md bg-midnight border-silver/20 text-white focus:border-cyber-blue focus:ring focus:ring-cyber-blue/20"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-silver">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md bg-midnight border-silver/20 text-white focus:border-cyber-blue focus:ring focus:ring-cyber-blue/20"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-silver">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="mt-1 block w-full rounded-md bg-midnight border-silver/20 text-white focus:border-cyber-blue focus:ring focus:ring-cyber-blue/20"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-electric-purple text-white rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-purple disabled:opacity-50 transition-all"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </button>

      <p className="text-center text-sm text-silver">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-cyber-blue hover:text-opacity-80">
          Sign in
        </Link>
      </p>
    </form>
  );
}