import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/api/axiosClient';
import './adminPanel.css';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'];

const STATUS_COLORS = {
  PENDING:   { bg: '#fff3cd', color: '#856404' },
  CONFIRMED: { bg: '#cce5ff', color: '#004085' },
  PREPARING: { bg: '#d4edda', color: '#155724' },
  READY:     { bg: '#d1ecf1', color: '#0c5460' },
  DELIVERED: { bg: '#d6d8d9', color: '#383d41' },
};

const AdminPanel = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingOid, setUpdatingOid] = useState(null);

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/v1/orders?page=0&size=50&sort=createdAt,desc');
      setOrders(data.content || []);
    } catch (err) {
      toast.error('Failed to load orders. Make sure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllOrders(); }, []);

  const handleStatusChange = async (oid, newStatus) => {
    setUpdatingOid(oid);
    try {
      await api.put(`/api/v1/orders/${oid}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.oid === oid ? { ...o, status: newStatus } : o))
      );
      toast.success(`Order #${oid} â†’ ${newStatus}`);
    } catch (err) {
      toast.error('Status update failed.');
    } finally {
      setUpdatingOid(null);
    }
  };

  if (loading) {
    return (
      <div className='adminPanel'>
        <h1>Admin â€” All Orders</h1>
        <div className='adminLoading'>
          <div className='adminSpinner' />
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='adminPanel'>
      <div className='adminHeader'>
        <h1>Admin â€” All Orders</h1>
        <button className='adminRefresh' onClick={fetchAllOrders}>â†» Refresh</button>
      </div>
      <p className='adminCount'>{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
      {orders.length === 0 ? (
        <p className='adminEmpty'>No orders found.</p>
      ) : (
        <div className='adminTable'>
          <div className='adminTableHead'>
            <span>Order ID</span>
            <span>Customer</span>
            <span>Size</span>
            <span>Placed</span>
            <span>Status</span>
            <span>Update</span>
          </div>
          {orders.map((order) => {
            const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
            return (
              <div className='adminTableRow' key={order.oid}>
                <span className='adminOid'>#{order.oid}</span>
                <span className='adminCell'>{order.userEmail || 'â€”'}</span>
                <span className='adminCell'>{order.pizzaSize || 'M'}</span>
                <span className='adminCell adminDate'>
                  {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'â€”'}
                </span>
                <span>
                  <span
                    className='adminStatus'
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    {order.status}
                  </span>
                </span>
                <span>
                  <select
                    className='adminSelect'
                    value={order.status}
                    disabled={updatingOid === order.oid}
                    onChange={(e) => handleStatusChange(order.oid, e.target.value)}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
