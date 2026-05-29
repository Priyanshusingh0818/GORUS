import React from 'react';
import { ArrowRight, Check, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';
import OptimizedImage from './OptimizedImage';

const CartDrawer = () => {
  const {
    cartItems,
    isCartOpen,
    lastAddedItem,
    closeCart,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    getCartCount
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const total = getCartTotal();
  const count = getCartCount();

  const handleCheckout = () => {
    closeCart();
    if (user) {
      navigate('/checkout');
      return;
    }
    navigate('/login', { state: { redirectTo: '/checkout' } });
  };

  const handleContinue = () => {
    closeCart();
    navigate('/products/available');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-foreground/35 backdrop-blur-sm"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={closeCart}
            aria-label="Close cart drawer"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Cart updated</p>
                <h2 className="mt-1 text-2xl font-extrabold text-foreground">Your basket</h2>
                <p className="mt-1 text-sm text-muted-foreground">{count} item{count === 1 ? '' : 's'} ready for checkout</p>
              </div>
              <button type="button" onClick={closeCart} className="premium-button-secondary h-10 w-10 px-0" aria-label="Close cart">
                <X size={18} />
              </button>
            </div>

            {lastAddedItem && (
              <div className="mx-5 mt-5 flex items-center gap-3 rounded-lg border border-primary/15 bg-primary/10 p-3 text-primary">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">Added to cart</p>
                  <p className="truncate text-xs font-medium text-primary">{lastAddedItem.name}</p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ShoppingBag size={36} strokeWidth={1.5} />
                  </span>
                  <h3 className="text-xl font-bold text-foreground">Your cart is empty</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                    Browse the fresh catalogue and add what belongs in your kitchen today.
                  </p>
                  <button type="button" onClick={handleContinue} className="premium-button-primary mt-6">
                    Shop products
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            closeCart();
                            navigate(`/product/${item.id}`);
                          }}
                          className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          aria-label={`View ${item.name}`}
                        >
                          {item.image ? (
                            <OptimizedImage src={item.image} alt={item.name} className="h-full w-full object-contain" loading="lazy" sizes="96px" />
                          ) : (
                            <ShoppingBag size={22} className="text-muted-foreground" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-bold text-foreground">{item.name}</h3>
                              <p className="mt-1 text-xs font-medium text-muted-foreground">{formatCurrency(item.price)} / {item.unit}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="flex items-center rounded-full border border-border bg-muted p-1">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-background hover:text-primary"
                                aria-label={`Decrease ${item.name} quantity`}
                              >
                                <Minus size={15} />
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-background hover:text-primary"
                                aria-label={`Increase ${item.name} quantity`}
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                            <p className="text-sm font-extrabold text-foreground">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-border bg-background px-5 py-5 shadow-[0_-16px_48px_rgba(15,23,42,0.08)]">
                <div className="mb-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-bold text-foreground">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Delivery</span>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Free</span>
                  </div>
                </div>
                <p className="mb-3 rounded-lg bg-primary/10 px-3 py-2 text-center text-xs font-semibold leading-5 text-primary">
                  COD and UPI available. You can review everything before confirming.
                </p>
                <button type="button" onClick={handleCheckout} className="premium-button-primary w-full">
                  Secure Checkout
                  <ArrowRight size={18} />
                </button>
                <button type="button" onClick={handleContinue} className="premium-button-secondary mt-3 w-full">
                  Continue shopping
                </button>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
