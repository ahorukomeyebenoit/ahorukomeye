// Format currency (RWF)
export const formatCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined) return showSymbol ? '0 RWF' : '0';
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return showSymbol ? '0 RWF' : '0';
  
  const formatted = Math.round(num).toLocaleString('en-US');
  return showSymbol ? `${formatted} RWF` : formatted;
};

// Shortened currency (1.5M, 500K, etc.)
export const formatCurrencyShort = (amount) => {
  if (!amount) return '0';
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

// Format date (15 Sep 2026)
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Format month and year (September 2026)
export const formatMonth = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric'
  });
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num.toFixed(decimals)}%`;
};

// Get initials from name
export const getInitials = (firstName, lastName) => {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  return `${first}${last}`.toUpperCase();
};

// Get color for collection rate
export const getCollectionStatusColor = (rate) => {
  if (rate >= 95) return 'text-green-600 bg-green-50';
  if (rate >= 75) return 'text-blue-600 bg-blue-50';
  if (rate >= 50) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

// Get status badge color
export const getStatusColor = (status) => {
  const colors = {
    paid: 'bg-green-100 text-green-700',
    approved: 'bg-green-100 text-green-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-green-100 text-green-700',
    excellent: 'bg-green-100 text-green-700',
    
    partially_paid: 'bg-yellow-100 text-yellow-700',
    pending: 'bg-yellow-100 text-yellow-700',
    needs_attention: 'bg-yellow-100 text-yellow-700',
    
    unpaid: 'bg-red-100 text-red-700',
    rejected: 'bg-red-100 text-red-700',
    inactive: 'bg-red-100 text-red-700',
    underperforming: 'bg-red-100 text-red-700',
    
    good: 'bg-blue-100 text-blue-700'
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};