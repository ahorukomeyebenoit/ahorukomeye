import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import {
  Home,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { dashboardAPI, ledgerAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  formatCurrency,
  formatCurrencyShort,
  formatDate
} from '../utils/formatters';
import toast from 'react-hot-toast';

const MyRent = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const dashRes = await dashboardAPI.get();
      setData(dashRes.data.data);

      if (user?.tenant_id) {
        try {
          const ledgerRes = await ledgerAPI.list({ tenant_id: user.tenant_id });
          setLedgers(ledgerRes.data.data || []);
        } catch (err) {
          console.log('Ledgers not available:', err.message);
        }
      }
    } catch (error) {
      toast.error('Failed to load rent info');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!data || data.message) {
    return (
      <Layout>
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-yellow-800">
          <p className="font-medium">{data?.message || 'No data available'}</p>
        </div>
      </Layout>
    );
  }

  const { unit, account } = data;
  const isGoodStanding = account.status === 'in_good_standing';

  const getStatusBadge = (status) => {
    const badges = {
      paid: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle, label: 'Paid' },
      partially_paid: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Partial' },
      unpaid: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle, label: 'Unpaid' }
    };
    return badges[status] || badges.unpaid;
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-slate-900 leading-tight">
            My Rent
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your rent status and upcoming dues
          </p>
        </div>

        <div className={`rounded-xl border-2 p-4 ${
          isGoodStanding ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {isGoodStanding ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            )}
            <div>
              <p className={`font-semibold ${isGoodStanding ? 'text-emerald-900' : 'text-red-900'}`}>
                {isGoodStanding ? 'You are in good standing' : 'You have an outstanding balance'}
              </p>
              <p className={`text-sm ${isGoodStanding ? 'text-emerald-700' : 'text-red-700'}`}>
                {isGoodStanding
                  ? 'All your rent payments are up to date'
                  : `Please pay ${formatCurrency(account.current_balance)} to clear your balance`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-emerald-100 rounded-md flex items-center justify-center">
                <Home className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-sm text-slate-600">My Unit</p>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">
              {unit?.number || 'N/A'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{unit?.property}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-sm text-slate-600">Monthly Rent</p>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">
              {formatCurrencyShort(unit?.monthly_rent)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Per month</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
                account.current_balance === 0 ? 'bg-emerald-100' : 'bg-red-100'
              }`}>
                {account.current_balance === 0 ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                )}
              </div>
              <p className="text-sm text-slate-600">Current Balance</p>
            </div>
            <h3 className={`text-2xl font-bold leading-tight ${
              account.current_balance === 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {formatCurrencyShort(account.current_balance)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {account.current_balance === 0 ? 'Paid up!' : 'Amount due'}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-purple-100 rounded-md flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <p className="text-sm text-slate-600">Next Due</p>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">
              {account.next_due_amount ? formatCurrencyShort(account.next_due_amount) : '0'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {account.next_due_date ? formatDate(account.next_due_date) : 'Nothing due'}
            </p>
          </div>
        </div>

        {unit && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-[15px] font-semibold text-slate-900">My Unit</h2>
              <p className="text-xs text-slate-500 mt-0.5">Rental details</p>
            </div>
            <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-slate-500 mb-1">Unit Number</p>
                <p className="text-lg font-bold text-slate-900">{unit.number}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Floor</p>
                <p className="text-lg font-bold text-slate-900">{unit.floor}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Property</p>
                <p className="text-lg font-bold text-slate-900 truncate">{unit.property}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Location</p>
                <p className="text-lg font-bold text-slate-900 truncate">{unit.location}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Monthly Dues</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {ledgers.length} {ledgers.length === 1 ? 'month' : 'months'} on record
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Period</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-5 py-3">Amount Due</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-5 py-3">Paid</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-5 py-3">Balance</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center text-slate-500 text-sm">
                      No dues on record yet
                    </td>
                  </tr>
                ) : (
                  ledgers.map((ledger) => {
                    const badge = getStatusBadge(ledger.status);
                    const BadgeIcon = badge.icon;
                    const monthName = new Date(ledger.period_start).toLocaleDateString('en-GB', {
                      month: 'long',
                      year: 'numeric'
                    });

                    return (
                      <tr key={ledger.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-slate-900">{monthName}</p>
                          <p className="text-xs text-slate-500">
                            Due: {formatDate(ledger.due_date)}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <p className="text-sm text-slate-900">
                            {formatCurrency(ledger.amount_due)}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <p className="text-sm font-medium text-emerald-600">
                            {formatCurrency(ledger.amount_paid)}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <p className={`text-sm font-medium ${
                            parseFloat(ledger.balance) > 0 ? 'text-red-600' : 'text-slate-500'
                          }`}>
                            {formatCurrency(ledger.balance)}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}>
                            <BadgeIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MyRent;