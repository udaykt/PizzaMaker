// Domino's-style playful customer-facing copy for order status — the literal
// enum (PENDING/CONFIRMED/PREPARING/READY/DELIVERED) stays the operational
// truth on the backend and in AdminPanel; this is just friendlier text for
// the customer-facing screens, ending on "Mmm!" the way Domino's tracker does.
export const STATUS_LABEL = {
  PENDING: 'Placed!',
  CONFIRMED: 'Confirmed — Firing Up the Oven',
  PREPARING: 'In the Kitchen',
  READY: 'Boxed & Ready',
  DELIVERED: 'Mmm! Enjoy!',
};

export const STATUS_EMOJI = {
  PENDING: '🍕',
  CONFIRMED: '✅',
  PREPARING: '👨‍🍳',
  READY: '📦',
  DELIVERED: '🎉',
};

export const statusLabel = (status) => STATUS_LABEL[status] || status;
