import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AuthShell = ({ title, subtitle, children }) => {
  return (
    <main className="min-h-screen bg-background">
      <div className="page-shell grid min-h-screen items-center gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="hidden lg:block"
        >
          <Link to="/" className="mb-10 inline-flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary p-2">
              <img src="/images/logo.png" alt="GORUS" className="h-full w-full object-contain" />
            </span>
            <span>
              <span className="block text-sm font-black tracking-[0.18em] text-foreground">GORUS</span>
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pure dairy</span>
            </span>
          </Link>

          <div className="flex h-[520px] items-center justify-center rounded-lg border border-border bg-muted p-12">
            <img
              src="/images/logo.png"
              alt="GORUS symbol"
              className="h-full max-h-[360px] w-full max-w-[360px] object-contain"
            />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.04, ease: 'easeOut' }}
          className="mx-auto w-full max-w-md"
        >
          <Link to="/" className="mb-8 inline-flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary p-2">
              <img src="/images/logo.png" alt="GORUS" className="h-full w-full object-contain" />
            </span>
            <span className="text-sm font-black tracking-[0.18em] text-foreground">GORUS</span>
          </Link>

          <div className="mb-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-primary">Account</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-3 leading-7 text-muted-foreground">{subtitle}</p>}
          </div>

          <div className="premium-card p-5 sm:p-7">
            {children}
          </div>
        </motion.section>
      </div>
    </main>
  );
};

export default AuthShell;
