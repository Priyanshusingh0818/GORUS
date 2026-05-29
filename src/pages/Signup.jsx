import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signup(name, email, password);
      if (result.success) {
        navigate('/');
        return;
      }
      setError(result.error || 'Signup failed. Please try again.');
    } catch (err) {
      setError(err.message || 'Unable to create your account right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass = 'premium-input w-full bg-background pl-11';

  return (
    <AuthShell
      title="Create an account"
      subtitle="Save your details, track orders, and checkout faster on future GORUS deliveries."
    >
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 shrink-0 text-destructive" size={18} />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground" htmlFor="name">Full name</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input id="name" type="text" value={name} onChange={(event) => setName(event.target.value)} required className={fieldClass} placeholder="Your name" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground" htmlFor="email">Email address</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className={fieldClass} placeholder="you@example.com" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground" htmlFor="password">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required className={fieldClass} placeholder="Password" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground" htmlFor="confirmPassword">Confirm password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input id="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required className={fieldClass} placeholder="Confirm password" />
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="premium-button-primary w-full">
          {isLoading ? <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <>Create account <ArrowRight size={18} /></>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="font-semibold text-primary hover:text-primary/80">Sign in</Link>
      </p>
    </AuthShell>
  );
};

export default Signup;
