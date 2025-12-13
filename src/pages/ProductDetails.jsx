import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { productsAPI } from '../utils/api';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productsAPI.getById(id);
        setProduct(response.product);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (product) {
      addToCart({ ...product, available: product.available === 1 });
      setShowNotification(true);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div className="container">
          <div style={styles.loading}>Loading product...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={styles.page}>
        <div className="container">
          <div style={styles.error}>
            <h2>Product not found</h2>
            <button className="btn-primary" onClick={() => navigate('/products')}>
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAvailable = product.available === 1;

  return (
    <>
      <div style={styles.page}>
        <div className="container">
          <button
            onClick={() => navigate(-1)}
            style={styles.backButton}
            className="btn-secondary"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div style={styles.content}>
            <div style={styles.imageSection}>
              {product.image ? (
                <img src={product.image} alt={product.name} style={styles.image} />
              ) : (
                <div style={styles.placeholder}>
                  <p>No Image Available</p>
                </div>
              )}
              {product.tag && (
                <span style={styles.tag}>{product.tag}</span>
              )}
            </div>

            <div style={styles.detailsSection}>
              <h1 style={styles.title}>{product.name}</h1>
              
              <div style={styles.priceSection}>
                <span style={styles.price}>₹{product.price}</span>
                <span style={styles.unit}>/ {product.unit}</span>
              </div>

              <div style={styles.availability}>
                {isAvailable ? (
                  <span style={styles.inStock}>✓ In Stock</span>
                ) : (
                  <span style={styles.outOfStock}>✗ Out of Stock</span>
                )}
                {product.stock && isAvailable && (
                  <span style={styles.stock}> ({product.stock} available)</span>
                )}
              </div>

              <div style={styles.description}>
                <h2 style={styles.sectionTitle}>Description</h2>
                <p style={styles.descriptionText}>{product.description || 'No description available.'}</p>
              </div>

              <div style={styles.actions}>
                {isAvailable ? (
                  <button
                    className="btn-primary"
                    onClick={handleAddToCart}
                    style={styles.addToCartButton}
                  >
                    <ShoppingCart size={20} />
                    Add to Cart
                  </button>
                ) : (
                  <button style={styles.disabledButton} disabled>
                    Currently Unavailable
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNotification && (
        <div style={{...styles.notification, animation: 'slideIn 0.3s ease-out'}} className="fade-in">
          <span style={styles.notificationText}>Item added to cart!</span>
        </div>
      )}
    </>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    padding: '40px 0 80px'
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '32px'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '60px',
    alignItems: 'start'
  },
  imageSection: {
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '500px',
    objectFit: 'cover',
    borderRadius: '16px',
    backgroundColor: '#f3f4f6'
  },
  placeholder: {
    width: '100%',
    height: '500px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: '16px',
    color: '#9ca3af'
  },
  tag: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    backgroundColor: '#22c55e',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600'
  },
  detailsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '16px'
  },
  priceSection: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px'
  },
  price: {
    fontSize: '40px',
    fontWeight: '700',
    color: '#22c55e'
  },
  unit: {
    fontSize: '18px',
    color: '#6b7280'
  },
  availability: {
    fontSize: '16px',
    fontWeight: '600'
  },
  inStock: {
    color: '#22c55e'
  },
  outOfStock: {
    color: '#ef4444'
  },
  stock: {
    color: '#6b7280',
    fontWeight: '400'
  },
  description: {
    marginTop: '24px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '12px'
  },
  descriptionText: {
    fontSize: '16px',
    color: '#374151',
    lineHeight: '1.6'
  },
  actions: {
    marginTop: '24px'
  },
  addToCartButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    justifyContent: 'center',
    padding: '16px',
    fontSize: '18px'
  },
  disabledButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#e5e7eb',
    color: '#9ca3af',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'not-allowed'
  },
  notification: {
    position: 'fixed',
    top: '100px',
    right: '20px',
    backgroundColor: '#22c55e',
    color: 'white',
    padding: '16px 24px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
    zIndex: 1000
  },
  notificationText: {
    fontSize: '16px',
    fontWeight: '600'
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '18px',
    color: '#6b7280'
  },
  error: {
    textAlign: 'center',
    padding: '60px 20px'
  }
};

export default ProductDetails;

