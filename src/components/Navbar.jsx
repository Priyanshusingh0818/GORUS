import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Search, Phone, ChevronDown, LayoutDashboard, Settings, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ContactForm from './ContactForm';
import PillNav from './PillNav';

const Navbar = () => {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { getCartCount } = useCart();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = getCartCount();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsAccountDropdownOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: 'Products', path: '/products' },
    { name: 'Available', path: '/products?available=1' },
    { name: 'Latest', path: '/products?sort=latest' },
  ];

  return (
    <>
      <header className="w-full flex flex-col z-50 sticky top-0 bg-white">
        {/* Top Notification Bar */}
        <div className="w-full bg-[#064e3b] text-white text-xs py-2 px-4 sm:px-6 lg:px-8 hidden md:block">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Phone size={14} />
              <span>+91 78383 80192</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Browse current product availability</span>
              <span className="text-gray-300">|</span>
              <Link to="/products?available=1" className="font-semibold hover:underline">Open catalogue</Link>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 hover:text-gray-200">
                Eng <ChevronDown size={14} />
              </button>
              <button className="flex items-center gap-1 hover:text-gray-200">
                Location <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <nav className="w-full border-b border-border bg-background py-4 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center gap-6">
              <PillNav
                logo="/images/logo.png"
                logoAlt="GORUS"
                items={navLinks.map(link => ({ label: link.name, href: link.path }))}
                activeHref={navLinks.find(link => isActive(link.path))?.path || location.pathname}
                baseColor="#064e3b"
                pillColor="#ffffff"
                hoveredPillTextColor="#ffffff"
                pillTextColor="#064e3b"
                initialLoadAnimation={false}
              />

              {/* Search Bar */}
              <div className="hidden md:flex flex-1 max-w-md relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Product"
                  className="w-full bg-muted border border-border focus:border-primary/50 text-foreground text-sm rounded-full py-2.5 px-5 transition-all outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (searchQuery.trim()) {
                      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                >
                  <Search size={18} />
                </button>
              </div>

              {/* Right Section (Cart & Auth) */}
              <div className="flex items-center gap-4 sm:gap-6">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-foreground hover:bg-muted transition-colors cursor-target"
                  aria-label="Toggle Dark Mode"
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Account Dropdown */}
                <div className="relative hidden sm:block">
                  {user ? (
                    <button 
                      onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                      className="cursor-target flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium text-sm"
                    >
                      <User size={20} />
                      <span className="truncate max-w-[80px]">{user.name.split(' ')[0]}</span>
                    </button>
                  ) : (
                    <Link 
                      to="/login" 
                      className="cursor-target flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium text-sm"
                    >
                      <User size={20} />
                      <span>Account</span>
                    </Link>
                  )}

                  {/* Account Dropdown Menu */}
                  <AnimatePresence>
                    {isAccountDropdownOpen && user && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-3 w-48 bg-background rounded-xl shadow-lg border border-border overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-border">
                          <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link onClick={() => setIsAccountDropdownOpen(false)} to="/profile" className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-primary">
                            <Settings size={16} className="mr-2" /> Profile
                          </Link>
                          <Link onClick={() => setIsAccountDropdownOpen(false)} to="/dashboard" className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-primary">
                            <LayoutDashboard size={16} className="mr-2" /> My Orders
                          </Link>
                          {user.is_admin && (
                            <Link onClick={() => setIsAccountDropdownOpen(false)} to="/admin" className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-primary">
                              <User size={16} className="mr-2" /> Admin Panel
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-border py-1">
                          <button onClick={handleLogout} className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                            <LogOut size={16} className="mr-2" /> Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Cart Icon */}
                <Link 
                  to="/cart" 
                  className="cursor-target flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium text-sm relative"
                >
                  <ShoppingCart size={20} />
                  <span className="hidden sm:inline">Cart</span>
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-2 left-3 sm:-top-2 sm:left-3 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-primary rounded-full border-2 border-background"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>

              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Search Bar (visible only on small screens) */}
        <div className="md:hidden w-full bg-background border-b border-border px-4 py-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Product"
              className="w-full bg-muted border border-border focus:border-primary/50 text-foreground text-sm rounded-full py-2.5 px-5 transition-all outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
            />
            <button 
              onClick={() => {
                if (searchQuery.trim()) {
                  navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
            >
              <Search size={18} />
            </button>
          </div>
        </div>
      </header>

      {isContactOpen && (
        <ContactForm onClose={() => setIsContactOpen(false)} />
      )}
    </>
  );
};

export default Navbar;
