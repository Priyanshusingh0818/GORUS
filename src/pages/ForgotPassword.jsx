import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import AuthShell from '../components/AuthShell';
import { authAPI } from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const response = await authAPI.forgotPassword(email);
      setStatus('success');
      setMessage(response.message || 'If an account with that email exists, we sent a password reset link.');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter your account email and we will send reset instructions.">
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle size={32} />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">Check your inbox</h2>
            <p className="mb-8 text-muted-foreground">{message}</p>
            <Link to="/login" className="premium-button-primary w-full">
              Return to login
            </Link>
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
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-foreground">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="premium-input w-full bg-background pl-11"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button type="submit" disabled={status === 'loading'} className="premium-button-primary w-full">
              {status === 'loading' ? <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : 'Send reset link'}
            </button>

            <Link to="/login" className="premium-button-secondary w-full">
              <ArrowLeft size={16} />
              Back to login
            </Link>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
};

export default ForgotPassword;
