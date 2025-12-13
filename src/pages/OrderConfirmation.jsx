import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Package, Home } from 'lucide-react';
import { ordersAPI } from '../utils/api';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  
  // Get orderId from state or URL params (from Cashfree redirect)
  const orderId = location.state?.orderId || new URLSearchParams(location.search).get('orderId');
  const paymentFailed = location.state?.paymentFailed;
  
  // Check for Cashfree payment callback parameters
  const urlParams = new URLSearchParams(location.search);
  const cfOrderId = urlParams.get('cf_id');
  const cfRefId = urlParams.get('cf_ref_id');

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await ordersAPI.getById(orderId);
        const orderData = response.order;
        setOrder(orderData);
        
        // If payment callback parameters exist, verify payment
        if (cfOrderId && cfRefId) {
          setPaymentStatus('verifying');
          try {
            // Payment was successful if we're redirected back with these params
            // The webhook will update the status, but we can show success message
            if (orderData.payment_status === 'paid' || orderData.status === 'processing') {
              setPaymentStatus('success');
            } else {
              // Payment might still be processing, check status
              setPaymentStatus('processing');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setPaymentStatus('error');
          }
        } else if (paymentFailed) {
          setPaymentStatus('failed');
        } else if (orderData.payment_method === 'cod') {
          setPaymentStatus('cod');
        } else if (orderData.payment_status === 'paid') {
          setPaymentStatus('success');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate, cfOrderId, cfRefId, paymentFailed]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div className="container">
          <div style={styles.loading}>Loading...</div>
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

  return (
    <div style={styles.page}>
      <div className="container">
        <div style={styles.content}>
          <div style={styles.successIcon}>
            <CheckCircle size={80} color="#22c55e" />
          </div>

          <h1 style={styles.title}>
            {paymentStatus === 'failed' 
              ? 'Order Created - Payment Pending' 
              : paymentStatus === 'success' || paymentStatus === 'cod'
              ? 'Order Confirmed!'
              : paymentStatus === 'verifying'
              ? 'Verifying Payment...'
              : 'Order Confirmed!'}
          </h1>
          <p style={styles.subtitle}>
            {paymentStatus === 'failed'
              ? 'Your order has been created but payment is pending. Please complete payment to proceed.'
              : paymentStatus === 'success'
              ? 'Thank you for your order! Payment received successfully. We\'ll process it shortly.'
              : paymentStatus === 'cod'
              ? 'Thank you for your order! Pay when you receive your items.'
              : paymentStatus === 'verifying'
              ? 'Please wait while we verify your payment...'
              : 'Thank you for your order. We\'ve received it and will process it shortly.'}
          </p>
          
          {paymentStatus === 'failed' && (
            <div style={styles.paymentWarning}>
              ⚠️ Payment was not completed. Please contact support or try placing the order again.
            </div>
          )}
          
          {paymentStatus === 'success' && (
            <div style={styles.paymentSuccess}>
              ✅ Payment received successfully!
            </div>
          )}
          
          {paymentStatus === 'processing' && (
            <div style={styles.paymentInfo}>
              ℹ️ Payment is being processed. You will receive a confirmation email shortly.
            </div>
          )}

          <div className="card" style={styles.orderCard}>
            <div style={styles.orderHeader}>
              <div>
                <h2 style={styles.orderTitle}>Order Details</h2>
                <p style={styles.orderNumber}>Order #: {order.order_number}</p>
              </div>
              <div style={{...styles.statusBadge, backgroundColor: getStatusColor(order.status) + '20', color: getStatusColor(order.status)}}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </div>
            </div>

            <div style={styles.divider} />

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Items</h3>
              {order.items?.map((item, index) => (
                <div key={index} style={styles.itemRow}>
                  <div>
                    <strong>{item.product_name}</strong>
                    <div style={styles.itemMeta}>Quantity: {item.quantity} × ₹{item.product_price}</div>
                  </div>
                  <div style={styles.itemTotal}>₹{item.subtotal.toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div style={styles.divider} />

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Shipping Address</h3>
              <p style={styles.addressText}>
                <strong>{order.shipping_name}</strong><br />
                {order.shipping_address}<br />
                Phone: {order.shipping_phone}
              </p>
            </div>

            <div style={styles.divider} />

            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Total Amount</span>
              <span style={styles.totalValue}>₹{order.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <div style={styles.actions}>
            <button
              className="btn-primary"
              onClick={() => navigate('/dashboard')}
              style={styles.button}
            >
              <Package size={20} />
              View My Orders
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate('/')}
              style={styles.button}
            >
              <Home size={20} />
              Continue Shopping
            </button>
          </div>
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
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center'
  },
  successIcon: {
    marginBottom: '24px'
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '12px'
  },
  subtitle: {
    fontSize: '18px',
    color: '#6b7280',
    marginBottom: '40px'
  },
  orderCard: {
    padding: '32px',
    marginBottom: '32px',
    textAlign: 'left'
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  orderTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px'
  },
  orderNumber: {
    fontSize: '16px',
    color: '#6b7280'
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
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '16px'
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  itemMeta: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px'
  },
  itemTotal: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827'
  },
  addressText: {
    fontSize: '16px',
    color: '#374151',
    lineHeight: '1.6'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0'
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
  actions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '200px',
    justifyContent: 'center'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#6b7280'
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#ef4444'
  },
  paymentWarning: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
    textAlign: 'center'
  },
  paymentSuccess: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
    textAlign: 'center',
    fontWeight: '600'
  },
  paymentInfo: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
    textAlign: 'center'
  }
};

export default OrderConfirmation;

