import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Building2, CheckCircle, Clock, Upload, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../utils/api';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shipping, setShipping] = useState({ name: user?.name || '', address: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  
  // Screenshot upload states
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const total = getCartTotal();

  const handleChange = (e) => setShipping({ ...shipping, [e.target.name]: e.target.value });

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setIsPlacing(true);
    try {
      const orderData = {
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        shipping,
        paymentMethod,
        totalAmount: getCartTotal()
      };

      const orderResponse = await ordersAPI.create(orderData);
      const createdOrderId = orderResponse.order.id;
      const createdOrderNumber = orderResponse.order.order_number;

      setOrderId(createdOrderId);
      setOrderNumber(createdOrderNumber);

      if (paymentMethod === 'cod') {
        clearCart();
        navigate('/order-confirmation', { state: { orderId: createdOrderId, paymentMethod } });
      } else {
        setShowQRCode(true);
      }
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        setError('Your session has expired. Please login again.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(err.message || 'Failed to place order. Please try again.');
      }
    } finally {
      setIsPlacing(false);
    }
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload only image files (PNG, JPG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    setScreenshot(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const handlePaymentComplete = async () => {
    if (!screenshot) {
      alert('Please upload payment screenshot before confirming');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('paymentProof', screenshot);
      formData.append('orderId', orderId);
      formData.append('orderNumber', orderNumber);
      formData.append('totalAmount', getCartTotal());
      formData.append('customerName', shipping.name);
      formData.append('customerEmail', user.email);
      formData.append('customerPhone', shipping.phone);

      const API_BASE_URL = process.env.REACT_APP_API_URL || window.location.origin;

      const response = await fetch(`${API_BASE_URL}/api/payments/confirm-upi`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        clearCart();
        navigate('/order-confirmation', { state: { orderId, paymentMethod: 'upi' } });
      } else {
        if (response.status === 401) {
          setError('Session expired. Please login again.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError(data.message || 'Failed to confirm payment');
        }
      }
    } catch (err) {
      setError('Failed to confirm payment. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  if (!user) {
    return (
      <motion.div 
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-background flex justify-center items-center px-4"
      >
        <div className="max-w-md w-full bg-card rounded-2xl p-8 shadow-sm border border-border text-center">
          <ShieldCheck size={48} className="mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-8">Please log in to your account to securely proceed with your checkout.</p>
          <button onClick={() => navigate('/login')} className="w-full py-4 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-primary/30">
            Proceed to Login
          </button>
        </div>
      </motion.div>
    );
  }

  if (showQRCode) {
    return (
      <motion.div 
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-background py-12 px-4"
      >
        <div className="max-w-xl mx-auto bg-card rounded-2xl p-8 sm:p-10 shadow-sm border border-border">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <Clock size={32} />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Complete Payment</h2>
            <p className="text-muted-foreground mt-2">Order #{orderNumber}</p>
          </div>

          <div className="bg-muted rounded-2xl p-6 border-2 border-dashed border-border text-center mb-8">
            <img 
              src="/images/upi-qr-code.png" 
              alt="UPI QR Code" 
              className="mx-auto max-w-[200px] h-auto rounded-xl shadow-sm mb-4"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden flex-col items-center justify-center min-h-[200px] text-muted-foreground">
              <Smartphone size={48} className="text-primary opacity-50 mb-4" />
              <p>QR Code Unavailable</p>
            </div>
            <div className="mt-4 p-4 bg-background rounded-xl shadow-sm inline-block mx-auto border border-border">
              <span className="text-sm text-muted-foreground block mb-1">Amount to Pay</span>
              <span className="text-3xl font-black text-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-primary/5 rounded-2xl p-6 mb-8 text-sm text-foreground">
            <h3 className="font-bold text-foreground mb-3 text-base flex items-center gap-2">
              <Smartphone size={18} className="text-primary"/> Instructions:
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Open your UPI app (PhonePe, GPay, Paytm)</li>
              <li>Scan the QR code above</li>
              <li>Verify the amount to pay</li>
              <li><strong>Take a screenshot</strong> of the successful payment screen</li>
              <li>Upload the screenshot below to confirm your order</li>
            </ol>
          </div>

          <div className="mb-8">
            <h3 className="flex items-center gap-2 font-bold text-foreground mb-4">
              <Upload size={18} className="text-primary" /> Upload Screenshot
            </h3>
            
            <AnimatePresence mode="wait">
              {!screenshotPreview ? (
                <motion.label 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/40 rounded-2xl bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <input type="file" accept="image/*" onChange={handleScreenshotChange} className="hidden" />
                  <Upload size={32} className="text-primary mb-3" />
                  <p className="font-semibold text-foreground mb-1">Click to browse or drag image here</p>
                  <p className="text-xs text-muted-foreground">Supports PNG, JPG (Max 5MB)</p>
                </motion.label>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative rounded-2xl overflow-hidden border-2 border-primary bg-muted"
                >
                  <img src={screenshotPreview} alt="Preview" className="w-full max-h-64 object-contain" />
                  <button 
                    onClick={removeScreenshot}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-xl mb-8 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button 
              onClick={handlePaymentComplete}
              disabled={!screenshot || isUploading}
              className="w-full py-4 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all shadow-md active:scale-[0.98]"
            >
              {isUploading ? (
                <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Processing...</span>
              ) : (
                <><CheckCircle size={20} /> Confirm Payment</>
              )}
            </button>
            <button 
              onClick={() => {
                setShowQRCode(false);
                setScreenshot(null);
                setScreenshotPreview(null);
              }}
              disabled={isUploading}
              className="w-full py-4 rounded-full bg-background text-foreground font-semibold border-2 border-border hover:bg-muted transition-all"
            >
              Cancel & Go Back
            </button>
          </div>
          <p className="text-center text-xs text-destructive mt-4 font-medium italic">
            ⚠️ Please do not refresh or close this page until payment is verified.
          </p>
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
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-10">Secure Checkout</h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <form onSubmit={handlePlaceOrder} className="bg-card rounded-2xl p-8 shadow-sm border border-border mb-8 lg:mb-0">
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">1</span>
                  Shipping Details
                </h2>
                
                {error && (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-xl mb-6 text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Full Name</label>
                    <input 
                      name="name" 
                      value={shipping.name} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-primary focus:ring-0 transition-colors bg-background focus:bg-background"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Phone Number</label>
                    <input 
                      name="phone" 
                      value={shipping.phone} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-primary focus:ring-0 transition-colors bg-background focus:bg-background"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Full Delivery Address</label>
                    <textarea 
                      name="address" 
                      value={shipping.address} 
                      onChange={handleChange} 
                      required 
                      rows={4} 
                      className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-primary focus:ring-0 transition-colors bg-background focus:bg-background resize-none"
                      placeholder="House No, Street, Landmark, City, State, PIN"
                    />
                  </div>
                </div>
              </div>

              <div className="my-8 border-t border-border" />

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">2</span>
                  Payment Method
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`relative flex items-center p-5 cursor-pointer rounded-2xl border-2 transition-all ${paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-border hover:border-border bg-background'}`}>
                    <input type="radio" name="paymentMethod" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} className="sr-only" />
                    <Smartphone size={28} className={paymentMethod === 'upi' ? 'text-primary' : 'text-muted-foreground'} />
                    <div className="ml-4">
                      <span className={`block font-bold ${paymentMethod === 'upi' ? 'text-primary' : 'text-foreground'}`}>UPI Payment</span>
                      <span className="block text-xs text-muted-foreground mt-1">Scan QR & Pay Instantly</span>
                    </div>
                    {paymentMethod === 'upi' && <div className="absolute right-4 w-4 h-4 rounded-full bg-primary border-4 border-primary/20" />}
                  </label>

                  <label className={`relative flex items-center p-5 cursor-pointer rounded-2xl border-2 transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-border bg-background'}`}>
                    <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="sr-only" />
                    <Building2 size={28} className={paymentMethod === 'cod' ? 'text-primary' : 'text-muted-foreground'} />
                    <div className="ml-4">
                      <span className={`block font-bold ${paymentMethod === 'cod' ? 'text-primary' : 'text-foreground'}`}>Cash on Delivery</span>
                      <span className="block text-xs text-muted-foreground mt-1">Pay when you receive</span>
                    </div>
                    {paymentMethod === 'cod' && <div className="absolute right-4 w-4 h-4 rounded-full bg-primary border-4 border-primary/20" />}
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isPlacing}
                className="w-full mt-10 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
              >
                {isPlacing ? (
                  <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Processing...</span>
                ) : (
                  paymentMethod === 'upi' ? 'Proceed to Pay Securely' : 'Place Order Now'
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-card rounded-2xl p-8 shadow-sm border border-border">
              <h2 className="text-xl font-bold text-foreground mb-6">Order Summary</h2>
              
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 bg-background p-3 rounded-2xl border border-border shadow-sm">
                    <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-xs text-muted-foreground">Img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">₹{(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex justify-between items-center mb-3 text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-bold text-foreground">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-bold text-primary">Free</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="text-lg font-bold text-foreground">Total</span>
                  <span className="text-3xl font-black text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Checkout;