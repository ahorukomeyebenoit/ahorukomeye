import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'blue',
  trend,
  trendValue,
  loading = false
}) => {
  // Color mapping for different themes
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: 'bg-blue-100'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      icon: 'bg-green-100'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: 'bg-red-100'
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      icon: 'bg-yellow-100'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      icon: 'bg-purple-100'
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      icon: 'bg-indigo-100'
    }
  };

  const colors = colorClasses[iconColor] || colorClasses.blue;

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg" />
          <div className="w-16 h-4 bg-gray-200 rounded" />
        </div>
        <div className="w-24 h-8 bg-gray-200 rounded mb-2" />
        <div className="w-32 h-4 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 border-2 border-emerald-500/30 shadow-sm hover:shadow-lg hover:border-emerald-500/60 transition-all duration-200">
      {/* Top row: icon + trend */}
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className={`w-12 h-12 ${colors.icon} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
        )}

        {trend && (
          <div
            className={`
              flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full
              ${trend === 'up' ? 'bg-green-50 text-green-700' : ''}
              ${trend === 'down' ? 'bg-red-50 text-red-700' : ''}
              ${trend === 'neutral' ? 'bg-gray-50 text-gray-700' : ''}
            `}
          >
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-1">
        <h3 className="text-2xl font-bold text-gray-900">
          {value}
        </h3>
      </div>

      {/* Title and subtitle */}
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
};

export default StatCard;