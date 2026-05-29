import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Milk,
  Moon,
  Search,
  Settings,
  ShoppingCart,
  Sun,
  User,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navLinks = [
  { name: 'Products', path: '/products' },
  { name: 'Milk Subscription', path: '/subscriptions' },
  { name: 'Available', path: '/products/available' },
  { name: 'Latest', path: '/products/latest' }
];

const Navbar = () => {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { getCartCount, openCart } = useCart();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = getCartCount();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    setIsAccountOpen(false);
  }, [location.pathname]);

  const isProductPath = location.pathname.startsWith('/products') || location.pathname.startsWith('/category');
  const isActive = (path) => location.pathname === path || (path === '/products' && location.pathname.startsWith('/category'));

  const submitSearch = (event) => {
    event?.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    navigate('/products', {
      replace: isProductPath,
      state: { filters: { search: query }, source: 'navbar-search' }
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = (path) => (
    `relative rounded-full px-4 py-2 text-sm font-semibold transition duration-200 ${
      isActive(path)
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'text-foreground/80 hover:bg-muted hover:text-foreground'
    }`
  );

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        isScrolled
          ? 'border-border/80 bg-background/90 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl'
          : 'border-transparent bg-background/95'
      }`}
    >
      <div className="page-shell">
        <div className="flex min-h-[72px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary p-2">
              <img src="/images/logo.png" alt="GORUS" className="h-full w-full object-contain" loading="eager" />
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-black tracking-[0.18em] text-foreground">GORUS</span>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Pure dairy</span>
            </span>
          </Link>

          <nav className="hidden items-center rounded-full border border-border bg-card p-1 shadow-sm lg:flex" aria-label="Primary navigation">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} className={linkClass(link.path)}>
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden flex-1 justify-center px-2 md:flex lg:max-w-sm">
            <form onSubmit={submitSearch} className="relative w-full">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products"
                aria-label="Search products"
                className="premium-input w-full rounded-full pl-11 pr-4"
              />
            </form>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="premium-button-secondary h-11 w-11 px-0"
              aria-label="Toggle color mode"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative hidden sm:block">
              {user ? (
                <button
                  type="button"
                  onClick={() => setIsAccountOpen(open => !open)}
                  className="premium-button-secondary"
                  aria-expanded={isAccountOpen}
                >
                  <User size={18} />
                  <span className="max-w-[90px] truncate">{user.name.split(' ')[0]}</span>
                </button>
              ) : (
                <Link to="/login" className="premium-button-secondary">
                  <User size={18} />
                  Account
                </Link>
              )}

              <AnimatePresence>
                {isAccountOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute right-0 mt-3 w-56 overflow-hidden rounded-lg border border-border bg-background shadow-[0_20px_60px_rgba(15,23,42,0.14)]"
                  >
                    <div className="border-b border-border px-4 py-3">
                      <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted">
                      <Settings size={16} /> Profile
                    </Link>
                    <Link to="/dashboard" className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted">
                      <LayoutDashboard size={16} /> My Orders
                    </Link>
                    <Link to="/subscriptions" className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted">
                      <Milk size={16} /> Milk Subscription
                    </Link>
                    {user.is_admin && (
                      <>
                        <Link to="/admin" className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted">
                          <User size={16} /> Admin Panel
                        </Link>
                        <Link to="/admin/subscriptions" className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted">
                          <Milk size={16} /> Subscription Admin
                        </Link>
                        <Link to="/admin/delivery-requests" className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted">
                          <MapPin size={16} /> Delivery Requests
                        </Link>
                      </>
                    )}
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm font-semibold text-destructive hover:bg-destructive/10">
                      <LogOut size={16} /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button type="button" onClick={openCart} className="premium-button-secondary relative h-11 w-11 px-0 sm:w-auto sm:px-4" aria-label="Cart">
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground ring-2 ring-background">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsMobileOpen(open => !open)}
              className="premium-button-secondary h-11 w-11 px-0 lg:hidden"
              aria-label="Open menu"
              aria-expanded={isMobileOpen}
            >
              {isMobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden border-t border-border bg-background lg:hidden"
          >
            <div className="page-shell py-4">
              <form onSubmit={submitSearch} className="relative mb-4 md:hidden">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search products"
                  aria-label="Search products"
                  className="premium-input w-full rounded-full pl-11 pr-4"
                />
              </form>

              <nav className="grid gap-2" aria-label="Mobile navigation">
                {navLinks.map(link => (
                  <Link key={link.path} to={link.path} className={`${linkClass(link.path)} flex min-h-[46px] items-center justify-center`}>
                    {link.name}
                  </Link>
                ))}
                {!user && (
                  <Link to="/login" className="premium-button-secondary justify-center sm:hidden">
                    <User size={18} /> Account
                  </Link>
                )}
                {user && (
                  <>
                    <Link to="/profile" className="premium-button-secondary justify-center sm:hidden">
                      <Settings size={18} /> Profile
                    </Link>
                    <Link to="/subscriptions" className="premium-button-secondary justify-center sm:hidden">
                      <Milk size={18} /> Milk Subscription
                    </Link>
                    {user.is_admin && (
                      <>
                        <Link to="/admin/subscriptions" className="premium-button-secondary justify-center sm:hidden">
                          <Milk size={18} /> Subscription Admin
                        </Link>
                        <Link to="/admin/delivery-requests" className="premium-button-secondary justify-center sm:hidden">
                          <MapPin size={18} /> Delivery Requests
                        </Link>
                      </>
                    )}
                    <button type="button" onClick={handleLogout} className="premium-button-secondary justify-center text-destructive sm:hidden">
                      <LogOut size={18} /> Sign out
                    </button>
                  </>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
