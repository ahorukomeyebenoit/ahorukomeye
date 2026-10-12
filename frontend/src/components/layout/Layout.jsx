import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  DollarSign,
  Receipt,
  Wallet,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Layout = ({ children }) => {
  const { user, logout, isAdmin, isManager, isTenant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const fullName =
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User';

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getMenuItems = () => {
    const items = [
      {
        path: '/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
      },
    ];

    if (isAdmin || isManager) {
      items.push(
        { path: '/properties', icon: Building2, label: 'Properties' },
        { path: '/units', icon: DoorOpen, label: 'Units' },
        { path: '/tenants', icon: Users, label: 'Tenants' },
        { path: '/payments', icon: DollarSign, label: 'Payments' },
        { path: '/expenses', icon: Wallet, label: 'Expenses' },
        { path: '/receipts', icon: Receipt, label: 'Receipts' }
      );
    }

    if (isTenant) {
      items.push(
        { path: '/my-rent', icon: DollarSign, label: 'My Rent' },
        { path: '/my-payments', icon: Receipt, label: 'My Payments' }
      );
    }

    if (isAdmin) {
      items.push({
        path: '/team',
        icon: UserCog,
        label: 'Team',
      });
    }

    items.push({
      path: '/settings',
      icon: Settings,
      label: 'Settings',
    });

    return items;
  };

  const menuItems = getMenuItems();

  const isActive = (path) =>
    location.pathname === path ||
    (path !== '/dashboard' && location.pathname.startsWith(`${path}/`));

  return (
    <div className="flex min-h-screen w-full bg-[#f5f6f8] text-slate-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex h-screen w-[242px] shrink-0 flex-col
          bg-[#273541] text-white
          transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:sticky lg:top-0 lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex h-[78px] shrink-0 items-center justify-between border-b border-white/10 px-4">
          <Link
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex min-w-0 items-center gap-2.5"
          >
            <img
              src="/logo-dark.png"
              alt="Ahorukomeye"
              className="h-9 w-9 shrink-0 object-contain"
            />

            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold">
                Ahorukomeye
              </p>
              <p className="text-[11px] text-slate-300">
                Property Management
              </p>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-slate-300 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex min-h-[37px] items-center gap-3 rounded-lg
                  px-3 py-2 text-[14px] transition-colors
                  ${
                    active
                      ? 'bg-emerald-600 font-medium text-white'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon
                  className="h-[19px] w-[19px] shrink-0"
                  strokeWidth={1.8}
                />

                <span className="flex-1 truncate">{item.label}</span>

                {active && (
                  <span className="rounded-md bg-emerald-800/60 px-1.5 py-0.5 text-[10px]">
                    Active
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[14px] text-slate-200 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.8} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-5 lg:px-6">
          {/* Mobile menu */}
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="relative hidden min-w-0 max-w-4xl flex-1 md:flex">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center"
              style={{ paddingLeft: '16px' }}
            >
              <Search className="h-[18px] w-[18px] text-slate-500" />
            </div>

            <input
              type="search"
              placeholder="Search properties, tenants, payments..."
              className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              style={{ paddingLeft: '44px' }}
            />
          </div>

          {/* User and notifications */}
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
            <button
              type="button"
              aria-label="Notifications"
              className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-expanded={userMenuOpen}
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                  {initials}
                </div>

                <div className="hidden text-left sm:block">
                  <p className="max-w-[150px] truncate text-[14px] font-semibold">
                    {fullName}
                  </p>
                  <p className="text-xs capitalize text-slate-500">
                    {user?.role || 'User'}
                  </p>
                </div>

                <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
              </button>

              {userMenuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close profile menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setUserMenuOpen(false)}
                  />

                  <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {fullName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {user?.email || ''}
                      </p>
                    </div>

                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="w-full min-w-0 flex-1 p-3 sm:p-4 lg:p-[18px]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;