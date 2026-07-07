import { useState, useEffect } from 'react';
import { fetchOrders, updateOrder, refundOrder } from '../lib/supabase';
import type { PHOrder, OrderStatus } from '../lib/types';

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800',
  paid:       'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped:    'bg-indigo-100 text-indigo-800',
  delivered:  'bg-green-100 text-green-800',
  refunded:   'bg-orange-100 text-orange-800',
  cancelled:  'bg-red-100 text-red-800',
};

const STATUS_OPTIONS: OrderStatus[] = ['pending','paid','processing','shipped','delivered','refunded','cancelled'];

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<PHOrder[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<PHOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [carrierInput, setCarrierInput] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactStatus, setContactStatus] = useState('');

  async function load(params?: Record<string, string>) {
    setLoading(true);
    setError('');
    try {
      const data = await fetchOrders(params);
      setOrders(data.orders || []);
      setSummary(data.summary || null);
    } catch (e: any) {
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function applyFilters() {
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    if (search.trim()) params.search = search.trim();
    load(params);
  }

  async function handleStatusChange(order: PHOrder, status: OrderStatus) {
    setUpdating(true);
    try {
      const updated = await updateOrder(order.id, { status });
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...updated } : o));
      if (selected?.id === order.id) setSelected({ ...selected, ...updated });
    } catch (e: any) {
      alert('Update failed: ' + e.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleAddTracking() {
    if (!selected) return;
    setUpdating(true);
    try {
      const updated = await updateOrder(selected.id, {
        tracking_number: trackingInput,
        tracking_carrier: carrierInput,
        status: 'shipped',
      });
      setOrders(prev => prev.map(o => o.id === selected.id ? { ...o, ...updated } : o));
      setSelected({ ...selected, ...updated });
      setTrackingInput('');
      setCarrierInput('');
    } catch (e: any) {
      alert('Failed to add tracking: ' + e.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleContactCustomer() {
    if (!selected || !contactSubject.trim() || !contactMessage.trim()) return;
    setContactSending(true);
    setContactStatus('');
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selected.customer_email,
          subject: contactSubject,
          html: `<p>${contactMessage.replace(/\n/g, '<br>')}</p><p style="color:#888;font-size:12px">Regarding order #${selected.id.slice(0, 8)}</p>`,
          text: `${contactMessage}\n\nRegarding order #${selected.id.slice(0, 8)}`,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setContactStatus('Message sent.');
        setContactSubject('');
        setContactMessage('');
      } else {
        setContactStatus(result.error || 'Failed to send message.');
      }
    } catch {
      setContactStatus('Failed to send message.');
    } finally {
      setContactSending(false);
    }
  }

  async function handleRefund(order: PHOrder) {
    if (!confirm(`Refund $${order.total} to ${order.customer_email}? This cannot be undone.`)) return;
    setUpdating(true);
    try {
      await refundOrder(order.id);
      load();
      setSelected(null);
    } catch (e: any) {
      alert('Refund failed: ' + e.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Orders</h1>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Orders', value: summary.total_orders },
              { label: 'Revenue', value: fmt(summary.total_revenue) },
              { label: 'Pending', value: summary.by_status?.pending || 0 },
              { label: 'Shipped', value: summary.by_status?.shipped || 0 },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-xl border p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px]"
            placeholder="Search email or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
          />
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={applyFilters} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
            Filter
          </button>
          <button onClick={() => { setStatusFilter(''); setSearch(''); load(); }} className="border px-4 py-2 rounded-lg text-sm">
            Reset
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Orders list */}
          <div className={`${selected ? 'xl:w-1/2' : 'w-full'} transition-all`}> 
            <div className="bg-white rounded-xl border overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No orders found. They'll appear here after checkout.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-600">Order</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Customer</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Total</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Status</th>
                      <th className="text-left p-3 font-semibold text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr
                        key={order.id}
                        onClick={() => { setSelected(order); setTrackingInput(order.tracking_number || ''); setCarrierInput(order.tracking_carrier || ''); setContactSubject(''); setContactMessage(''); setContactStatus(''); }}
                        className={`border-b cursor-pointer hover:bg-pink-50 transition ${selected?.id === order.id ? 'bg-pink-50' : ''}`}
                      >
                        <td className="p-3 font-mono text-xs text-gray-500">{order.id.slice(0, 8)}…</td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{order.customer_name || '—'}</div>
                          <div className="text-gray-500 text-xs">{order.customer_email}</div>
                        </td>
                        <td className="p-3 font-semibold">{fmt(order.total)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500 text-xs">{timeAgo(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Order detail panel */}
          {selected && (
            <div className="xl:w-1/2 w-full bg-white rounded-xl border p-4 md:p-6 space-y-5 h-fit xl:sticky xl:top-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Order #{selected.id.slice(0, 8)}</h2>
                  <p className="text-sm text-gray-500">{new Date(selected.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              {/* Customer */}
              <div className="border-t pt-4">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Customer</p>
                <p className="font-semibold">{selected.customer_name || '—'}</p>
                <p className="text-sm text-gray-600">{selected.customer_email}</p>
                {selected.shipping_address?.line1 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selected.shipping_address.line1}, {selected.shipping_address.city}, {selected.shipping_address.state} {selected.shipping_address.zip}
                  </p>
                )}
              </div>

              {/* Contact customer */}
              <div className="border-t pt-4">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Contact customer</p>
                <input
                  className="border rounded-lg px-3 py-2 text-sm w-full mb-2"
                  placeholder="Subject"
                  value={contactSubject}
                  onChange={e => setContactSubject(e.target.value)}
                />
                <textarea
                  className="border rounded-lg px-3 py-2 text-sm w-full mb-2"
                  rows={3}
                  placeholder={`Message to ${selected.customer_email}`}
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                />
                <button
                  onClick={handleContactCustomer}
                  disabled={contactSending || !contactSubject.trim() || !contactMessage.trim()}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  {contactSending ? 'Sending...' : 'Send message'}
                </button>
                {contactStatus && <p className="text-xs text-gray-500 mt-2">{contactStatus}</p>}
              </div>

              {/* Items */}
              {selected.order_items && selected.order_items.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Items</p>
                  {selected.order_items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span>{item.product_name} {item.variant_name ? `(${item.variant_name})` : ''} × {item.quantity}</span>
                      <span className="font-medium">{fmt(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>{fmt(selected.total)}</span>
                  </div>
                </div>
              )}

              {/* Status change */}
              <div className="border-t pt-4">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Update Status</p>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      disabled={updating || selected.status === s}
                      onClick={() => handleStatusChange(selected, s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition ${selected.status === s ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 hover:border-gray-900 text-gray-700'} disabled:opacity-50`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleStatusChange(selected, 'processing')}
                  disabled={updating || selected.status === 'processing'}
                  className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Quick action: Mark as Processing
                </button>
              </div>

              {/* Tracking */}
              <div className="border-t pt-4">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Tracking</p>
                {selected.tracking_number && (
                  <p className="text-sm text-green-700 font-medium mb-2">
                    ✓ {selected.tracking_carrier} — {selected.tracking_number}
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    className="border rounded px-2 py-1 text-sm flex-1"
                    placeholder="Tracking number"
                    value={trackingInput}
                    onChange={e => setTrackingInput(e.target.value)}
                  />
                  <input
                    className="border rounded px-2 py-1 text-sm w-28"
                    placeholder="Carrier"
                    value={carrierInput}
                    onChange={e => setCarrierInput(e.target.value)}
                  />
                  <button
                    onClick={handleAddTracking}
                    disabled={updating || !trackingInput}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Refund */}
              {(selected.status === 'paid' || selected.status === 'processing') && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => handleRefund(selected)}
                    disabled={updating}
                    className="w-full border-2 border-red-400 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                  >
                    Issue Full Refund
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
  );
}
