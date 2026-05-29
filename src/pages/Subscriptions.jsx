import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, FileText, Pause, Play, RefreshCw, Trash2, Truck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { subscriptionsAPI } from '../utils/api';
import { formatCurrency } from '../utils/format';

const statusStyles = {
  active: 'border-primary/20 bg-primary/10 text-primary',
  paused: 'border-accent bg-accent text-accent-foreground',
  pending_payment: 'border-border bg-muted text-muted-foreground',
  cancelled: 'border-destructive/20 bg-destructive/10 text-destructive',
  expired: 'border-border bg-muted text-muted-foreground'
};

const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';

const Subscriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const activeSubscription = useMemo(
    () => subscriptions.find(item => ['active', 'paused', 'pending_payment'].includes(item.status)) || subscriptions[0],
    [subscriptions]
  );

  const fetchSubscriptions = useCallback(async () => {
    try {
      setError('');
      const response = await subscriptionsAPI.getMySubscriptions();
      setSubscriptions(response.subscriptions || []);
      setDeliveryHistory(response.deliveryHistory || []);
      setInvoices(response.invoices || []);
    } catch (err) {
      setError(err.message || 'Could not load subscriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/subscriptions' } });
      return;
    }
    fetchSubscriptions();
  }, [user, navigate, fetchSubscriptions]);

  const runAction = async (handler) => {
    setActionLoading(true);
    setError('');
    try {
      await handler();
      await fetchSubscriptions();
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="page-shell section-y">
          <div className="skeleton h-5 w-36 rounded-full" />
          <div className="skeleton mt-4 h-12 w-72 rounded-full" />
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => <div key={index} className="skeleton h-44 rounded-lg" />)}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="page-shell section-y">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="premium-eyebrow mb-3">Milk subscription</p>
            <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Daily delivery, simple billing.
            </motion.h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-muted-foreground">
              Track deliveries, pauses, invoices, and renewal from one calm dashboard.
            </p>
          </div>
          <Link to="/subscriptions/new" className="premium-button-primary">
            Start subscription
          </Link>
        </div>

        {error && <p className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-semibold text-destructive">{error}</p>}

        {!activeSubscription ? (
          <div className="premium-card mx-auto max-w-2xl p-10 text-center">
            <Truck className="mx-auto mb-5 text-primary" size={48} />
            <h2 className="text-3xl font-bold text-foreground">No milk subscription yet</h2>
            <p className="mt-3 text-muted-foreground">Subscribe for Rs 55/litre and pay only for delivered days.</p>
            <Link to="/subscriptions/new" className="premium-button-primary mt-7">Choose plan</Link>
          </div>
        ) : (
          <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="premium-card p-5 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className={`mb-4 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusStyles[activeSubscription.status] || statusStyles.expired}`}>
                    {activeSubscription.status.replace('_', ' ')}
                  </div>
                  <h2 className="text-3xl font-bold text-foreground">{activeSubscription.milk_type}</h2>
                  <p className="mt-2 text-muted-foreground">{activeSubscription.plan_label} plan at Rs 55/litre.</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="block text-sm font-semibold text-muted-foreground">Daily quantity</span>
                  <strong className="text-3xl text-primary">{Number(activeSubscription.litres_per_day)} L</strong>
                </div>
              </div>

              <div className="my-7 border-t border-border" />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['Start', formatDate(activeSubscription.start_date)],
                  ['Expiry', formatDate(activeSubscription.expiry_date)],
                  ['Remaining', `${activeSubscription.remaining_days || 0} days`],
                  ['Advance left', formatCurrency(activeSubscription.advance_remaining)]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-border bg-muted/40 p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                    <strong className="mt-2 block text-lg text-foreground">{value}</strong>
                  </div>
                ))}
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {activeSubscription.status === 'active' && (
                  <button type="button" disabled={actionLoading} onClick={() => runAction(() => subscriptionsAPI.pause(activeSubscription.id))} className="premium-button-secondary justify-center">
                    <Pause size={17} /> Pause
                  </button>
                )}
                {activeSubscription.status === 'paused' && (
                  <button type="button" disabled={actionLoading} onClick={() => runAction(() => subscriptionsAPI.resume(activeSubscription.id))} className="premium-button-primary justify-center">
                    <Play size={17} /> Resume
                  </button>
                )}
                <button type="button" disabled={actionLoading} onClick={() => runAction(() => subscriptionsAPI.renew(activeSubscription.id, '1_month'))} className="premium-button-secondary justify-center">
                  <RefreshCw size={17} /> Renew
                </button>
                <button type="button" disabled={actionLoading} onClick={() => runAction(() => subscriptionsAPI.cancel(activeSubscription.id))} className="premium-button-secondary justify-center text-destructive">
                  <Trash2 size={17} /> Cancel
                </button>
              </div>
            </article>

            <aside className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <div className="premium-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <CalendarClock className="text-primary" size={20} />
                  <h2 className="text-xl font-bold text-foreground">This month</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Delivered days</span>
                    <strong>{Number(activeSubscription.delivered_days_month || 0)}</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Bill estimate</span>
                    <strong>{formatCurrency(activeSubscription.month_gross || 0)}</strong>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
                    Final invoices subtract available advance before asking for payment.
                  </div>
                </div>
              </div>

              <div className="premium-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <FileText className="text-primary" size={20} />
                  <h2 className="text-xl font-bold text-foreground">Billing rule</h2>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  Skipped or paused days are not billed. If you pause delivery, the expiry date extends by the paused days.
                </p>
              </div>
            </aside>
          </div>
        )}

        <div className="mt-10 grid gap-7 lg:grid-cols-2">
          <section className="premium-card overflow-hidden">
            <div className="border-b border-border p-5">
              <h2 className="text-2xl font-bold text-foreground">Delivery history</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Litres</th>
                    <th className="px-5 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {deliveryHistory.length ? deliveryHistory.map(item => (
                      <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border">
                        <td className="px-5 py-4">{formatDate(item.delivery_date)}</td>
                        <td className="px-5 py-4">{item.delivered ? 'Delivered' : 'Skipped'}</td>
                        <td className="px-5 py-4">{Number(item.litres)} L</td>
                        <td className="px-5 py-4 font-bold">{formatCurrency(item.amount)}</td>
                      </motion.tr>
                    )) : (
                      <tr><td colSpan="4" className="px-5 py-8 text-center text-muted-foreground">No delivery history yet.</td></tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </section>

          <section className="premium-card overflow-hidden">
            <div className="border-b border-border p-5">
              <h2 className="text-2xl font-bold text-foreground">Invoices</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Month</th>
                    <th className="px-5 py-3">Delivered</th>
                    <th className="px-5 py-3">Advance</th>
                    <th className="px-5 py-3">Due</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length ? invoices.map(invoice => (
                    <tr key={invoice.id} className="border-t border-border">
                      <td className="px-5 py-4">{invoice.invoice_month}</td>
                      <td className="px-5 py-4">{invoice.delivered_days} days</td>
                      <td className="px-5 py-4">{formatCurrency(invoice.advance_adjusted)}</td>
                      <td className="px-5 py-4 font-bold">{formatCurrency(invoice.amount_due)}</td>
                      <td className="px-5 py-4 capitalize">{invoice.status}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="px-5 py-8 text-center text-muted-foreground">No invoices yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};

export default Subscriptions;
