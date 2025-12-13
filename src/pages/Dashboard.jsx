import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Calendar, MapPin, Phone, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../utils/api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await ordersAPI.getMyOrders();
        setOrders(response.orders || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div className="container">
          <div style={styles.loading}>Loading your orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div className="container">
        <div style={styles.header}>
          <h1 style={styles.title}>My Orders</h1>
          <p style={styles.subtitle}>Welcome back, {user?.name || 'User'}!</p>
        </div>

        {orders.length === 0 ? (
          <div style={styles.emptyState}>
            <Package size={80} style={styles.emptyIcon} />
            <h2 style={styles.emptyTitle}>No orders yet</h2>
            <p style={styles.emptyText}>Start shopping to see your orders here</p>
            <button
              className="btn-primary"
              onClick={() => navigate('/products')}
              style={styles.shopButton}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div style={styles.ordersList}>
            {orders.map((order) => (
              <div key={order.id} className="card" style={styles.orderCard}>
                <div style={styles.orderHeader}>
                  <div>
                    <h3 style={styles.orderNumber}>Order #{order.order_number}</h3>
                    <p style={styles.orderDate}>
                      <Calendar size={16} style={styles.icon} />
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div style={{...styles.statusBadge, backgroundColor: getStatusColor(order.status) + '20', color: getStatusColor(order.status)}}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                </div>

                <div style={styles.divider} />

                <div style={styles.orderItems}>
                  {order.items?.slice(0, 3).map((item, index) => (
                    <div key={index} style={styles.itemRow}>
                      <span style={styles.itemName}>{item.product_name}</span>
                      <span style={styles.itemQuantity}>× {item.quantity}</span>
                      <span style={styles.itemPrice}>₹{item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <div style={styles.moreItems}>+ {order.items.length - 3} more items</div>
                  )}
                </div>

                <div style={styles.divider} />

                <div style={styles.orderFooter}>
                  <div style={styles.shippingInfo}>
                    <div style={styles.shippingRow}>
                      <MapPin size={16} style={styles.icon} />
                      <span style={styles.shippingText}>{order.shipping_address}</span>
                    </div>
                    <div style={styles.shippingRow}>
                      <Phone size={16} style={styles.icon} />
                      <span style={styles.shippingText}>{order.shipping_phone}</span>
                    </div>
                  </div>
                  <div style={styles.orderTotal}>
                    <span style={styles.totalLabel}>Total:</span>
                    <span style={styles.totalValue}>₹{order.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => navigate(`/order/${order.id}`)}
                  style={styles.viewButton}
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    padding: '40px 0 80px'
  },
  header: {
    marginBottom: '40px',
    textAlign: 'center'
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '18px',
    color: '#6b7280'
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '18px',
    color: '#6b7280'
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px'
  },
  emptyIcon: {
    color: '#9ca3af',
    marginBottom: '24px'
  },
  emptyTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '12px'
  },
  emptyText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '32px'
  },
  shopButton: {
    fontSize: '16px',
    padding: '12px 32px'
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  orderCard: {
    padding: '24px'
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  orderNumber: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px'
  },
  orderDate: {
    fontSize: '14px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  divider: {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '16px 0'
  },
  orderItems: {
    marginBottom: '16px'
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    fontSize: '14px'
  },
  itemName: {
    flex: 1,
    color: '#374151'
  },
  itemQuantity: {
    color: '#6b7280',
    marginRight: '12px'
  },
  itemPrice: {
    fontWeight: '600',
    color: '#111827'
  },
  moreItems: {
    fontSize: '14px',
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: '8px'
  },
  orderFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  shippingInfo: {
    flex: 1,
    minWidth: '200px'
  },
  shippingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#6b7280'
  },
  shippingText: {
    flex: 1
  },
  orderTotal: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  totalLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151'
  },
  totalValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#22c55e'
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    justifyContent: 'center'
  },
  icon: {
    color: '#6b7280'
  }
};

export default Dashboard;

