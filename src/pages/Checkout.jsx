import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Building2, CheckCircle, Clock, PackageCheck, ShieldCheck, ShoppingBag, Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../utils/api';
import { formatCurrency } from '../utils/format';
import OptimizedImage from '../components/OptimizedImage';
import DeliveryAvailability from '../components/DeliveryAvailability';

const deliveryUnavailableMessage = "Gorus currently delivers only in Buxar (802101). We'll be expanding to your area soon.";

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shipping, setShipping] = useState({ name: user?.name || '', address: '', phone: '', pincode: '' });
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [deliveryAvailability, setDeliveryAvailability] = useState(null);
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
  const isDeliveryAllowed = deliveryAvailability?.allowed === true;
  const hasFullPincode = shipping.pincode.replace(/\D/g, '').length === 6;

  const handleChange = (e) => {
    const value = e.target.name === 'pincode'
      ? e.target.value.replace(/\D/g, '').slice(0, 6)
      : e.target.value;
    setShipping({ ...shipping, [e.target.name]: value });
  };

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

    if (!isDeliveryAllowed) {
      setError(hasFullPincode ? deliveryUnavailableMessage : 'Please enter your 6-digit delivery pincode before payment.');
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
      setError('Please upload a PNG or JPG payment screenshot.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Payment screenshot should be less than 5MB.');
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
      setError('Please upload the payment screenshot before confirming.');
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
        <div className="premium-card w-full max-w-md p-8 text-center">
          <ShieldCheck size={48} className="mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-8">Please log in to your account to securely proceed with your checkout.</p>
          <button onClick={() => navigate('/login')} className="premium-button-primary w-full">
            Proceed to Login
          </button>
        </div>
      </motion.div>
    );
  }

  if (cartItems.length === 0 && !showQRCode) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex min-h-[72vh] items-center justify-center bg-background px-4"
      >
        <div className="premium-card max-w-md p-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShoppingBag size={38} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Your cart is empty</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Add a fresh essential first, then checkout will keep your order details simple and secure.
          </p>
          <button type="button" onClick={() => navigate('/products/available')} className="premium-button-primary mt-6 w-full">
            Browse available products
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
        <div className="premium-card mx-auto max-w-xl p-6 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <Clock size={32} />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Complete Payment</h2>
            <p className="text-muted-foreground mt-2">Order #{orderNumber}</p>
          </div>

          <div className="mb-8 rounded-lg border border-dashed border-border bg-muted p-6 text-center">
            <img 
              src="/images/upi-qr-code.png" 
              alt="UPI QR Code" 
              className="mx-auto mb-4 h-auto max-w-[200px] rounded-lg shadow-sm"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden flex-col items-center justify-center min-h-[200px] text-muted-foreground">
              <Smartphone size={48} className="text-primary opacity-50 mb-4" />
              <p>QR Code Unavailable</p>
            </div>
            <div className="mx-auto mt-4 inline-block rounded-lg border border-border bg-background p-4 shadow-sm">
              <span className="text-sm text-muted-foreground block mb-1">Amount to Pay</span>
              <span className="text-3xl font-black text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="mb-8 rounded-lg bg-primary/5 p-6 text-sm text-foreground">
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
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/40 bg-primary/5 p-8 transition-colors hover:bg-primary/10"
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
                  className="relative overflow-hidden rounded-lg border border-primary bg-muted"
                >
                  <img src={screenshotPreview} alt="Preview" className="w-full max-h-64 object-contain" />
                  <button 
                    onClick={removeScreenshot}
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-colors hover:bg-destructive/90"
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
              className="premium-button-primary w-full disabled:cursor-not-allowed"
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
              className="premium-button-secondary w-full"
            >
              Cancel & Go Back
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4 font-medium">
            Please keep this page open until payment is confirmed.
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
      className="min-h-screen bg-background"
    >
      <div className="page-shell section-y">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-primary">Final step</p>
        <h1 className="mb-10 text-4xl font-extrabold tracking-tight text-foreground">Secure Checkout</h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <form onSubmit={handlePlaceOrder} className="premium-card mb-8 p-6 sm:p-8 lg:mb-0">
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">1</span>
                  Shipping Details
                </h2>
                <p className="mb-5 text-sm leading-6 text-muted-foreground">
                  Share the delivery details a real person can use. Add landmarks if they help your order reach you cleanly.
                </p>
                
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
                      className="premium-input w-full bg-background"
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
                      className="premium-input w-full bg-background"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Delivery Pincode</label>
                    <input
                      name="pincode"
                      value={shipping.pincode}
                      onChange={handleChange}
                      required
                      inputMode="numeric"
                      maxLength={6}
                      className="premium-input w-full bg-background"
                      placeholder="802101"
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
                      className="premium-input w-full resize-none bg-background"
                      placeholder="House No, Street, Landmark, City, State, PIN"
                    />
                  </div>
                  <DeliveryAvailability
                    pincode={shipping.pincode}
                    user={user}
                    source="checkout"
                    onChange={setDeliveryAvailability}
                  />
                </div>
              </div>

              <div className="my-8 border-t border-border" />

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">2</span>
                  Payment Method
                </h2>
                <p className="mb-5 text-sm leading-6 text-muted-foreground">
                  Choose UPI for a quick confirmation or Cash on Delivery if you prefer to pay at handoff.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`relative flex items-center rounded-lg border p-5 transition-all ${isDeliveryAllowed ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/30'}`}>
                    <input type="radio" name="paymentMethod" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} className="sr-only" disabled={!isDeliveryAllowed} />
                    <Smartphone size={28} className={paymentMethod === 'upi' ? 'text-primary' : 'text-muted-foreground'} />
                    <div className="ml-4">
                      <span className={`block font-bold ${paymentMethod === 'upi' ? 'text-primary' : 'text-foreground'}`}>UPI Payment</span>
                      <span className="block text-xs text-muted-foreground mt-1">Scan QR & Pay Instantly</span>
                    </div>
                    {paymentMethod === 'upi' && <div className="absolute right-4 w-4 h-4 rounded-full bg-primary border-4 border-primary/20" />}
                  </label>

                  <label className={`relative flex items-center rounded-lg border p-5 transition-all ${isDeliveryAllowed ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/30'}`}>
                    <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="sr-only" disabled={!isDeliveryAllowed} />
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
                disabled={isPlacing || !isDeliveryAllowed}
                className="premium-button-primary mt-10 w-full text-base"
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
            <div className="premium-card sticky top-28 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground mb-6">Order Summary</h2>
              
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 rounded-lg border border-border bg-background p-3 shadow-sm">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.image ? (
                        <OptimizedImage src={item.image} alt={item.name} loading="lazy" sizes="64px" className="h-full w-full object-contain p-1" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-xs text-muted-foreground">Img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex justify-between items-center mb-3 text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-bold text-foreground">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-bold text-primary">Free</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="text-lg font-bold text-foreground">Total</span>
                  <span className="text-3xl font-black text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-primary/15 bg-primary/10 p-4">
                <div className="flex gap-3">
                  <PackageCheck size={20} className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Order confidence</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      You will receive a clear order confirmation. If anything is incorrect or damaged, contact support with the order details for help.
                    </p>
                  </div>
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
