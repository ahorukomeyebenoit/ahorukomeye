import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import {
  Receipt,
  Download,
  Loader2,
  Calendar,
  CheckCircle,
  FileText
} from 'lucide-react';
import { paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const MyPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);

      if (!user?.tenant_id) {
        setPayments([]);
        return;
      }

      const res = await paymentAPI.byTenant(user.tenant_id);
      setPayments(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load payments');
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

  const totalPaid = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount),
    0
  );

  const getMethodBadge = (method) => {
    const badges = {
      mobile_money: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Mobile Money' },
      bank_transfer: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Bank Transfer' },
      cash: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Cash' }
    };
    return badges[method] || badges.cash;
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-slate-900 leading-tight">
            My Payments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your payment history and receipts
          </p>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm text-emerald-100 mb-1">Total Paid</p>
          <p className="text-3xl font-bold mb-4">{formatCurrency(totalPaid)}</p>
          <div className="flex items-center gap-4 text-sm text-emerald-100">
            <span>
              {payments.length} {payments.length === 1 ? 'payment' : 'payments'}
            </span>
            <span>•</span>
            <span>
              {new Set(payments.map((p) => p.payment_method)).size} methods
            </span>
          </div>
        </div>

        {/* Payment List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Payment History</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {payments.length} transactions
              </p>
            </div>
            <Receipt className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="divide-y divide-slate-100">
            {payments.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No payments yet</p>
              </div>
            ) : (
              payments.map((payment) => {
                const methodBadge = getMethodBadge(payment.payment_method);
                const hasProof = !!payment.proof_file;
                const isDownloading = downloadingId === payment.id;

                return (
                  <div
                    key={payment.id}
                    className="px-5 py-4 hover:bg-slate-50 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Left */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatCurrency(payment.amount)}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${methodBadge.bg} ${methodBadge.text}`}>
                              {methodBadge.label}
                            </span>
                            {hasProof && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 flex items-center gap-1">
                                <FileText className="w-2.5 h-2.5" />
                                Proof
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(payment.payment_date)}
                            </span>
                            {payment.reference && (
                              <span className="font-mono">
                                {payment.reference}
                              </span>
                            )}
                          </div>
                          {payment.description && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {payment.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right */}
                      <button
                        onClick={() => handleDownload(payment)}
                        disabled={isDownloading}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 shadow-sm shadow-emerald-600/20"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Receipt
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MyPayments;