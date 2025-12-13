import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.section}>
            <img src="/images/logo.png" alt="GORAS" style={styles.logo} />
            <p style={styles.tagline}>Proof of 100% Purity</p>
            <p style={styles.description}>
              Premium quality dairy products delivered fresh from our farm to your home.
            </p>
          </div>

          <div style={styles.section}>
            <h3 style={styles.heading}>Contact Us</h3>
            <div style={styles.contactItem}>
              <Phone size={18} style={styles.icon} />
              <a href="tel:+919876543210" style={styles.link}>+91 78383 80192</a>
            </div>
            <div style={styles.contactItem}>
              <Mail size={18} style={styles.icon} />
              <a href="mailto:Gorusorganics@gmail.com" style={styles.link}>
                Gorusorganics@gmail.com
              </a>
            </div>
            <div style={styles.contactItem}>
              <MapPin size={18} style={styles.icon} />
              <span style={styles.text}>Buxar, Bihar</span>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.heading}>Quick Links</h3>
            <a href="/" style={styles.footerLink}>Home</a>
            <a href="/products" style={styles.footerLink}>Products</a>
            <a href="/cart" style={styles.footerLink}>Shopping Cart</a>
          </div>

          <div style={styles.section}>
            <h3 style={styles.heading}>Business Hours</h3>
            <p style={styles.text}>Monday - Saturday</p>
            <p style={styles.text}>Sunday: Closed</p>
          </div>
        </div>

        <div style={styles.bottom}>
          <p style={styles.copyright}>
            © 2024 GORAS. All rights reserved.
          </p>
          <p style={styles.madeWith}>
            Made with 💚 for pure dairy lovers
          </p>
        </div>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    backgroundColor: 'white',
    marginTop: '80px',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '60px 20px 20px'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '40px',
    marginBottom: '40px'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  logo: {
    height: '60px',
    width: 'auto',
    marginBottom: '8px'
  },
  tagline: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#22c55e',
    marginTop: '-8px'
  },
  description: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.6'
  },
  heading: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px'
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  icon: {
    color: '#22c55e',
    flexShrink: 0
  },
  link: {
    color: '#374151',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'color 0.3s ease'
  },
  text: {
    color: '#6b7280',
    fontSize: '14px'
  },
  footerLink: {
    color: '#374151',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'color 0.3s ease',
    display: 'block',
    marginBottom: '8px'
  },
  bottom: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  },
  copyright: {
    fontSize: '14px',
    color: '#6b7280'
  },
  madeWith: {
    fontSize: '14px',
    color: '#6b7280'
  }
};


export default Footer;
