import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../config';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management System</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
        </div>

        {/* Login form */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3
                    text-sm text-gray-900 placeholder-gray-400 transition-colors
                    focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3
                    text-sm text-gray-900 placeholder-gray-400 transition-colors
                    focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5
                text-sm font-semibold text-white transition-colors
                hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="spinner h-4 w-4" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Create one
            </Link>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 rounded-xl bg-white p-4 shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2">Demo Credentials</p>
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-400">Admin:</span>
              <span className="font-mono text-gray-700">sarah.chen@acme.com / admin123</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">HR:</span>
              <span className="font-mono text-gray-700">marcus.williams@acme.com / admin123</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Employee:</span>
              <span className="font-mono text-gray-700">james.rodriguez@acme.com / user123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
