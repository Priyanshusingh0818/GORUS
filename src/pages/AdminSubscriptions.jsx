import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, FileText, IndianRupee, Search, Trash2, Truck, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { adminSubscriptionsAPI } from '../utils/api';
import { formatCurrency } from '../utils/format';

const statusOptions = ['', 'active', 'paused', 'pending_payment', 'cancelled', 'expired'];

const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="premium-card p-5">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Icon size={20} />
    </div>
    <p className="text-sm font-semibold text-muted-foreground">{label}</p>
    <strong className="mt-1 block text-2xl text-foreground">{value}</strong>
  </div>
);

const AdminSubscriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ q: '', status: '', sort: 'expiry_asc' });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const fetchSubscriptions = useCallback(async () => {
    try {
      setError('');
      const response = await adminSubscriptionsAPI.getAll(filters);
      setSubscriptions(response.subscriptions || []);
      setStats(response.stats || null);
    } catch (err) {
      setError(err.message || 'Could not load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/admin/subscriptions' } });
      return;
    }
    if (!user.is_admin) {
      navigate('/');
      return;
    }
    fetchSubscriptions();
  }, [user, navigate, fetchSubscriptions]);

  const runAction = async (id, handler, successMessage) => {
    setBusyId(id || 'global');
    setError('');
    setNotice('');
    try {
      await handler();
      setNotice(successMessage);
      await fetchSubscriptions();
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const updateStatus = (subscription, status) => {
    runAction(subscription.id, () => adminSubscriptionsAPI.update(subscription.id, { status }), 'Subscription updated.');
  };

  const deleteSubscription = (subscription) => {
    if (!window.confirm(`Delete subscription #${subscription.id}?`)) return;
    runAction(subscription.id, () => adminSubscriptionsAPI.remove(subscription.id), 'Subscription deleted.');
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="page-shell section-y">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="premium-eyebrow mb-3">Admin subscriptions</p>
            <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Milk delivery control room.
            </motion.h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-muted-foreground">
              Mark deliveries, manage pauses, generate invoices, and spot renewals before they become missed revenue.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => runAction('invoice', () => adminSubscriptionsAPI.generateInvoices(new Date().toISOString().slice(0, 7)), 'Invoices generated and emails queued.')}
              className="premium-button-primary"
            >
              <FileText size={18} /> Generate invoices
            </button>
            <button
              type="button"
              onClick={() => runAction('reminder', () => adminSubscriptionsAPI.sendRenewalReminders(), 'Renewal reminders sent.')}
              className="premium-button-secondary"
            >
              <Bell size={18} /> Send reminders
            </button>
          </div>
        </div>

        {error && <p className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-semibold text-destructive">{error}</p>}
        {notice && <p className="mb-5 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm font-semibold text-primary">{notice}</p>}

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={Users} label="Active subscribers" value={stats?.activeSubscribers || 0} />
          <StatCard icon={Bell} label="Expiring soon" value={stats?.expiringSoon || 0} />
          <StatCard icon={IndianRupee} label="Monthly revenue" value={formatCurrency(stats?.monthlyRevenue || 0)} />
          <StatCard icon={Truck} label="Litres today" value={`${Number(stats?.deliveredLitresToday || 0)} L`} />
          <StatCard icon={FileText} label="Pending payments" value={formatCurrency(stats?.pendingPayments || 0)} />
        </div>

        <div className="premium-card mb-6 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={filters.q}
                onChange={(event) => setFilters(current => ({ ...current, q: event.target.value }))}
                className="premium-input w-full rounded-full pl-11"
                placeholder="Search customer, email, milk"
              />
            </label>
            <select
              value={filters.status}
              onChange={(event) => setFilters(current => ({ ...current, status: event.target.value }))}
              className="premium-input w-full"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status ? status.replace('_', ' ') : 'All status'}</option>
              ))}
            </select>
            <select
              value={filters.sort}
              onChange={(event) => setFilters(current => ({ ...current, sort: event.target.value }))}
              className="premium-input w-full"
            >
              <option value="expiry_asc">Expiry soonest</option>
              <option value="newest">Newest first</option>
              <option value="litres_desc">Highest litres</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        <section className="premium-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Plan</th>
                  <th className="px-5 py-4">Dates</th>
                  <th className="px-5 py-4">Delivery</th>
                  <th className="px-5 py-4">Billing</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Today</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-t border-border">
                      <td colSpan="8" className="px-5 py-4"><div className="skeleton h-9 rounded-full" /></td>
                    </tr>
                  ))
                ) : subscriptions.length ? subscriptions.map(subscription => (
                  <tr key={subscription.id} className="border-t border-border align-top">
                    <td className="px-5 py-4">
                      <strong className="block text-foreground">{subscription.user_name || 'Customer'}</strong>
                      <span className="block text-muted-foreground">{subscription.user_email}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">#{subscription.id}</span>
                    </td>
                    <td className="px-5 py-4">
                      <strong className="block">{subscription.milk_type}</strong>
                      <span className="text-muted-foreground">{Number(subscription.litres_per_day)} L/day</span>
                      <span className="block text-muted-foreground">{subscription.plan_label}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="block">{formatDate(subscription.start_date)}</span>
                      <span className="block text-muted-foreground">to {formatDate(subscription.expiry_date)}</span>
                      <span className="block font-semibold text-primary">{subscription.remaining_days} days left</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="block">{Number(subscription.delivered_days_month || 0)} days this month</span>
                      <span className="block text-muted-foreground">{subscription.delivery_phone || subscription.user_phone || 'No phone'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="block">Advance {formatCurrency(subscription.advance_remaining)}</span>
                      <span className="block text-muted-foreground">Pending {formatCurrency(subscription.pending_dues || 0)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={subscription.status}
                        onChange={(event) => updateStatus(subscription, event.target.value)}
                        disabled={busyId === subscription.id}
                        className="premium-input min-w-[150px]"
                      >
                        {statusOptions.filter(Boolean).map(status => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busyId === subscription.id}
                          onClick={() => runAction(subscription.id, () => adminSubscriptionsAPI.markDelivery(subscription.id, { delivered: true }), 'Delivery marked.')}
                          className="premium-button-primary min-h-[40px] px-3"
                          title="Mark delivered today"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === subscription.id}
                          onClick={() => runAction(subscription.id, () => adminSubscriptionsAPI.markDelivery(subscription.id, { delivered: false, note: 'Skipped by admin' }), 'Delivery skipped.')}
                          className="premium-button-secondary min-h-[40px] px-3"
                        >
                          Skip
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={busyId === subscription.id}
                        onClick={() => deleteSubscription(subscription)}
                        className="premium-button-secondary min-h-[40px] px-3 text-destructive"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="px-5 py-10 text-center text-muted-foreground">No subscriptions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
};

export default AdminSubscriptions;
