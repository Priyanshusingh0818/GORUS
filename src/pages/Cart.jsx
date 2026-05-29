import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShoppingBag, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CartItem from '../components/CartItem';
import { formatCurrency } from '../utils/format';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } }
};

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

  if (cartItems.length === 0) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex min-h-[70vh] items-center justify-center bg-background px-4"
      >
        <div className="premium-card max-w-md p-8 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShoppingBag size={48} strokeWidth={1.5} />
          </div>
          <h2 className="mb-3 text-3xl font-bold text-foreground">Your cart is empty</h2>
          <p className="mb-8 leading-relaxed text-muted-foreground">
            Add fresh dairy essentials to your cart and checkout when you are ready.
          </p>
          <button type="button" onClick={() => navigate('/products')} className="premium-button-primary w-full">
            Start Shopping
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.main
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-background"
    >
      <div className="page-shell section-y">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-primary">Basket</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Shopping Cart</h1>
            <p className="mt-2 text-muted-foreground">You have {cartItems.length} item{cartItems.length === 1 ? '' : 's'} in your cart.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear every item from your cart?')) clearCart();
            }}
            className="premium-button border border-transparent text-destructive hover:border-destructive/20 hover:bg-destructive/10"
          >
            <Trash2 size={18} />
            Clear Cart
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-10">
          <div className="space-y-4 lg:col-span-8">
            <AnimatePresence>
              {cartItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: index * 0.04, duration: 0.2 }}
                >
                  <CartItem item={item} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-8 lg:col-span-4 lg:mt-0">
            <div className="sticky top-28 space-y-6">
              <div className="premium-card p-6 sm:p-8">
                <h2 className="mb-6 text-xl font-bold text-foreground">Order Summary</h2>

                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between py-2">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-bold text-foreground">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="font-medium">Delivery</span>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Free</span>
                  </div>
                </div>

                <div className="my-6 border-t border-border" />

                <div className="mb-8 flex items-center justify-between">
                  <span className="text-xl font-bold text-foreground">Total</span>
                  <span className="text-3xl font-extrabold text-primary">{formatCurrency(total)}</span>
                </div>

                <button type="button" onClick={handleCheckout} className="premium-button-primary w-full">
                  Proceed to Checkout
                  <ArrowRight size={20} />
                </button>

                <button type="button" onClick={() => navigate('/products')} className="premium-button-secondary mt-4 w-full">
                  <ArrowLeft size={18} />
                  Continue Shopping
                </button>
              </div>

              <div className="premium-card border-primary/10 bg-primary/5 p-6">
                <h3 className="mb-2 font-bold text-foreground">Need help?</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Contact us at <a href="mailto:Gorusorganics@gmail.com" className="font-medium text-primary hover:underline">Gorusorganics@gmail.com</a> or call <a href="tel:+917838380192" className="font-medium text-primary hover:underline">+91 78383 80192</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
};

export default Cart;
