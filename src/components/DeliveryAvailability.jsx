import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, MapPin, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { deliveryAPI } from '../utils/api';

const defaultNotice = "Gorus currently delivers only in Buxar (802101). We'll be expanding to your area soon.";

const DeliveryAvailability = ({ pincode, user, source = 'website', onChange }) => {
  const [status, setStatus] = useState('idle');
  const [availability, setAvailability] = useState(null);
  const [notifyForm, setNotifyForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    pincode: pincode || ''
  });
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyLoading, setNotifyLoading] = useState(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setNotifyForm(current => ({ ...current, pincode: pincode || '' }));
  }, [pincode]);

  useEffect(() => {
    const cleanPincode = String(pincode || '').replace(/\D/g, '').slice(0, 6);
    setNotifyMessage('');

    if (cleanPincode.length !== 6) {
      setStatus('idle');
      setAvailability(null);
      onChangeRef.current?.(null);
      return undefined;
    }

    let cancelled = false;
    setStatus('checking');

    const timeout = setTimeout(async () => {
      try {
        const response = await deliveryAPI.checkAvailability(cleanPincode);
        if (cancelled) return;
        setAvailability(response.availability);
        setStatus(response.availability?.allowed ? 'available' : 'unavailable');
        onChangeRef.current?.(response.availability);
      } catch (error) {
        if (cancelled) return;
        const fallback = {
          allowed: false,
          pincode: cleanPincode,
          message: defaultNotice
        };
        setAvailability(fallback);
        setStatus('unavailable');
        onChangeRef.current?.(fallback);
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [pincode]);

  const handleNotify = async (event) => {
    event.preventDefault();
    setNotifyLoading(true);
    setNotifyMessage('');

    try {
      const response = await deliveryAPI.notify({ ...notifyForm, source });
      setNotifyMessage(response.message || "Thanks. We'll let you know when delivery opens in your area.");
    } catch (error) {
      setNotifyMessage(error.message || 'Please check the details and try again.');
    } finally {
      setNotifyLoading(false);
    }
  };

  if (status === 'idle') {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
        Enter your 6-digit pincode to confirm GORUS delivery availability before payment.
      </div>
    );
  }

  if (status === 'checking') {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-4">
        <div className="skeleton h-4 w-64 rounded-full" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {status === 'available' ? (
        <motion.div
          key="available"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="rounded-lg border border-primary/20 bg-primary/10 p-4"
        >
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={20} />
            <div>
              <h3 className="text-sm font-bold text-foreground">Delivery available</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {availability?.message || 'Delivery is available for this pincode.'}
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="unavailable"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="rounded-lg border border-accent bg-accent/45 p-4"
        >
          <div className="flex gap-3">
            <MapPin className="mt-0.5 shrink-0 text-primary" size={20} />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-foreground">Delivery is not open here yet</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {availability?.message || defaultNotice}
              </p>
            </div>
          </div>

          <form onSubmit={handleNotify} className="mt-5 grid gap-3 sm:grid-cols-2">
            <input
              value={notifyForm.name}
              onChange={(event) => setNotifyForm(current => ({ ...current, name: event.target.value }))}
              className="premium-input w-full bg-background"
              placeholder="Name"
              required
            />
            <input
              type="email"
              value={notifyForm.email}
              onChange={(event) => setNotifyForm(current => ({ ...current, email: event.target.value }))}
              className="premium-input w-full bg-background"
              placeholder="Email"
              required
            />
            <input
              type="tel"
              value={notifyForm.phone}
              onChange={(event) => setNotifyForm(current => ({ ...current, phone: event.target.value }))}
              className="premium-input w-full bg-background"
              placeholder="Phone number"
              required
            />
            <input
              value={notifyForm.pincode}
              onChange={(event) => setNotifyForm(current => ({ ...current, pincode: event.target.value.replace(/\D/g, '').slice(0, 6) }))}
              className="premium-input w-full bg-background"
              placeholder="Pincode"
              inputMode="numeric"
              maxLength={6}
              required
            />
            <button type="submit" disabled={notifyLoading} className="premium-button-secondary justify-center sm:col-span-2">
              {notifyLoading ? <Bell size={18} /> : <Send size={18} />}
              {notifyLoading ? 'Saving request...' : 'Notify Me When Available'}
            </button>
          </form>

          {notifyMessage && (
            <p className="mt-3 rounded-lg border border-border bg-background p-3 text-sm font-semibold text-foreground">
              {notifyMessage}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeliveryAvailability;
