import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/upload');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src="/roadsense.png" alt="RoadSense" className="w-12 h-12 object-contain" />
            <span className="text-2xl font-semibold text-[var(--text-primary)]">RoadSense</span>
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Welcome back</h1>
          <p className="text-[var(--text-tertiary)]">Sign in to your inspector account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-[var(--red-bg)] border border-[var(--red-border)] text-[var(--red)] px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

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
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--text-tertiary)]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[var(--teal)] font-medium hover:opacity-80">
              Sign up
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
