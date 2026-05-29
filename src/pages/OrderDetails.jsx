import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Package, Phone, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../utils/api';
import { formatCurrency } from '../utils/format';

const statusClass = {
  pending: 'bg-accent text-accent-foreground border-border',
  processing: 'bg-primary/10 text-primary border-primary/20',
  shipped: 'bg-muted text-foreground border-border',
  delivered: 'bg-primary/10 text-primary border-primary/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20'
};

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

    let isMounted = true;
    const fetchOrder = async () => {
      try {
        const response = await ordersAPI.getById(id);
        if (isMounted) setOrder(response.order);
      } catch (fetchError) {
        if (isMounted) setOrder(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [id, user, navigate]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Cancel this order? This action cannot be undone.')) return;

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
      <main className="min-h-screen bg-background">
        <div className="page-shell section-y max-w-4xl">
          <div className="skeleton mb-8 h-11 w-40 rounded-full" />
          <div className="premium-card p-6">
            <div className="skeleton h-8 w-64 rounded-full" />
            <div className="mt-8 space-y-4">
              <div className="skeleton h-16 w-full rounded-lg" />
              <div className="skeleton h-16 w-full rounded-lg" />
              <div className="skeleton h-24 w-full rounded-lg" />
            </div>
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
          <button type="button" onClick={() => navigate('/dashboard')} className="premium-button-primary mt-4">
            Back to orders
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="page-shell section-y max-w-4xl">
        <button type="button" onClick={() => navigate('/dashboard')} className="premium-button-secondary mb-8">
          <ArrowLeft size={18} />
          Back to Orders
        </button>

        <article className="premium-card p-5 sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-extrabold text-foreground">Order #{order.order_number}</h1>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar size={16} />
                {new Date(order.created_at).toLocaleString('en-IN')}
              </p>
            </div>
            <div className={`w-fit rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${statusClass[order.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
              {order.status}
            </div>
          </div>

          <div className="my-6 border-t border-border" />

          <section className="mb-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
              <Package size={20} className="text-primary" />
              Order Items
            </h2>
            <div className="grid gap-3">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-4 rounded-lg bg-muted p-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-foreground">{item.product_name}</h3>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity} x {formatCurrency(item.product_price)}</p>
                  </div>
                  <div className="font-bold text-primary">{formatCurrency(item.subtotal)}</div>
                </div>
              ))}
            </div>
          </section>

          <div className="my-6 border-t border-border" />

          <section className="mb-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
              <MapPin size={20} className="text-primary" />
              Shipping Address
            </h2>
            <div className="rounded-lg bg-muted p-5">
              <p className="mb-2 text-lg font-semibold text-foreground">{order.shipping_name}</p>
              <p className="mb-3 leading-7 text-foreground">{order.shipping_address}</p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone size={16} />
                {order.shipping_phone}
              </p>
            </div>
          </section>

          <div className="rounded-lg bg-muted p-5">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-foreground">Total Amount</span>
              <span className="text-3xl font-black text-primary">{formatCurrency(order.total_amount)}</span>
            </div>
          </div>

          {error && <div className="mt-6 rounded-lg bg-destructive/10 p-4 text-sm font-medium text-destructive">{error}</div>}

          {canCancel && (
            <div className="mt-8 border-t border-border pt-6 text-center">
              <button type="button" onClick={handleCancelOrder} disabled={cancelling} className="premium-button border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15">
                <X size={18} />
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
              <p className="mt-3 text-xs text-muted-foreground">Only pending orders can be cancelled.</p>
            </div>
          )}
        </article>
      </div>
    </main>
  );
};

export default OrderDetails;
