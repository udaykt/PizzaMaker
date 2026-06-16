// Backend sends price as a JSON number (serialized BigDecimal); format
// consistently wherever an order total is shown.
export const formatPrice = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : '—';
};
