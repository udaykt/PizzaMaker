import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import useOrderUpdates from '@/hooks/useOrderUpdates';
import { fetchUserOrders } from '@/api/pizzaApi';
import './orders.css';

const STATUS_COLORS = {
  PENDING:    { bg: '#fff3cd', color: '#856404' },
  CONFIRMED:  { bg: '#cce5ff', color: '#004085' },
  PREPARING:  { bg: '#d4edda', color: '#155724' },
  READY:      { bg: '#d1ecf1', color: '#0c5460' },
  DELIVERED:  { bg: '#d6d8d9', color: '#383d41' },
};

const STATUS_EMOJI = {
  PENDING:   'ðŸ•',
  CONFIRMED: 'âœ…',
  PREPARING: 'ðŸ‘¨â€ðŸ³',
  READY:     'ðŸ“¦',
  DELIVERED: 'ðŸŽ‰',
};

const formatIngredients = (ingredients) => {
  if (!ingredients) return 'â€”';
  return Object.entries(ingredients)
    .filter(([k, v]) => v === true && !k.toLowerCase().includes('medium'))
    .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
    .join(', ') || 'Plain';
};

const Orders = () => {
  const reduxOrders = useSelector((state) => state.order.userOrders);
  const currentUserUid = useSelector((state) => state.user.uid);

  // Local copy so we can update status live without re-fetching
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync from Redux on mount / when reduxOrders changes
  useEffect(() => { setOrders(reduxOrders); }, [reduxOrders]);

  useEffect(() => {
    setLoading(true);
    fetchUserOrders()
      .catch(() => toast.error('Could not load orders.'))
      .finally(() => setLoading(false));
  }, []);

  // Live WebSocket handler â€” only apply updates that belong to this user
  const handleLiveUpdate = useCallback((update) => {
    if (update.userUid !== currentUserUid) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.oid === update.oid ? { ...o, status: update.status } : o
      )
    );
    const emoji = STATUS_EMOJI[update.status] || 'ðŸ•';
    toast(`${emoji} Order #${update.oid.slice(0, 8)}â€¦ is now ${update.status}`, {
      duration: 4000,
      icon: null,
    });
  }, [currentUserUid]);

  useOrderUpdates(handleLiveUpdate);

  if (loading) {
    return (
      <div className='orders'>
        <h1>My Orders</h1>
        <div className='ordersLoading'>
          <div className='spinner' />
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='orders'>
      <div className='ordersHeader'>
        <h1>My Orders</h1>
        <span className='liveIndicator'>
          <span className='liveDot' />
          Live
        </span>
      </div>
      {orders.length === 0 ? (
        <div className='ordersEmpty'>
          <span className='ordersEmptyIcon'>ðŸ•</span>
          <p>No orders yet! Go make your first pizza.</p>
        </div>
      ) : (
        <ul className='ordersList'>
          {orders.map((order) => {
            const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
            const emoji = STATUS_EMOJI[order.status] || 'ðŸ•';
            return (
              <li key={order.oid} className='orderCard'>
                <div className='orderCardHeader'>
                  <span className='orderOid'>#{order.oid}</span>
                  <span
                    className='orderStatus'
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    {emoji} {order.status}
                  </span>
                </div>
                <div className='orderCardBody'>
                  <div className='orderDetail'>
                    <span className='orderDetailLabel'>Size</span>
                    <span className='orderDetailValue'>{order.pizzaSize || 'M'}</span>
                  </div>
                  <div className='orderDetail'>
                    <span className='orderDetailLabel'>Toppings</span>
                    <span className='orderDetailValue'>{formatIngredients(order.ingredients)}</span>
                  </div>
                  <div className='orderDetail'>
                    <span className='orderDetailLabel'>Placed</span>
                    <span className='orderDetailValue'>
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'â€”'}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Orders;
