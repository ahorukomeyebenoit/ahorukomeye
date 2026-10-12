import { useState, useEffect } from 'react';
import {
  Home,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Receipt,
  Building2,
  ArrowUpRight,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import {
  formatCurrency,
  formatCurrencyShort,
  formatDate,
  formatPercentage
} from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TenantDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.get();
      setData(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (data.message) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-yellow-800">
        <p className="font-medium">{data.message}</p>
      </div>
    );
  }

  const { unit, account, recent_payments } = data;
  const isGoodStanding = account.status === 'in_good_standing';
  const currentMonth = new Date().toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-4">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl lg:text-[28px] font-bold text-slate-900 leading-tight">
          Welcome back, {user?.first_name} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here's your rent overview for {currentMonth}
        </p>
      </div>

      {/* Status Banner */}
      <div
        className={`rounded-xl border-2 p-4 ${
          isGoodStanding
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex items-center gap-3">
          {isGoodStanding ? (
            <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p
              className={`font-semibold ${
                isGoodStanding ? 'text-emerald-900' : 'text-red-900'
              }`}
            >
              {isGoodStanding
                ? 'You are in good standing'
                : 'You have an outstanding balance'}
            </p>
            <p
              className={`text-sm ${
                isGoodStanding ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {isGoodStanding
                ? 'All your rent payments are up to date'
                : `Please pay ${formatCurrency(account.current_balance)} to clear your balance`}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="My Unit"
          value={unit?.number || 'N/A'}
          subtitle={unit?.property || 'No unit assigned'}
          icon={Home}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          trend="neutral"
          trendValue={`Floor ${unit?.floor || '-'}`}
        />

        <KPICard
          title="Monthly Rent"
          value={formatCurrencyShort(unit?.monthly_rent)}
          subtitle="Per month"
          icon={DollarSign}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          trend="neutral"
          trendValue="Recurring"
        />

        <KPICard
          title="Current Balance"
          value={formatCurrencyShort(account.current_balance)}
          subtitle={account.current_balance === 0 ? 'Paid up!' : 'Amount due'}
          icon={account.current_balance === 0 ? CheckCircle : AlertCircle}
          iconBg={account.current_balance === 0 ? 'bg-emerald-100' : 'bg-red-100'}
          iconColor={account.current_balance === 0 ? 'text-emerald-600' : 'text-red-600'}
          trend={account.current_balance === 0 ? 'up' : 'down'}
          trendValue={account.current_balance === 0 ? 'Clear' : 'Due'}
        />

        <KPICard
          title="Next Due"
          value={
            account.next_due_amount
              ? formatCurrencyShort(account.next_due_amount)
              : '0'
          }
          subtitle={
            account.next_due_date
              ? formatDate(account.next_due_date)
              : 'Nothing due'
          }
          icon={Calendar}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          trend="neutral"
          trendValue={account.next_due_date ? 'Upcoming' : 'Clear'}
        />
      </div>

      {/* Unit Details */}
      {unit && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">My Unit</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your rental details</p>
            </div>
            <Building2 className="w-5 h-5 text-emerald-600" />
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
              <p className="text-lg font-bold text-slate-900 truncate">
                {unit.property}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Location</p>
              <p className="text-lg font-bold text-slate-900 truncate">
                {unit.location}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">
              My Payment History
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Total paid: {formatCurrency(account.total_paid_all_time)}
            </p>
          </div>
          <Receipt className="w-5 h-5 text-emerald-600" />
        </div>

        <div className="divide-y divide-slate-100">
          {recent_payments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No payments yet
            </div>
          ) : (
            recent_payments.map((payment) => (
              <div
                key={payment.id}
                className="px-5 py-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {formatDate(payment.payment_date)} •{' '}
                        {payment.payment_method?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Ref
                    </p>
                    <p className="text-xs font-mono text-slate-700">
                      {payment.reference || payment.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// KPI CARD COMPONENT
// ============================================
const KPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  trendValue
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3.5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 ${iconBg} rounded-md flex items-center justify-center flex-shrink-0`}
          >
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
          <p className="text-sm text-slate-600 truncate">{title}</p>
        </div>

        {trend && trendValue && (
          <div
            className={`
            flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md flex-shrink-0
            ${trend === 'up' ? 'bg-emerald-50 text-emerald-700' : ''}
            ${trend === 'down' ? 'bg-red-50 text-red-700' : ''}
            ${trend === 'neutral' ? 'bg-slate-100 text-slate-600' : ''}
          `}
          >
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <AlertCircle className="w-3 h-3" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      <h3 className="text-2xl font-bold text-slate-900 leading-tight">
        {value}
      </h3>
      {subtitle && (
        <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
};

export default TenantDashboard;