import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CartItem from '../components/CartItem';

const Cart = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const total = getCartTotal();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  if (cartItems.length === 0) {
    return (
      <motion.div 
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-[70vh] flex items-center justify-center bg-background px-4"
      >
        <div className="max-w-md text-center p-8 rounded-2xl bg-card shadow-sm border border-border">
          <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
            <ShoppingBag size={48} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Looks like you haven't added any premium dairy products to your cart yet.
          </p>
          <button
            onClick={() => navigate('/products')}
            className="w-full flex items-center justify-center gap-2 py-4 px-8 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98]"
          >
            Start Shopping
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Shopping Cart</h1>
            <p className="text-muted-foreground mt-2">You have {cartItems.length} items in your cart.</p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your cart?')) {
                clearCart();
              }
            }}
            className="flex items-center gap-2 text-destructive font-medium px-4 py-2 rounded-full hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all"
          >
            <Trash2 size={18} />
            Clear Cart
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-10 lg:items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            <AnimatePresence>
              {cartItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CartItem item={item} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <div className="sticky top-28 space-y-6">
              <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
                <h2 className="text-xl font-bold text-foreground mb-6">Order Summary</h2>
                
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-bold text-foreground">₹{total.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Delivery</span>
                    <span className="font-bold text-primary bg-primary/10 px-3 py-1 rounded-full text-xs">Free</span>
                  </div>
                </div>

                <div className="my-6 border-t border-border" />

                <div className="flex justify-between items-center mb-8">
                  <span className="text-xl font-bold text-foreground">Total</span>
                  <span className="text-3xl font-extrabold text-primary">₹{total.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98]"
                >
                  Proceed to Checkout
                  <ArrowRight size={20} />
                </button>

                <button
                  onClick={() => navigate('/products')}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-6 bg-background text-foreground font-medium rounded-full hover:bg-muted border-2 border-border transition-all"
                >
                  <ArrowLeft size={18} />
                  Continue Shopping
                </button>
              </div>

              {/* Help Card */}
              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 mt-6">
                <h3 className="font-bold text-foreground mb-2">Need Help?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Contact us at <a href="mailto:Gorusorganics@gmail.com" className="text-primary font-medium hover:underline">Gorusorganics@gmail.com</a> or call <a href="tel:+919876543210" className="text-primary font-medium hover:underline">+91 98765 43210</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Cart;