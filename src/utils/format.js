export const formatCurrency = (value) => {
  const amount = Number(value);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2
  }).format(Number.isFinite(amount) ? amount : 0);
};
