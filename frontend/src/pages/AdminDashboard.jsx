import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  DoorOpen,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ArrowRight
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { dashboardAPI } from '../services/api';
import {
  formatCurrency,
  formatCurrencyShort,
  formatPercentage,
  formatDate
} from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
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

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-slate-200 rounded-xl" />
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { organization, revenue_summary, properties_breakdown, recent_payments, top_debtors } = data;

  const currentMonth = new Date().toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric'
  });

  const chartData = [
    { month: 'May', collected: 0, target: 450000 },
    { month: 'Jun', collected: 200000, target: 450000 },
    { month: 'Jul', collected: 380000, target: 500000 },
    { month: 'Aug', collected: 520000, target: 550000 },
    { month: 'Sep', collected: 640000, target: 600000 },
    { month: 'Oct', collected: parseFloat(revenue_summary.this_month_collected), target: parseFloat(revenue_summary.this_month_target) }
  ];

  const collectionRate = revenue_summary.this_month_target > 0
    ? Math.round((revenue_summary.this_month_collected / revenue_summary.this_month_target) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* ============================================
          WELCOME HEADER
          ============================================ */}
      <div>
        <h1 className="text-2xl lg:text-[28px] font-bold text-slate-900 leading-tight">
          Welcome back, {user?.first_name} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here's an overview of your portfolio for {currentMonth}
        </p>
      </div>

      {/* ============================================
          KPI CARDS
          ============================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrencyShort(revenue_summary.this_month_collected)}
          subtitle={`Target: ${formatCurrencyShort(revenue_summary.this_month_target)}`}
          icon={DollarSign}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          trend={revenue_summary.this_month_collected > 0 ? 'up' : 'neutral'}
          trendValue={collectionRate > 0 ? `${collectionRate}%` : 'No data'}
        />

        <KPICard
          title="Current Occupancy"
          value={formatPercentage(organization.occupancy_rate)}
          subtitle={`${organization.occupied_units}/${organization.units_count} units`}
          icon={DoorOpen}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          trend="neutral"
          trendValue={`${organization.units_count} total`}
        />

        <KPICard
          title="Active Tenants"
          value={organization.tenants_count}
          subtitle={`${organization.managers_count} managers`}
          icon={Users}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          trend="neutral"
          trendValue={`${organization.tenants_count} total`}
        />

        <KPICard
          title="Net Profit Margin"
          value={formatPercentage(revenue_summary.profit_margin)}
          subtitle={`Target: ${formatCurrencyShort(revenue_summary.this_month_target)}`}
          icon={TrendingUp}
          iconBg={revenue_summary.this_month_net_profit > 0 ? 'bg-emerald-100' : 'bg-red-100'}
          iconColor={revenue_summary.this_month_net_profit > 0 ? 'text-emerald-600' : 'text-red-600'}
          trend={revenue_summary.this_month_net_profit > 0 ? 'up' : 'down'}
          trendValue={`${formatCurrencyShort(revenue_summary.this_month_net_profit)}`}
        />
      </div>

      {/* ============================================
          CHARTS ROW
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Portfolio Analytics Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Portfolio Analytics</h2>
              <p className="text-xs text-slate-500 mt-0.5">Revenue trend (last 6 months)</p>
            </div>
            <select className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-emerald-500 text-slate-600">
              <option>Last 6 months</option>
              <option>Last 12 months</option>
              <option>This year</option>
            </select>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                  formatter={(value) => [formatCurrency(value), 'Collected']}
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke="#059669"
                  strokeWidth={2}
                  fill="url(#colorCollected)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue & Collection */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold text-slate-900">Revenue & Collection Progress</h2>
            <p className="text-xs text-slate-500 mt-0.5">This month's progress</p>
          </div>

          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm text-slate-600">Progress</span>
            <span className="text-sm font-bold text-slate-900">{collectionRate}%</span>
          </div>
          <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-700 rounded-full transition-all"
              style={{ width: `${Math.min(collectionRate, 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-left">
              <p className="text-sm text-slate-600 mb-1">Target</p>
              <p className="text-sm lg:text-base font-semibold text-slate-900">
                {formatCurrency(revenue_summary.this_month_target)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-1">Collected</p>
              <p className="text-sm lg:text-base font-semibold text-emerald-600">
                {formatCurrency(revenue_summary.this_month_collected)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 mb-1">Balance</p>
              <p className="text-sm lg:text-base font-semibold text-red-600">
                {formatCurrency(revenue_summary.this_month_outstanding)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          PROPERTY PERFORMANCE TABLE
          ============================================ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Property Performance Overview</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {properties_breakdown.length} {properties_breakdown.length === 1 ? 'property' : 'properties'}
            </p>
          </div>
          <button
            onClick={() => navigate('/properties')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">
                  Property
                </th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">
                  Occupancy
                </th>
                <th className="text-right text-xs font-medium text-slate-500 px-5 py-3">
                  Target
                </th>
                <th className="text-right text-xs font-medium text-slate-500 px-5 py-3">
                  Collected
                </th>
                <th className="text-right text-xs font-medium text-slate-500 px-5 py-3">
                  Profit
                </th>
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {properties_breakdown.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center">
                    <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No properties yet</p>
                    <button
                      onClick={() => navigate('/properties')}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add your first property
                    </button>
                  </td>
                </tr>
              ) : (
                properties_breakdown.map((property) => {
                  const rate = property.collection_rate;
                  let statusConfig;
                  if (rate >= 95) {
                    statusConfig = { label: 'On Track', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' };
                  } else if (rate >= 50) {
                    statusConfig = { label: 'Partial', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' };
                  } else if (rate > 0) {
                    statusConfig = { label: 'Pending', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' };
                  } else {
                    statusConfig = { label: 'Action Required', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
                  }

                  return (
                    <tr key={property.property_id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {property.property_name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {property.location}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatPercentage(property.occupancy_rate, 0)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {property.units_occupied}/{property.units_total} units
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <p className="text-sm font-medium text-slate-900">
                          {formatCurrencyShort(property.monthly_target)}
                        </p>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <p className="text-sm font-medium text-emerald-600">
                          {formatCurrencyShort(property.collected_this_month)}
                        </p>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <p className={`text-sm font-medium ${
                          property.net_profit_this_month >= 0 ? 'text-slate-900' : 'text-red-600'
                        }`}>
                          {formatCurrencyShort(property.net_profit_this_month)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatPercentage(property.profit_margin, 0)}
                        </p>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          {statusConfig.label}
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

      {/* ============================================
          RECENT PAYMENTS + TOP DEBTORS
          ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-[15px] font-semibold text-slate-900">Recent Payments</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest transactions</p>
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
              <p className="text-xs text-slate-500 mt-0.5">Tenants with balance</p>
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
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
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

export default AdminDashboard;