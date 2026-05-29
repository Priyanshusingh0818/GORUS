import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Eye, MapPin, Package, Phone, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-IN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

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

    let isMounted = true;
    const fetchOrders = async () => {
      try {
        const response = await ordersAPI.getMyOrders();
        if (isMounted) setOrders(response.orders || []);
      } catch (error) {
        if (isMounted) setOrders([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, [user, navigate]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="page-shell section-y max-w-5xl">
          <div className="mb-10 space-y-3">
            <div className="skeleton h-5 w-28 rounded-full" />
            <div className="skeleton h-11 w-64 rounded-full" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="premium-card p-6">
                <div className="skeleton h-6 w-48 rounded-full" />
                <div className="mt-6 space-y-3">
                  <div className="skeleton h-4 w-full rounded-full" />
                  <div className="skeleton h-4 w-3/4 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="page-shell section-y max-w-5xl">
        <div className="mb-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-primary">Account</p>
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold tracking-tight text-foreground">
            My Orders
          </motion.h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Welcome back, <span className="font-semibold text-foreground">{user?.name || 'User'}</span>.
          </p>
        </div>

        {orders.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="premium-card mx-auto max-w-2xl p-10 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Package size={48} />
            </div>
            <h2 className="mb-4 text-3xl font-bold text-foreground">No orders yet</h2>
            <p className="mb-8 text-lg text-muted-foreground">Start with the current catalogue when you are ready.</p>
            <button type="button" onClick={() => navigate('/products')} className="premium-button-primary">
              <ShoppingBag size={20} />
              Browse Products
            </button>
          </motion.div>
        ) : (
          <div className="space-y-5">
            <AnimatePresence>
              {orders.map((order, index) => (
                <motion.article
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.22 }}
                  className="premium-card premium-card-hover p-5 sm:p-7"
                >
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="mb-1 flex items-center gap-2 text-xl font-bold text-foreground">
                        Order #{order.order_number}
                      </h3>
                      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Calendar size={16} />
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className={`w-fit rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${statusClass[order.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {order.status}
                    </div>
                  </div>

                  <div className="my-6 border-t border-border" />

                  <div className="mb-6 space-y-3">
                    {order.items?.slice(0, 3).map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between gap-4 py-2">
                        <div className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-foreground">{item.product_name}</span>
                          <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                        </div>
                        <span className="font-bold text-foreground">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="inline-block rounded-lg bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                        + {order.items.length - 3} more item{order.items.length - 3 === 1 ? '' : 's'}
                      </div>
                    )}
                  </div>

                  <div className="my-6 border-t border-border" />

                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="w-full flex-1 space-y-2">
                      <div className="flex items-start gap-3 text-sm text-muted-foreground">
                        <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{order.shipping_address}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Phone size={18} className="flex-shrink-0" />
                        <span>{order.shipping_phone}</span>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:w-auto">
                      <div className="text-left md:mr-6 md:text-right">
                        <span className="block text-sm font-medium text-muted-foreground">Order Total</span>
                        <span className="text-2xl font-black text-primary">{formatCurrency(order.total_amount)}</span>
                      </div>
                      <button type="button" onClick={() => navigate(`/order/${order.id}`)} className="premium-button-secondary w-full whitespace-nowrap sm:w-auto">
                        <Eye size={18} />
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
};

export default Dashboard;
