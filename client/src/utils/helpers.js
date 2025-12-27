export function formatCurrency(amount){
  return Number(amount).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}
