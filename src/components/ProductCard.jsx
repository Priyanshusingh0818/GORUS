import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(false);

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    addToCart(product);
    setShowNotification(true);
  };

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  return (
    <>
      <div style={styles.card} className="card fade-in">
        <div 
          onClick={() => navigate(`/product/${product.id}`)}
          style={{...styles.imageContainer, cursor: 'pointer'}}
        >
          {product.image ? (
            <img src={product.image} alt={product.name} style={styles.image} />
          ) : (
            <div style={styles.placeholder}>
              <p style={styles.placeholderText}>Product Image</p>
            </div>
          )}
          {product.tag && (
            <span style={styles.tag}>{product.tag}</span>
          )}
        </div>
        
        <div style={styles.content}>
          <h3 
            style={{...styles.title, cursor: 'pointer'}}
            onClick={() => navigate(`/product/${product.id}`)}
          >
            {product.name}
          </h3>
          <p style={styles.description}>{product.description}</p>
          
          <div style={styles.priceSection}>
            <span style={styles.price}>₹{product.price}</span>
            <span style={styles.unit}>/ {product.unit}</span>
          </div>

          {(() => {
            const isAvailable = (product.available === 1) || (product.available === true) || (product.available === '1');
            const isOutOfStock = product.stock !== undefined && product.stock <= 0;
            
            if (!isAvailable) {
              return (
                <button style={styles.comingSoonBtn} disabled>
                  Coming Soon
                </button>
              );
            }
            
            if (isOutOfStock) {
              return (
                <button style={styles.outOfStockBtn} disabled>
                  Out of Stock
                </button>
              );
            }
            
            return (
              <button 
                style={styles.button}
                className="btn-primary"
                onClick={handleAddToCart}
              >
                <ShoppingCart size={18} />
                Add to Cart
                {product.stock !== undefined && product.stock < 10 && (
                  <span style={styles.lowStockBadge}>Only {product.stock} left</span>
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {showNotification && (
        <div style={{...styles.notification, animation: 'slideIn 0.3s ease-out'}} className="fade-in">
          <Check size={20} style={styles.checkIcon} />
          <span style={styles.notificationText}>Item added to cart!</span>
        </div>
      )}
    </>
  );
};

const styles = {
  card: {
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '250px',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb'
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: '16px'
  },
  tag: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: '#22c55e',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827'
  },
  description: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
    flex: 1
  },
  priceSection: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px'
  },
  price: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#22c55e'
  },
  unit: {
    fontSize: '14px',
    color: '#6b7280'
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%'
  },
  comingSoonBtn: {
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'not-allowed',
    width: '100%'
  },
  outOfStockBtn: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'not-allowed',
    width: '100%'
  },
  lowStockBadge: {
    fontSize: '11px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '2px 8px',
    borderRadius: '12px',
    marginLeft: '8px',
    fontWeight: '600'
  },
  notification: {
    position: 'fixed',
    top: '100px',
    right: '20px',
    backgroundColor: '#22c55e',
    color: 'white',
    padding: '16px 24px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
    zIndex: 1000,
    transform: 'translateX(0)',
    opacity: 1,
    transition: 'all 0.3s ease-out'
  },
  checkIcon: {
    flexShrink: 0
  },
  notificationText: {
    fontSize: '16px',
    fontWeight: '600'
  }
};

export default ProductCard;