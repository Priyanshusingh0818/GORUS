import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ContactForm from './ContactForm';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const { getCartCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = getCartCount();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav style={styles.navbar}>
        <div style={styles.container}>
          <Link to="/" style={styles.logoContainer}>
            <img src="/images/logo.png" alt="GORAS" style={styles.logo} />
          </Link>

          <button 
            style={styles.menuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div style={{
            ...styles.navLinks,
            ...(isMenuOpen ? styles.navLinksOpen : {})
          }}>
            <Link 
              to="/" 
              style={{
                ...styles.navLink,
                ...(isActive('/') ? styles.navLinkActive : {})
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              style={{
                ...styles.navLink,
                ...(isActive('/products') ? styles.navLinkActive : {})
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              Products
            </Link>
            <Link 
              to="/cart" 
              style={{
                ...styles.navLink,
                ...(isActive('/cart') ? styles.navLinkActive : {})
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              Shopping
            </Link>
            {user && (
              <>
                <Link 
                  to="/dashboard" 
                  style={{
                    ...styles.navLink,
                    ...(isActive('/dashboard') ? styles.navLinkActive : {})
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Orders
                </Link>
                <Link 
                  to="/profile" 
                  style={{
                    ...styles.navLink,
                    ...(isActive('/profile') ? styles.navLinkActive : {})
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
              </>
            )}
            {user?.is_admin && (
              <Link 
                to="/admin" 
                style={{
                  ...styles.navLink,
                  ...(isActive('/admin') ? styles.navLinkActive : {})
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            <button
              style={styles.navLink}
              onClick={() => {
                setIsContactOpen(true);
                setIsMenuOpen(false);
              }}
            >
              Contact
            </button>
          </div>

          <div style={styles.rightSection}>
            {user ? (
              <div style={styles.userSection}>
                <User size={20} style={styles.icon} />
                <span style={styles.userName}>{user.name}</span>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login" style={styles.loginBtn}>
                Login
              </Link>
            )}
            
            <Link to="/cart" style={styles.cartButton}>
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span style={styles.cartBadge}>{cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {isContactOpen && (
        <ContactForm onClose={() => setIsContactOpen(false)} />
      )}
    </>
  );
};

const styles = {
  navbar: {
    backgroundColor: 'white',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    padding: '16px 0'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  logo: {
    height: '50px',
    width: 'auto'
  },
  menuButton: {
    display: 'none',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#374151',
    '@media (maxWidth: 768px)': {
      display: 'block'
    }
  },
  navLinks: {
    display: 'flex',
    gap: '32px',
    alignItems: 'center'
  },
  navLinksOpen: {
    display: 'flex'
  },
  navLink: {
    color: '#374151',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '16px',
    transition: 'color 0.3s ease',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'Poppins, sans-serif',
    padding: '8px 0',
    position: 'relative'
  },
  navLinkActive: {
    color: '#22c55e',
    fontWeight: '600'
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#374151'
  },
  userName: {
    fontWeight: '500',
    fontSize: '14px'
  },
  icon: {
    color: '#22c55e'
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#ef4444',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    transition: 'opacity 0.3s ease'
  },
  loginBtn: {
    backgroundColor: '#22c55e',
    color: 'white',
    padding: '8px 20px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'background-color 0.3s ease'
  },
  cartButton: {
    position: 'relative',
    color: '#374151',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center'
  },
  cartBadge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold'
  }
};

export default Navbar;