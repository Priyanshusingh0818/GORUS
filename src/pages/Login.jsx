import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = typeof location.state?.redirectTo === 'string' && location.state.redirectTo.startsWith('/')
    ? location.state.redirectTo
    : '/';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate(redirectTo, { replace: true });
        return;
      }
      setError(result.error === 'SESSION_EXPIRED' ? 'Invalid email or password. Please try again.' : result.error || 'Login failed.');
    } catch (err) {
      setError(err.message === 'SESSION_EXPIRED' ? 'Invalid email or password. Please try again.' : err.message || 'Unable to sign in right now.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage orders, checkout faster, and continue shopping fresh GORUS dairy."
    >
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 shrink-0 text-destructive" size={18} />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground" htmlFor="email">Email address</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="premium-input w-full bg-background pl-11"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-semibold text-foreground" htmlFor="password">Password</label>
            <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm font-semibold text-primary hover:text-primary/80">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="premium-input w-full bg-background pl-11"
              placeholder="Password"
            />
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="premium-button-primary w-full">
          {isLoading ? <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <>Sign in <ArrowRight size={18} /></>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to GORUS? <Link to="/signup" className="font-semibold text-primary hover:text-primary/80">Create an account</Link>
      </p>
    </AuthShell>
  );
};

export default Login;
