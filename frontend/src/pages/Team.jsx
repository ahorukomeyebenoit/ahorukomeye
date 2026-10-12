import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  X,
  Loader2,
  Mail,
  Phone,
  Crown,
  UserCog,
  User,
  CheckCircle,
  Clock,
  Trash2,
  Shield,
  Calendar,
  Home
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, getInitials } from '../utils/formatters';
import toast from 'react-hot-toast';

const Team = () => {
  const { user: currentUser } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await authAPI.team();
      setTeam(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load team');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: ''
    });
  };

  const openInviteModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleInviteManager = async (e) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone) {
      toast.error('All fields are required');
      return;
    }

    setSaving(true);
    try {
      const response = await authAPI.inviteManager(formData);
      const inviteToken = response.data.data.invitation_token;

      toast.success('Manager invited! Share this token if email fails:', {
        duration: 6000
      });
      console.log('📋 Invitation token for', formData.email, ':', inviteToken);

      setShowModal(false);
      resetForm();
      fetchTeam();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to invite manager');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member) => {
    if (member.id === currentUser?.id) {
      toast.error('You cannot delete yourself');
      return;
    }

    if (!window.confirm(
      `Delete ${member.first_name} ${member.last_name}?\n\nThis will remove their access permanently.`
    )) {
      return;
    }

    toast.error('Delete feature coming soon');
  };

  // Filter team
  const filteredTeam = team.filter((m) => {
    if (filterRole !== 'all' && m.role !== filterRole) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.first_name?.toLowerCase().includes(q) ||
        m.last_name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Count stats
  const stats = {
    total: team.length,
    admins: team.filter((m) => m.role === 'admin').length,
    managers: team.filter((m) => m.role === 'manager').length,
    tenants: team.filter((m) => m.role === 'tenant').length,
    pending: team.filter((m) => m.status === 'pending').length
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Crown, label: 'Admin' },
      manager: { bg: 'bg-blue-100', text: 'text-blue-700', icon: UserCog, label: 'Manager' },
      tenant: { bg: 'bg-green-100', text: 'text-green-700', icon: User, label: 'Tenant' }
    };
    return badges[role] || badges.tenant;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Active' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Pending' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-700', icon: X, label: 'Inactive' },
      suspended: { bg: 'bg-red-100', text: 'text-red-700', icon: X, label: 'Suspended' }
    };
    return badges[status] || badges.pending;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Team</h1>
            <p className="text-gray-600 mt-1">
              {stats.total} {stats.total === 1 ? 'member' : 'members'} in your organization
            </p>
          </div>
          <button
            onClick={openInviteModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Invite Manager
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-gray-500">Admins</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.admins}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <UserCog className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-gray-500">Managers</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.managers}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-green-600" />
              <p className="text-xs text-gray-500">Tenants</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.tenants}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-600" />
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {['all', 'admin', 'manager', 'tenant'].map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition capitalize ${
                  filterRole === role
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {role === 'all' ? 'All Roles' : role + 's'}
              </button>
            ))}
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="w-1/3 h-5 bg-gray-200 rounded mb-2" />
                    <div className="w-1/2 h-4 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTeam.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {searchQuery || filterRole !== 'all' ? 'No members match' : 'No team members'}
            </h3>
            <p className="text-gray-500 mb-6">
              Invite managers to help manage your properties
            </p>
            {!searchQuery && filterRole === 'all' && (
              <button
                onClick={openInviteModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                Invite Your First Manager
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTeam.map((member) => {
              const roleBadge = getRoleBadge(member.role);
              const statusBadge = getStatusBadge(member.status);
              const RoleIcon = roleBadge.icon;
              const StatusIcon = statusBadge.icon;
              const isSelf = member.id === currentUser?.id;

              return (
                <div
                  key={member.id}
                  className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition p-6 ${
                    isSelf ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                      member.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                      member.role === 'manager' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                      'bg-gradient-to-br from-green-500 to-green-600'
                    }`}>
                      <span className="text-white font-bold text-lg">
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 truncate">
                            {member.first_name} {member.last_name}
                            {isSelf && <span className="text-blue-600 text-sm ml-2">(You)</span>}
                          </h3>
                          {member.email && (
                            <p className="text-sm text-gray-500 truncate">{member.email}</p>
                          )}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${roleBadge.bg} ${roleBadge.text}`}>
                          <RoleIcon className="w-3 h-3" />
                          {roleBadge.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* Contact info */}
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{member.phone}</span>
                        </div>

                        {member.last_login && (
                          <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>Last login: {formatDate(member.last_login)}</span>
                          </div>
                        )}

                        {member.created_at && !member.last_login && (
                          <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>Invited: {formatDate(member.created_at)}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {!isSelf && member.role !== 'admin' && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={() => handleDelete(member)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INVITE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Invite Manager</h2>
                <p className="text-sm text-gray-500 mt-1">
                  They'll receive an email with login instructions
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteManager} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Alice"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Manager"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="manager@email.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+250788123456"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <strong>How it works:</strong> The manager receives an email with a link to set their password. 
                Once set, they can log in and manage properties and tenants.
              </div>
            </form>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteManager}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Team;