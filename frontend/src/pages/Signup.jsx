import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Auto-login after signup if email confirmation is disabled
      if (data.session) {
        setTimeout(() => navigate('/upload'), 2000);
      }
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="card p-8">
            <div className="w-16 h-16 bg-[var(--green-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Account Created!</h2>
            <p className="text-[var(--text-tertiary)] mb-6">
              Your inspector account has been created successfully.
            </p>
            <Link
              to="/upload"
              className="btn btn-primary inline-flex px-6 py-3"
            >
              Start Inspecting
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src="/roadsense.png" alt="RoadSense" className="w-12 h-12 object-contain" />
            <span className="text-2xl font-semibold text-[var(--text-primary)]">RoadSense</span>
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Create Account</h1>
          <p className="text-[var(--text-tertiary)]">Sign up as a road inspector</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="bg-[var(--red-bg)] border border-[var(--red-border)] text-[var(--red)] px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--border)] rounded focus:outline-none focus:outline-2 focus:outline-[var(--teal)] transition-all"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--border)] rounded focus:outline-none focus:outline-2 focus:outline-[var(--teal)] transition-all"
                placeholder="inspector@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--border)] rounded focus:outline-none focus:outline-2 focus:outline-[var(--teal)] transition-all"
                placeholder="••••••••"
                minLength={6}
                required
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Minimum 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--text-tertiary)]">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--teal)] font-medium hover:opacity-80">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
