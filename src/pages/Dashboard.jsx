import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Calendar, MapPin, Phone, Eye, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const statusMap = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      processing: 'bg-blue-100 text-blue-700 border-blue-200',
      shipped: 'bg-purple-100 text-purple-700 border-purple-200',
      delivered: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-700 border-gray-200';
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
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 text-center sm:text-left">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-foreground tracking-tight"
          >
            My Orders
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground mt-2"
          >
            Welcome back, <span className="font-semibold text-foreground">{user?.name || 'User'}</span>! Here is your purchase history.
          </motion.p>
        </div>

        {orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-3xl p-12 text-center shadow-xl shadow-primary/5 border border-border max-w-2xl mx-auto"
          >
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground">
              <Package size={48} />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">No orders yet</h2>
            <p className="text-muted-foreground mb-8 text-lg">You haven't placed any orders. Start exploring our premium products!</p>
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 active:scale-95"
            >
              <ShoppingBag size={20} />
              Browse Products
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {orders.map((order, index) => (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-primary/5 border border-border transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                        Order #{order.order_number}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
                        <Calendar size={16} className="text-muted-foreground" />
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </div>
                  </div>

                  <div className="border-t border-border my-6" />

                  <div className="mb-6 space-y-3">
                    {order.items?.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2">
                        <div className="flex-1 min-w-0">
                          <span className="block font-medium text-foreground truncate">{item.product_name}</span>
                          <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                        </div>
                        <span className="font-bold text-foreground">₹{item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="text-sm font-medium text-primary bg-primary/5 px-4 py-2 rounded-lg inline-block">
                        + {order.items.length - 3} more items in this order
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border my-6" />

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex items-start gap-3 text-sm text-muted-foreground">
                        <MapPin size={18} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{order.shipping_address}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Phone size={18} className="text-muted-foreground flex-shrink-0" />
                        <span>{order.shipping_phone}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full md:w-auto gap-4">
                      <div className="text-left md:text-right md:mr-6">
                        <span className="block text-sm font-medium text-muted-foreground">Order Total</span>
                        <span className="text-2xl font-black text-primary">₹{order.total_amount.toFixed(2)}</span>
                      </div>
                      
                      <button
                        onClick={() => navigate(`/order/${order.id}`)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-background text-foreground font-semibold rounded-xl hover:bg-muted border border-border transition-all active:scale-95 whitespace-nowrap"
                      >
                        <Eye size={18} />
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
