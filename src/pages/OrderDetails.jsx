import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Calendar, MapPin, Phone, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../utils/api';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await ordersAPI.getById(id);
        setOrder(response.order);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, user, navigate]);

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      shipped: '#8b5cf6',
      delivered: '#22c55e',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    setCancelling(true);
    setError('');
    try {
      const response = await ordersAPI.cancel(id);
      setOrder(response.order);
    } catch (err) {
      setError(err.message || 'Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = order && order.status === 'pending' && order.user_id === user?.id;

  if (loading) {
    return (
      <div style={styles.page}>
        <div className="container">
          <div style={styles.loading}>Loading order details...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={styles.page}>
        <div className="container">
          <div style={styles.error}>Order not found</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div className="container">
        <button
          onClick={() => navigate('/dashboard')}
          style={styles.backButton}
          className="btn-secondary"
        >
          <ArrowLeft size={18} />
          Back to Orders
        </button>

        <div className="card" style={styles.orderCard}>
          <div style={styles.orderHeader}>
            <div>
              <h1 style={styles.orderTitle}>Order #{order.order_number}</h1>
              <p style={styles.orderDate}>
                <Calendar size={16} style={styles.icon} />
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <div style={{...styles.statusBadge, backgroundColor: getStatusColor(order.status) + '20', color: getStatusColor(order.status)}}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <Package size={20} style={styles.sectionIcon} />
              Order Items
            </h2>
            {order.items?.map((item, index) => (
              <div key={index} style={styles.itemRow}>
                <div style={styles.itemInfo}>
                  <h3 style={styles.itemName}>{item.product_name}</h3>
                  <p style={styles.itemMeta}>Quantity: {item.quantity} × ₹{item.product_price}</p>
                </div>
                <div style={styles.itemTotal}>₹{item.subtotal.toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div style={styles.divider} />

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <MapPin size={20} style={styles.sectionIcon} />
              Shipping Address
            </h2>
            <div style={styles.addressBox}>
              <p style={styles.addressName}>{order.shipping_name}</p>
              <p style={styles.addressText}>{order.shipping_address}</p>
              <p style={styles.addressPhone}>
                <Phone size={16} style={styles.icon} />
                {order.shipping_phone}
              </p>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.totalSection}>
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Total Amount</span>
              <span style={styles.totalValue}>₹{order.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}

          {canCancel && (
            <div style={styles.cancelSection}>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                style={styles.cancelButton}
                className="btn-secondary"
              >
                <X size={18} />
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
              <p style={styles.cancelNote}>
                You can only cancel orders that are still pending.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
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
  orderCard: {
    padding: '32px',
    maxWidth: '800px',
    margin: '0 auto'
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px'
  },
  orderTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px'
  },
  orderDate: {
    fontSize: '16px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600'
  },
  divider: {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '24px 0'
  },
  section: {
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  sectionIcon: {
    color: '#22c55e'
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '12px'
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px'
  },
  itemMeta: {
    fontSize: '14px',
    color: '#6b7280'
  },
  itemTotal: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#22c55e'
  },
  addressBox: {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '8px'
  },
  addressName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px'
  },
  addressText: {
    fontSize: '16px',
    color: '#374151',
    lineHeight: '1.6',
    marginBottom: '12px'
  },
  addressPhone: {
    fontSize: '16px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  totalSection: {
    marginTop: '24px'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px'
  },
  totalLabel: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827'
  },
  totalValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#22c55e'
  },
  icon: {
    color: '#6b7280'
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '18px',
    color: '#6b7280'
  },
  error: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '18px',
    color: '#ef4444'
  },
  errorMessage: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '12px 16px',
    borderRadius: '8px',
    marginTop: '24px',
    fontSize: '14px'
  },
  cancelSection: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '2px solid #e5e7eb',
    textAlign: 'center'
  },
  cancelButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '0 auto 12px',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    borderColor: '#b91c1c'
  },
  cancelNote: {
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic'
  }
};

export default OrderDetails;

