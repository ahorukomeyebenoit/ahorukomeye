import { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Download,
  Calendar,
  User,
  FileText,
  Loader2,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { paymentAPI, tenantAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const Receipts = () => {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTenant, setFilterTenant] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, tenantsRes] = await Promise.all([
        paymentAPI.list(),
        tenantAPI.list()
      ]);
      setPayments(paymentsRes.data.data || []);
      setTenants(tenantsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load receipts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (payment) => {
    setDownloadingId(payment.id);
    try {
      toast.loading('Generating receipt...', { id: 'receipt' });
      const response = await paymentAPI.downloadReceipt(payment.id);

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Receipt-${payment.id.slice(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Receipt downloaded', { id: 'receipt' });
    } catch (error) {
      toast.error('Failed to download receipt', { id: 'receipt' });
      console.error(error);
    } finally {
      setDownloadingId(null);
    }
  };

  // Get unique months from payments
  const getAvailableMonths = () => {
    const months = new Set();
    payments.forEach((p) => {
      if (p.payment_date) {
        const date = new Date(p.payment_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(key);
      }
    });
    return Array.from(months).sort().reverse();
  };

  const formatMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (filterTenant !== 'all' && p.tenant_id !== filterTenant) return false;

    if (filterMonth !== 'all' && p.payment_date) {
      const date = new Date(p.payment_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (key !== filterMonth) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const tenantName = `${p.tenant?.first_name} ${p.tenant?.last_name}`.toLowerCase();
      const receiptNo = p.id.slice(0, 8).toLowerCase();
      return (
        tenantName.includes(q) ||
        p.reference?.toLowerCase().includes(q) ||
        receiptNo.includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const totalFiltered = filteredPayments.reduce(
    (sum, p) => sum + parseFloat(p.amount),
    0
  );

  const totalAllTime = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount),
    0
  );

  const availableMonths = getAvailableMonths();

  const getMethodBadge = (method) => {
    const badges = {
      mobile_money: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Mobile Money' },
      bank_transfer: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Bank Transfer' },
      cash: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Cash' }
    };
    return badges[method] || badges.cash;
  };

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-slate-900 leading-tight">
            Receipts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {payments.length} {payments.length === 1 ? 'receipt' : 'receipts'} • All downloadable as PDF
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-emerald-100 rounded-md flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-sm text-slate-600">Total Collected</p>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">
              {formatCurrency(totalAllTime)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              All time
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-sm text-slate-600">Tenants Paid</p>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">
              {new Set(payments.map((p) => p.tenant_id)).size}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Unique payers
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-purple-100 rounded-md flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <p className="text-sm text-slate-600">Months Covered</p>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">
              {availableMonths.length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Periods
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="relative">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center"
              style={{ paddingLeft: '14px' }}
            >
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tenant, receipt number, or reference..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              style={{ paddingLeft: '42px' }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={filterTenant}
              onChange={(e) => setFilterTenant(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
            >
              <option value="all">All Tenants</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.first_name} {t.last_name}
                </option>
              ))}
            </select>

            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
            >
              <option value="all">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              {searchQuery || filterTenant !== 'all' || filterMonth !== 'all'
                ? 'No receipts match'
                : 'No receipts yet'}
            </h3>
            <p className="text-sm text-slate-500">
              {searchQuery || filterTenant !== 'all' || filterMonth !== 'all'
                ? 'Try different filters'
                : 'Record payments to generate receipts'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => {
              const methodBadge = getMethodBadge(payment.payment_method);
              const receiptNo = payment.id.slice(0, 8).toUpperCase();
              const isDownloading = downloadingId === payment.id;

              return (
                <div
                  key={payment.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Left: Icon + Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Receipt className="w-5 h-5 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-bold text-slate-900">
                            Receipt #{receiptNo}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${methodBadge.bg} ${methodBadge.text}`}>
                            {methodBadge.label}
                          </span>
                        </div>

                        <p className="text-sm font-medium text-slate-700 mb-1 truncate">
                          {payment.tenant?.first_name} {payment.tenant?.last_name}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(payment.payment_date)}
                          </span>
                          {payment.reference && (
                            <span className="flex items-center gap-1 font-mono">
                              <FileText className="w-3 h-3" />
                              {payment.reference}
                            </span>
                          )}
                        </div>

                        {payment.description && (
                          <p className="text-xs text-slate-500 mt-1 truncate">
                            {payment.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount + Download */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 lg:flex-shrink-0">
                      <div className="text-right">
                        <p className="text-base font-bold text-slate-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-[11px] text-slate-500">Paid</p>
                      </div>

                      <button
                        onClick={() => handleDownload(payment)}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 shadow-sm shadow-emerald-600/20"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">Downloading...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Download</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Receipts;