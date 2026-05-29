import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, MapPin, Search, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { adminDeliveryAPI } from '../utils/api';

const formatDate = (value) => new Date(value).toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const AdminDeliveryRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState([]);
  const [filters, setFilters] = useState({ q: '', pincode: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalRequests = useMemo(() => summary.reduce((sum, item) => sum + Number(item.request_count || 0), 0), [summary]);

  const fetchRequests = useCallback(async () => {
    try {
      setError('');
      const response = await adminDeliveryAPI.getRequests(filters);
      setRequests(response.requests || []);
      setSummary(response.summary || []);
    } catch (err) {
      setError(err.message || 'Could not load delivery requests');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/admin/delivery-requests' } });
      return;
    }
    if (!user.is_admin) {
      navigate('/');
      return;
    }
    fetchRequests();
  }, [user, navigate, fetchRequests]);

  const exportCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'Pincode', 'Source', 'Requested At'];
    const rows = requests.map(item => [
      item.name || '',
      item.email || '',
      item.phone || '',
      item.pincode || '',
      item.source || '',
      item.created_at || ''
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gorus-delivery-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="page-shell section-y">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="premium-eyebrow mb-3">Delivery expansion</p>
            <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Unsupported pincode requests.
            </motion.h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-muted-foreground">
              See where customers are asking GORUS to open delivery next.
            </p>
          </div>
          <button type="button" onClick={exportCsv} disabled={!requests.length} className="premium-button-secondary">
            <Download size={18} /> Export CSV
          </button>
        </div>

        {error && <p className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-semibold text-destructive">{error}</p>}

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="premium-card p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users size={20} />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">Total interest</p>
            <strong className="mt-1 block text-2xl text-foreground">{totalRequests}</strong>
          </div>
          {summary.slice(0, 2).map(item => (
            <div key={item.pincode} className="premium-card p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPin size={20} />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">Pincode {item.pincode}</p>
              <strong className="mt-1 block text-2xl text-foreground">{item.request_count} requests</strong>
            </div>
          ))}
        </div>

        <div className="premium-card mb-6 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={filters.q}
                onChange={(event) => setFilters(current => ({ ...current, q: event.target.value }))}
                className="premium-input w-full rounded-full pl-11"
                placeholder="Search name, email, or phone"
              />
            </label>
            <input
              value={filters.pincode}
              onChange={(event) => setFilters(current => ({ ...current, pincode: event.target.value.replace(/\D/g, '').slice(0, 6) }))}
              className="premium-input w-full"
              placeholder="Filter pincode"
              inputMode="numeric"
              maxLength={6}
            />
          </div>
        </div>

        <section className="premium-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Pincode</th>
                  <th className="px-5 py-4">Source</th>
                  <th className="px-5 py-4">Requested</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-t border-border">
                      <td colSpan="5" className="px-5 py-4"><div className="skeleton h-9 rounded-full" /></td>
                    </tr>
                  ))
                ) : requests.length ? requests.map(item => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-5 py-4">
                      <strong className="block text-foreground">{item.name || 'Customer'}</strong>
                      <span className="text-muted-foreground">{item.email || 'No email'}</span>
                    </td>
                    <td className="px-5 py-4">{item.phone || 'No phone'}</td>
                    <td className="px-5 py-4 font-bold text-primary">{item.pincode}</td>
                    <td className="px-5 py-4 capitalize">{item.source || 'website'}</td>
                    <td className="px-5 py-4">{formatDate(item.created_at)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-5 py-10 text-center text-muted-foreground">No requests found.</td>
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

export default AdminDeliveryRequests;
