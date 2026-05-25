import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border mt-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="flex flex-col gap-3">
            <img src="/images/logo.png" alt="GORAS" className="h-16 w-auto object-contain mb-2" />
            <p className="text-sm font-semibold text-primary -mt-2">Proof of 100% Purity</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium quality dairy products delivered fresh from our farm to your home.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold text-foreground mb-2">Contact Us</h3>
            <div className="flex items-center gap-2">
              <Phone size={18} className="text-primary shrink-0" />
              <a href="tel:+919876543210" className="text-sm text-foreground hover:text-primary transition-colors">+91 78383 80192</a>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-primary shrink-0" />
              <a href="mailto:Gorusorganics@gmail.com" className="text-sm text-foreground hover:text-primary transition-colors">
                Gorusorganics@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-primary shrink-0" />
              <span className="text-sm text-muted-foreground">Buxar, Bihar</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold text-foreground mb-2">Quick Links</h3>
            <Link to="/" className="text-sm text-foreground hover:text-primary transition-colors block">Home</Link>
            <Link to="/products" className="text-sm text-foreground hover:text-primary transition-colors block">Products</Link>
            <Link to="/cart" className="text-sm text-foreground hover:text-primary transition-colors block">Shopping Cart</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold text-foreground mb-2">Business Hours</h3>
            <p className="text-sm text-muted-foreground">Monday - Saturday</p>
            <p className="text-sm text-muted-foreground">Sunday: Closed</p>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 GORAS. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Made with 💚 for pure dairy lovers
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
