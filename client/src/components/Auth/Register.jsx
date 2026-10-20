import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../config';
import { User, Mail, Lock, Phone, UserPlus, AlertCircle } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white mb-4">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-1 text-sm text-gray-500">Join your organization</p>
        </div>

        {/* Register form */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-gray-700">
                  First name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3
                      text-sm text-gray-900 placeholder-gray-400 transition-colors
                      focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="John"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3
                      text-sm text-gray-900 placeholder-gray-400 transition-colors
                      focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3
                    text-sm text-gray-900 placeholder-gray-400 transition-colors
                    focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3
                    text-sm text-gray-900 placeholder-gray-400 transition-colors
                    focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="+1-555-0000"
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
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3
                    text-sm text-gray-900 placeholder-gray-400 transition-colors
                    focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Minimum 6 characters</p>
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
                  <UserPlus className="h-4 w-4" />
                  Create account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
