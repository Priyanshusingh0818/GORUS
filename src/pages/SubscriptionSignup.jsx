import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CheckCircle2, CreditCard, Droplets, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { subscriptionsAPI } from '../utils/api';
import { formatCurrency } from '../utils/format';
import DeliveryAvailability from '../components/DeliveryAvailability';

const deliveryUnavailableMessage = "Gorus currently delivers only in Buxar (802101). We'll be expanding to your area soon.";

const plans = [
  { value: '1_month', label: '1 Month' },
  { value: '3_months', label: '3 Months' },
  { value: '6_months', label: '6 Months' },
  { value: '1_year', label: '1 Year' }
];

const milkTypes = ['Fresh Cow Milk', 'A2 Cow Milk'];

const SubscriptionSignup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    milkType: 'Fresh Cow Milk',
    litresPerDay: 1,
    duration: '1_month',
    deliveryAddress: '',
    deliveryPhone: '',
    deliveryPincode: ''
  });
  const [deliveryAvailability, setDeliveryAvailability] = useState(null);
  const [createdSubscription, setCreatedSubscription] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const advanceAmount = useMemo(() => Number(form.litresPerDay || 0) * 55 * 10, [form.litresPerDay]);
  const monthlyEstimate = useMemo(() => Number(form.litresPerDay || 0) * 55 * 30, [form.litresPerDay]);
  const isDeliveryAllowed = deliveryAvailability?.allowed === true;

  const updateField = (field, value) => {
    const nextValue = field === 'deliveryPincode'
      ? String(value).replace(/\D/g, '').slice(0, 6)
      : value;
    setForm(current => ({ ...current, [field]: nextValue }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: '/subscriptions/new' } });
      return;
    }

    if (!isDeliveryAllowed) {
      setError(form.deliveryPincode.length === 6 ? deliveryUnavailableMessage : 'Please enter your 6-digit delivery pincode before starting a subscription.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await subscriptionsAPI.create(form);
      setCreatedSubscription(response.subscription);
      setMessage('Subscription created. Upload your UPI proof to activate delivery.');
    } catch (err) {
      setError(err.message || 'Could not create subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentProof || !createdSubscription) return;
    if (!isDeliveryAllowed) {
      setError(deliveryUnavailableMessage);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await subscriptionsAPI.confirmPayment(createdSubscription.id, paymentProof);
      navigate('/subscriptions');
    } catch (err) {
      setError(err.message || 'Could not upload payment proof');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="page-shell section-y">
        <div className="mb-10 max-w-3xl">
          <p className="premium-eyebrow mb-3">Daily milk subscription</p>
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Premium milk at a better daily rate.
          </motion.h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Normal milk is Rs 60/litre. Subscribers get Rs 55/litre and pay only for delivered days.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleCreate} className="premium-card p-5 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-foreground">Milk type</span>
                <select
                  value={form.milkType}
                  onChange={(event) => updateField('milkType', event.target.value)}
                  className="premium-input w-full"
                >
                  {milkTypes.map(type => <option key={type}>{type}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-foreground">Litres per day</span>
                <input
                  type="number"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={form.litresPerDay}
                  onChange={(event) => updateField('litresPerDay', event.target.value)}
                  className="premium-input w-full"
                  required
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-foreground">Plan duration</span>
                <div className="grid gap-3 sm:grid-cols-4">
                  {plans.map(plan => (
                    <button
                      type="button"
                      key={plan.value}
                      onClick={() => updateField('duration', plan.value)}
                      className={`min-h-[48px] rounded-full border px-4 text-sm font-bold transition ${
                        form.duration === plan.value
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-card text-foreground hover:border-primary/35'
                      }`}
                    >
                      {plan.label}
                    </button>
                  ))}
                </div>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-foreground">Delivery pincode</span>
                <input
                  value={form.deliveryPincode}
                  onChange={(event) => updateField('deliveryPincode', event.target.value)}
                  className="premium-input w-full"
                  placeholder="802101"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </label>

              <div className="sm:col-span-2">
                <DeliveryAvailability
                  pincode={form.deliveryPincode}
                  user={user}
                  source="subscription"
                  onChange={setDeliveryAvailability}
                />
              </div>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-foreground">Delivery address</span>
                <textarea
                  value={form.deliveryAddress}
                  onChange={(event) => updateField('deliveryAddress', event.target.value)}
                  className="premium-input min-h-[110px] w-full resize-none"
                  placeholder="House number, street, area"
                  required
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-foreground">Delivery phone</span>
                <input
                  type="tel"
                  value={form.deliveryPhone}
                  onChange={(event) => updateField('deliveryPhone', event.target.value)}
                  className="premium-input w-full"
                  placeholder="Phone number for delivery coordination"
                  required
                />
              </label>
            </div>

            {error && <p className="mt-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-semibold text-destructive">{error}</p>}
            {message && <p className="mt-5 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm font-semibold text-primary">{message}</p>}

            <button type="submit" disabled={loading || Boolean(createdSubscription) || !isDeliveryAllowed} className="premium-button-primary mt-7 w-full">
              <CreditCard size={18} />
              {createdSubscription ? 'Subscription created' : loading ? 'Creating...' : 'Continue to UPI payment'}
            </button>
          </motion.form>

          <aside className="space-y-5">
            <div className="premium-card p-6">
              <p className="premium-eyebrow mb-4">Plan summary</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Subscriber price</span>
                  <strong className="text-foreground">Rs 55/litre</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Advance for 10 days</span>
                  <strong className="text-2xl text-primary">{formatCurrency(advanceAmount)}</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">30 day estimate</span>
                  <strong className="text-foreground">{formatCurrency(monthlyEstimate)}</strong>
                </div>
              </div>
              <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
                Advance is not an extra charge. It is adjusted later against delivered days.
              </div>
            </div>

            <div className="premium-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <Droplets className="text-primary" size={20} />
                <h2 className="text-xl font-bold text-foreground">How billing works</h2>
              </div>
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                <li className="flex gap-3"><CheckCircle2 className="mt-0.5 text-primary" size={17} /> Charged only for actual delivered days.</li>
                <li className="flex gap-3"><CheckCircle2 className="mt-0.5 text-primary" size={17} /> Paused days are not billed and extend the plan.</li>
                <li className="flex gap-3"><CheckCircle2 className="mt-0.5 text-primary" size={17} /> Renewal reminders start 3 days before expiry.</li>
              </ul>
            </div>

            {createdSubscription && (
              <div className="premium-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <CalendarDays className="text-primary" size={20} />
                  <h2 className="text-xl font-bold text-foreground">UPI payment</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-[140px_1fr] lg:grid-cols-1">
                  <img src="/images/upi-qr-code.png" alt="GORUS UPI QR code" className="aspect-square w-full max-w-[180px] rounded-lg border border-border bg-white object-contain p-3" />
                  <div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Pay {formatCurrency(createdSubscription.advance_paid)} and upload the screenshot. Delivery activates after proof upload.
                    </p>
                    <label className="mt-4 block">
                      <span className="mb-2 block text-sm font-bold text-foreground">Payment screenshot</span>
                      <input type="file" accept="image/*" onChange={(event) => setPaymentProof(event.target.files?.[0] || null)} className="premium-input w-full" />
                    </label>
                    <button type="button" onClick={handleConfirmPayment} disabled={!paymentProof || loading || !isDeliveryAllowed} className="premium-button-primary mt-4 w-full">
                      <Upload size={18} />
                      {loading ? 'Uploading...' : 'Activate subscription'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
};

export default SubscriptionSignup;
