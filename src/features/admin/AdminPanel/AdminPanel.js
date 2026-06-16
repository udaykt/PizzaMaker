import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/api/axiosClient';
import { formatPrice } from '@/utils/formatPrice';
import styles from './adminPanel.module.css';

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
      toast.success(`Order #${oid} → ${newStatus}`);
    } catch (err) {
      toast.error('Status update failed.');
    } finally {
      setUpdatingOid(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.adminPanel}>
        <h1>Admin — All Orders</h1>
        <div className={styles.adminLoading}>
          <div className={styles.adminSpinner} />
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminPanel}>
      <div className={styles.adminHeader}>
        <h1>Admin — All Orders</h1>
        <button className={styles.adminRefresh} onClick={fetchAllOrders}>↻ Refresh</button>
      </div>
      <p className={styles.adminCount}>{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
      {orders.length === 0 ? (
        <p className={styles.adminEmpty}>No orders found.</p>
      ) : (
        <div className={styles.adminTable}>
          <div className={styles.adminTableHead}>
            <span>Order ID</span>
            <span>Customer</span>
            <span>Size</span>
            <span>Method</span>
            <span>Price</span>
            <span>Placed</span>
            <span>Status</span>
            <span>Update</span>
          </div>
          {orders.map((order) => {
            const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
            return (
              <div className={styles.adminTableRow} key={order.oid}>
                <span className={styles.adminOid}>#{order.oid}</span>
                <span className={styles.adminCell}>{order.userEmail || '—'}</span>
                <span className={styles.adminCell}>{order.pizzaSize || 'M'}</span>
                <span className={styles.adminCell}>{order.deliveryMethod === 'CARRYOUT' ? 'Carryout' : 'Delivery'}</span>
                <span className={`${styles.adminCell} ${styles.adminPrice}`}>{formatPrice(order.price)}</span>
                <span className={`${styles.adminCell} ${styles.adminDate}`}>
                  {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
                </span>
                <span>
                  <span
                    className={styles.adminStatus}
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    {order.status}
                  </span>
                </span>
                <span>
                  <select
                    className={styles.adminSelect}
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
