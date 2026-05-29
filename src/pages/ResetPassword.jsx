import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import AuthShell from '../components/AuthShell';
import { authAPI } from '../utils/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMessage('Invalid password reset link. Please request a new one.');
    }
  }, [token, email]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token || !email) return;

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters.');
      return;
    }

    setStatus('loading');
    try {
      const response = await authAPI.resetPassword(email, token, password);
      setStatus('success');
      setMessage(response.message || 'Your password has been successfully reset.');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Failed to reset password. The link might be expired.');
    }
  };

  const fieldClass = 'premium-input w-full bg-background pl-11 pr-12';

  return (
    <AuthShell title="Create new password" subtitle="Choose a fresh password for your GORUS account.">
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle size={32} />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">Password reset complete</h2>
            <p className="mb-8 text-muted-foreground">{message}</p>
            <button type="button" onClick={() => navigate('/login')} className="premium-button-primary w-full">
              Continue to login
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="space-y-5" onSubmit={handleSubmit}>
            {status === 'error' && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                <AlertCircle className="mt-0.5 shrink-0 text-destructive" size={18} />
                <p className="text-sm font-medium text-destructive">{message}</p>
              </div>
            )}

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-foreground">New password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={fieldClass}
                  placeholder="New password"
                  disabled={!token}
                />
                <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-foreground">Confirm password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={fieldClass}
                  placeholder="Confirm password"
                  disabled={!token}
                />
              </div>
            </div>

            <button type="submit" disabled={status === 'loading' || !token} className="premium-button-primary w-full">
              {status === 'loading' ? <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : 'Reset password'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
};

export default ResetPassword;
