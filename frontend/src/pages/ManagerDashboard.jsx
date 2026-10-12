import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DoorOpen,
  Users,
  TrendingUp,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ArrowRight,
  Building2
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import {
  formatCurrency,
  formatCurrencyShort,
  formatPercentage,
  formatDate
} from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const { my_team, revenue_summary, recent_payments, top_debtors } = data;

  const currentMonth = new Date().toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric'
  });

  const collectionRate = revenue_summary.this_month_target > 0
    ? Math.round((revenue_summary.this_month_collected / revenue_summary.this_month_target) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl lg:text-[28px] font-bold text-slate-900 leading-tight">
          Welcome back, {user?.first_name} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here's your team overview for {currentMonth}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="My Tenants"
          value={my_team.tenants_count}
          subtitle={`${my_team.units_count} units`}
          icon={Users}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          trend="neutral"
          trendValue={`${my_team.tenants_count} total`}
        />

        <KPICard
          title="Occupancy"
          value={formatPercentage(my_team.occupancy_rate)}
          subtitle={`${my_team.occupied_units}/${my_team.units_count} units`}
          icon={DoorOpen}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          trend="neutral"
          trendValue={`${my_team.units_count} total`}
        />

        <KPICard
          title="Collected"
          value={formatCurrencyShort(revenue_summary.this_month_collected)}
          subtitle={`Target: ${formatCurrencyShort(revenue_summary.this_month_target)}`}
          icon={DollarSign}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
          trend={revenue_summary.this_month_collected > 0 ? 'up' : 'neutral'}
          trendValue={collectionRate > 0 ? `${collectionRate}%` : 'No data'}
        />

        <KPICard
          title="Net Profit"
          value={formatCurrencyShort(revenue_summary.this_month_net_profit)}
          subtitle={`${formatPercentage(revenue_summary.profit_margin)} margin`}
          icon={TrendingUp}
          iconBg={revenue_summary.this_month_net_profit > 0 ? 'bg-emerald-100' : 'bg-red-100'}
          iconColor={revenue_summary.this_month_net_profit > 0 ? 'text-emerald-600' : 'text-red-600'}
          trend={revenue_summary.this_month_net_profit > 0 ? 'up' : 'down'}
          trendValue={formatPercentage(revenue_summary.profit_margin)}
        />
      </div>

      {/* Revenue & Collection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Revenue & Collection</h2>
              <p className="text-xs text-slate-500 mt-0.5">This month's progress</p>
            </div>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-xs text-slate-500 mb-1">Target</p>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(revenue_summary.this_month_target)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Collected</p>
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(revenue_summary.this_month_collected)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Expenses</p>
              <p className="text-lg font-bold text-red-600">
                -{formatCurrency(revenue_summary.this_month_expenses)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Net Profit</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(revenue_summary.this_month_net_profit)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">Collection Rate</span>
              <span className="text-xs font-bold text-slate-900">{collectionRate}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all"
                style={{ width: `${Math.min(collectionRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Expense Breakdown</h2>
              <p className="text-xs text-slate-500 mt-0.5">By category</p>
            </div>
            <Wallet className="w-5 h-5 text-red-500" />
          </div>

          {revenue_summary.expense_breakdown && revenue_summary.expense_breakdown.length > 0 ? (
            <div className="space-y-3">
              {revenue_summary.expense_breakdown.map((exp) => (
                <div key={exp.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700 capitalize">
                      {exp.category}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrencyShort(exp.amount)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${exp.percentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {formatPercentage(exp.percentage, 0)} of total
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              No expenses this month
            </div>
          )}
        </div>
      </div>

      {/* Recent Payments + Top Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-[15px] font-semibold text-slate-900">Recent Payments</h2>
            <p className="text-xs text-slate-500 mt-0.5">From your tenants</p>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {recent_payments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No payments yet
              </div>
            ) : (
              recent_payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="px-5 py-3 hover:bg-slate-50 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {payment.tenant?.first_name} {payment.tenant?.last_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(payment.payment_date)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600 flex-shrink-0">
                      +{formatCurrencyShort(payment.amount)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Debtors */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Top Debtors</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your tenants with balance</p>
            </div>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {top_debtors.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                🎉 No outstanding debts!
              </div>
            ) : (
              top_debtors.slice(0, 5).map((debtor) => (
                <div key={debtor.id} className="px-5 py-3 hover:bg-slate-50 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {debtor.tenant?.first_name} {debtor.tenant?.last_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Due: {formatDate(debtor.due_date)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-red-600 flex-shrink-0">
                      {formatCurrencyShort(debtor.balance)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
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
          <div className={`w-7 h-7 ${iconBg} rounded-md flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
          <p className="text-sm text-slate-600 truncate">{title}</p>
        </div>

        {trend && trendValue && (
          <div className={`
            flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md flex-shrink-0
            ${trend === 'up' ? 'bg-emerald-50 text-emerald-700' : ''}
            ${trend === 'down' ? 'bg-red-50 text-red-700' : ''}
            ${trend === 'neutral' ? 'bg-slate-100 text-slate-600' : ''}
          `}>
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingUp className="w-3 h-3 rotate-180" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      <h3 className="text-2xl font-bold text-slate-900 leading-tight">{value}</h3>
      {subtitle && (
        <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
};

export default ManagerDashboard;