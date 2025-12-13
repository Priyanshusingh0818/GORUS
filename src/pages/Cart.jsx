import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CartItem from '../components/CartItem';

const Cart = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const total = getCartTotal();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div style={styles.emptyCart}>
        <div className="container">
          <div style={styles.emptyContent}>
            <ShoppingBag size={80} style={styles.emptyIcon} />
            <h2 style={styles.emptyTitle}>Your cart is empty</h2>
            <p style={styles.emptyText}>
              Looks like you haven't added any products to your cart yet.
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate('/products')}
              style={styles.shopBtn}
            >
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.cartPage}>
      <div className="container">
        <div style={styles.header}>
          <h1 style={styles.title}>Shopping Cart</h1>
          <button
            style={styles.clearBtn}
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your cart?')) {
                clearCart();
              }
            }}
          >
            Clear Cart
          </button>
        </div>

        <div style={styles.content}>
          {/* Cart Items */}
          <div style={styles.itemsSection}>
            {cartItems.map(item => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          {/* Order Summary */}
          <div style={styles.summarySection}>
            <div className="card" style={styles.summaryCard}>
              <h2 style={styles.summaryTitle}>Order Summary</h2>
              
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Subtotal</span>
                <span style={styles.summaryValue}>₹{total.toFixed(2)}</span>
              </div>

              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Delivery</span>
                <span style={styles.summaryValue}>Free</span>
              </div>

              <div style={styles.divider} />

              <div style={styles.summaryRow}>
                <span style={styles.totalLabel}>Total</span>
                <span style={styles.totalValue}>₹{total.toFixed(2)}</span>
              </div>

              <button
                className="btn-primary"
                onClick={handleCheckout}
                style={styles.checkoutBtn}
              >
                Proceed to Checkout
                <ArrowRight size={20} />
              </button>

              <button
                className="btn-secondary"
                onClick={() => navigate('/products')}
                style={styles.continueBtn}
              >
                Continue Shopping
              </button>
            </div>

            <div className="card" style={styles.infoCard}>
              <h3 style={styles.infoTitle}>Need Help?</h3>
              <p style={styles.infoText}>
                Contact us at <a href="mailto:Gorusorganics@gmail.com" style={styles.link}>Gorusorganics@gmail.com</a> or call <a href="tel:+919876543210" style={styles.link}>+91 98765 43210</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  cartPage: {
    minHeight: '100vh',
    padding: '40px 0 80px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#111827'
  },
  clearBtn: {
    background: 'none',
    border: '2px solid #ef4444',
    color: '#ef4444',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '40px'
  },
  itemsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  summarySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  summaryCard: {
    position: 'sticky',
    top: '100px'
  },
  summaryTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '24px'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  summaryLabel: {
    fontSize: '16px',
    color: '#6b7280'
  },
  summaryValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827'
  },
  divider: {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '20px 0'
  },
  totalLabel: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827'
  },
  totalValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#22c55e'
  },
  checkoutBtn: {
    width: '100%',
    marginTop: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  continueBtn: {
    width: '100%',
    marginTop: '12px'
  },
  infoCard: {
    backgroundColor: '#f0fdf4'
  },
  infoTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px'
  },
  infoText: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.6'
  },
  link: {
    color: '#22c55e',
    textDecoration: 'none',
    fontWeight: '600'
  },
  emptyCart: {
    minHeight: '70vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyContent: {
    textAlign: 'center',
    maxWidth: '500px',
    margin: '0 auto'
  },
  emptyIcon: {
    color: '#9ca3af',
    marginBottom: '24px'
  },
  emptyTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '16px'
  },
  emptyText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '32px'
  },
  shopBtn: {
    fontSize: '16px',
    padding: '12px 32px'
  }
};

export default Cart;