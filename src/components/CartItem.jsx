import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity) => {
    updateQuantity(item.id, newQuantity);
  };

  const handleRemove = () => {
    removeFromCart(item.id);
  };

  return (
    <div className="card" style={styles.cartItem}>
      <div style={styles.imageContainer}>
        {item.image ? (
          <img src={item.image} alt={item.name} style={styles.image} />
        ) : (
          <div style={styles.placeholder}>
            <p style={styles.placeholderText}>No Image</p>
          </div>
        )}
      </div>

      <div style={styles.content}>
        <div style={styles.info}>
          <h3 style={styles.name}>{item.name}</h3>
          <p style={styles.description}>{item.description}</p>
          <div style={styles.priceRow}>
            <span style={styles.price}>₹{item.price}</span>
            <span style={styles.unit}>/ {item.unit}</span>
          </div>
        </div>

        <div style={styles.controls}>
          <div style={styles.quantityControls}>
            <button
              style={styles.quantityBtn}
              onClick={() => handleQuantityChange(item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span style={styles.quantity}>{item.quantity}</span>
            <button
              style={styles.quantityBtn}
              onClick={() => handleQuantityChange(item.quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={styles.total}>
            <span style={styles.totalLabel}>Total:</span>
            <span style={styles.totalValue}>₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>

          <button
            style={styles.removeBtn}
            onClick={handleRemove}
            aria-label="Remove item"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  cartItem: {
    display: 'flex',
    gap: '20px',
    padding: '20px',
    marginBottom: '16px'
  },
  imageContainer: {
    width: '120px',
    height: '120px',
    flexShrink: 0,
    borderRadius: '8px',
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
    fontSize: '12px'
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '16px'
  },
  info: {
    flex: 1
  },
  name: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px'
  },
  description: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '12px',
    lineHeight: '1.5'
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px'
  },
  price: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#22c55e'
  },
  unit: {
    fontSize: '14px',
    color: '#6b7280'
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap'
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    padding: '4px'
  },
  quantityBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#374151',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease'
  },
  quantity: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    minWidth: '30px',
    textAlign: 'center'
  },
  total: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: 'auto'
  },
  totalLabel: {
    fontSize: '16px',
    color: '#6b7280',
    fontWeight: '500'
  },
  totalValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#22c55e'
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#ef4444',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'background-color 0.2s ease'
  },
  removeBtnHover: {
    backgroundColor: '#fee2e2'
  }
};

export default CartItem;
