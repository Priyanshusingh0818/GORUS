import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Home, Info, Package } from 'lucide-react';
import { ordersAPI } from '../utils/api';
import { formatCurrency } from '../utils/format';

const statusClass = {
  pending: 'bg-accent text-accent-foreground',
  processing: 'bg-primary/10 text-primary',
  shipped: 'bg-muted text-foreground',
  delivered: 'bg-primary/10 text-primary',
  cancelled: 'bg-destructive/10 text-destructive'
};

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const orderId = location.state?.orderId || new URLSearchParams(location.search).get('orderId');
  const paymentFailed = location.state?.paymentFailed;
  const urlParams = new URLSearchParams(location.search);
  const cfOrderId = urlParams.get('cf_id');
  const cfRefId = urlParams.get('cf_ref_id');

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    let isMounted = true;
    const fetchOrder = async () => {
      try {
        const response = await ordersAPI.getById(orderId);
        const orderData = response.order;
        if (!isMounted) return;

        setOrder(orderData);
        if (cfOrderId && cfRefId) {
          setPaymentStatus(orderData.payment_status === 'paid' || orderData.status === 'processing' ? 'success' : 'processing');
        } else if (paymentFailed) {
          setPaymentStatus('failed');
        } else if (orderData.payment_method === 'cod') {
          setPaymentStatus('cod');
        } else if (orderData.payment_status === 'paid') {
          setPaymentStatus('success');
        }
      } catch (error) {
        if (isMounted) setOrder(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [orderId, navigate, cfOrderId, cfRefId, paymentFailed]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="page-shell section-y max-w-3xl">
          <div className="premium-card p-8 text-center">
            <div className="skeleton mx-auto mb-6 h-20 w-20 rounded-full" />
            <div className="skeleton mx-auto mb-4 h-10 w-64 rounded-full" />
            <div className="skeleton mx-auto h-4 w-80 rounded-full" />
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="premium-card p-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-foreground">Order not found</h1>
          <button type="button" onClick={() => navigate('/products')} className="premium-button-primary mt-4">
            Continue shopping
          </button>
        </div>
      </main>
    );
  }

  const headline = paymentStatus === 'failed'
    ? 'Order Created - Payment Pending'
    : paymentStatus === 'verifying'
      ? 'Verifying Payment'
      : 'Order Confirmed';
  const subtitle = paymentStatus === 'failed'
    ? 'Your order was created, but payment still needs attention.'
    : paymentStatus === 'success'
      ? 'Payment received successfully. We will process your order shortly.'
      : paymentStatus === 'cod'
        ? 'Thank you. You can pay when your order arrives.'
        : 'We have received your order and will process it shortly.';

  return (
    <main className="min-h-screen bg-background">
      <div className="page-shell section-y max-w-3xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle size={44} />
          </div>
          <h1 className="mb-3 text-4xl font-extrabold text-foreground">{headline}</h1>
          <p className="mx-auto max-w-xl text-lg leading-7 text-muted-foreground">{subtitle}</p>
        </div>

        {paymentStatus === 'failed' && (
          <div className="premium-card mb-6 flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            Payment was not completed. Please contact support or place the order again.
          </div>
        )}

        {paymentStatus === 'processing' && (
          <div className="premium-card mb-6 flex items-start gap-3 border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <Info size={18} className="mt-0.5 shrink-0" />
            Payment is being processed. You will receive a confirmation shortly.
          </div>
        )}

        <section className="premium-card p-5 text-left sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="mb-1 text-2xl font-bold text-foreground">Order Details</h2>
              <p className="text-sm text-muted-foreground">Order #{order.order_number}</p>
            </div>
            <span className={`w-fit rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${statusClass[order.status] || 'bg-gray-100 text-gray-700'}`}>
              {order.status}
            </span>
          </div>

          <div className="my-6 border-t border-border" />

          <h3 className="mb-4 text-lg font-bold text-foreground">Items</h3>
          <div className="grid gap-3">
            {order.items?.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-4 rounded-lg bg-muted p-4">
                <div className="min-w-0">
                  <strong className="block truncate text-foreground">{item.product_name}</strong>
                  <span className="text-sm text-muted-foreground">Quantity: {item.quantity} x {formatCurrency(item.product_price)}</span>
                </div>
                <div className="font-bold text-primary">{formatCurrency(item.subtotal)}</div>
              </div>
            ))}
          </div>

          <div className="my-6 border-t border-border" />

          <h3 className="mb-4 text-lg font-bold text-foreground">Shipping Address</h3>
          <div className="rounded-lg bg-muted p-5 leading-7 text-foreground">
            <strong>{order.shipping_name}</strong><br />
            {order.shipping_address}<br />
            Phone: {order.shipping_phone}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-lg bg-muted p-5">
            <span className="text-xl font-bold text-foreground">Total Amount</span>
            <span className="text-3xl font-black text-primary">{formatCurrency(order.total_amount)}</span>
          </div>
        </section>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => navigate('/dashboard')} className="premium-button-primary">
            <Package size={20} />
            View My Orders
          </button>
          <button type="button" onClick={() => navigate('/products')} className="premium-button-secondary">
            <Home size={20} />
            Continue Shopping
          </button>
        </div>
      </div>
    </main>
  );
};

export default OrderConfirmation;
