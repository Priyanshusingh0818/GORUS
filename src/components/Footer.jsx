import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-20 border-t border-border bg-background">
      <div className="page-shell py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary p-2">
                <img src="/images/logo.png" alt="GORUS" className="h-full w-full object-contain" loading="lazy" />
              </span>
              <div>
                <p className="text-sm font-black tracking-[0.18em] text-foreground">GORUS</p>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pure dairy</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Premium dairy products delivered fresh with clear pricing, clean browsing, and dependable service.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-foreground">Contact</h3>
            <div className="grid gap-3">
              <a href="tel:+917838380192" className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary">
                <Phone size={17} className="shrink-0" /> +91 78383 80192
              </a>
              <a href="mailto:Gorusorganics@gmail.com" className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary">
                <Mail size={17} className="shrink-0" /> Gorusorganics@gmail.com
              </a>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={17} className="shrink-0" /> Buxar, Bihar
              </span>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-foreground">Shop</h3>
            <div className="grid gap-3">
              <Link to="/" className="text-sm text-muted-foreground transition hover:text-primary">Home</Link>
              <Link to="/products" className="text-sm text-muted-foreground transition hover:text-primary">Products</Link>
              <Link to="/products/available" className="text-sm text-muted-foreground transition hover:text-primary">Available now</Link>
              <Link to="/cart" className="text-sm text-muted-foreground transition hover:text-primary">Cart</Link>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-foreground">Hours</h3>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <p>Monday - Saturday</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 GORUS. All rights reserved.</p>
          <p>Fresh dairy, cleanly delivered.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
