import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Mail,
  Phone,
  Home,
  UserPlus,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Building2
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import PhoneInput from '../components/PhoneInput';
import { tenantAPI, unitAPI, infrastructureAPI, authAPI } from '../services/api';
import { formatDate } from '../utils/formatters';
import { toInternationalFormat, parseInternationalNumber } from '../utils/countries';
import toast from 'react-hot-toast';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProperty, setFilterProperty] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [saving, setSaving] = useState(false);
  const [invitingId, setInvitingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',              // local number without country code
    phoneCountry: 'RW',      // country code (RW, KE, UG, ...)
    national_id: '',
    date_of_birth: '',
    gender: 'male',
    occupation: '',
    employer: '',
    employer_phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    current_address: '',
    move_in_date: new Date().toISOString().split('T')[0],
    unit_id: '',
    status: 'pending'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tenantsRes, unitsRes, propsRes] = await Promise.all([
        tenantAPI.list(),
        unitAPI.list(),
        infrastructureAPI.list()
      ]);
      setTenants(tenantsRes.data.data || []);
      setUnits(unitsRes.data.data || []);
      setProperties(propsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load tenants');
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
      phone: '',
      phoneCountry: 'RW',
      national_id: '',
      date_of_birth: '',
      gender: 'male',
      occupation: '',
      employer: '',
      employer_phone: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      current_address: '',
      move_in_date: new Date().toISOString().split('T')[0],
      unit_id: '',
      status: 'pending'
    });
    setEditingTenant(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (tenant) => {
    // Parse existing phone back into country + local number
    const { countryCode, localNumber } = parseInternationalNumber(tenant.phone);

    setFormData({
      first_name: tenant.first_name || '',
      last_name: tenant.last_name || '',
      email: tenant.email || '',
      phone: localNumber || '',
      phoneCountry: countryCode || 'RW',
      national_id: tenant.national_id || '',
      date_of_birth: tenant.date_of_birth || '',
      gender: tenant.gender || 'male',
      occupation: tenant.occupation || '',
      employer: tenant.employer || '',
      employer_phone: tenant.employer_phone || '',
      emergency_contact_name: tenant.emergency_contact_name || '',
      emergency_contact_phone: tenant.emergency_contact_phone || '',
      current_address: tenant.current_address || '',
      move_in_date: tenant.move_in_date || '',
      unit_id: tenant.unit_id || '',
      status: tenant.status || 'pending'
    });
    setEditingTenant(tenant);
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone || !formData.national_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate phone number
    if (formData.phone.length < 8) {
      toast.error('Please enter a complete phone number');
      return;
    }

    setSaving(true);
    try {
      // Convert to international format for backend
      const { phoneCountry, ...rest } = formData;
      const payload = {
        ...rest,
        phone: toInternationalFormat(formData.phone, phoneCountry)
      };

      if (editingTenant) {
        await tenantAPI.update(editingTenant.id, payload);
        toast.success('Tenant updated successfully');
      } else {
        await tenantAPI.create(payload);
        toast.success('Tenant created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save tenant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tenant) => {
    if (!window.confirm(`Delete tenant ${tenant.first_name} ${tenant.last_name}? This cannot be undone.`)) {
      return;
    }

    try {
      await tenantAPI.delete(tenant.id);
      toast.success('Tenant deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete tenant');
    }
  };

  const handleInvite = async (tenant) => {
    if (!window.confirm(
      `Create a login account for ${tenant.first_name} ${tenant.last_name}?\n\n` +
      `They will receive an SMS to log in with their phone number.`
    )) {
      return;
    }

    setInvitingId(tenant.id);
    try {
      await authAPI.inviteTenant({ tenant_id: tenant.id });
      toast.success('Tenant invited successfully! SMS sent.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to invite tenant');
    } finally {
      setInvitingId(null);
    }
  };

  // Filter tenants
  const filteredTenants = tenants.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterProperty !== 'all') {
      const unit = units.find((u) => u.id === t.unit_id);
      if (!unit || unit.infrastructure_id !== filterProperty) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.first_name?.toLowerCase().includes(q) ||
        t.last_name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.phone?.toLowerCase().includes(q) ||
        t.national_id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Active' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Pending' },
      inactive: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Inactive' }
    };
    return badges[status] || badges.pending;
  };

  // Get available units (vacant + current one if editing)
  const availableUnits = units.filter((u) => {
    if (editingTenant && u.id === editingTenant.unit_id) return true;
    return u.status === 'vacant';
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tenants</h1>
            <p className="text-gray-600 mt-1">
              {tenants.length} {tenants.length === 1 ? 'tenant' : 'tenants'} total
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Tenant
          </button>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone, or ID..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filterProperty}
              onChange={(e) => setFilterProperty(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
              <option value="all">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="w-3/4 h-5 bg-gray-200 rounded mb-2" />
                    <div className="w-1/2 h-4 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {searchQuery || filterStatus !== 'all' || filterProperty !== 'all'
                ? 'No tenants match your filters'
                : 'No tenants yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterStatus !== 'all' || filterProperty !== 'all'
                ? 'Try different filters'
                : 'Get started by adding your first tenant'}
            </p>
            {!searchQuery && filterStatus === 'all' && filterProperty === 'all' && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                Add Your First Tenant
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTenants.map((tenant) => {
              const unit = units.find((u) => u.id === tenant.unit_id);
              const property = unit ? properties.find((p) => p.id === unit.infrastructure_id) : null;
              const statusBadge = getStatusBadge(tenant.status);
              const StatusIcon = statusBadge.icon;

              return (
                <div
                  key={tenant.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {tenant.first_name?.[0]}{tenant.last_name?.[0]}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                              {tenant.first_name} {tenant.last_name}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">
                              {tenant.email}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.text} flex-shrink-0`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusBadge.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{tenant.phone}</span>
                      </div>

                      {unit && property && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Home className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            <span className="font-medium text-gray-900">{unit.unit_number}</span>
                            <span className="text-gray-400 mx-1">•</span>
                            <span>{property.name}</span>
                          </span>
                        </div>
                      )}

                      {tenant.move_in_date && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>Move-in: {formatDate(tenant.move_in_date)}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => openEditModal(tenant)}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>

                      <button
                        onClick={() => handleInvite(tenant)}
                        disabled={invitingId === tenant.id}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                      >
                        {invitingId === tenant.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Inviting...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            Invite
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(tenant)}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition col-span-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Tenant
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editingTenant ? 'Update tenant information' : 'Fill in the tenant details'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Personal Info */}
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Personal Information</h3>

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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <PhoneInput
                    value={formData.phone}
                    countryCode={formData.phoneCountry}
                    onChange={(v) => setFormData({ ...formData, phone: v })}
                    onCountryChange={(c) => setFormData({ ...formData, phoneCountry: c })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    National ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="national_id"
                    value={formData.national_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Employment */}
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide pt-4">Employment</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occupation
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employer
                  </label>
                  <input
                    type="text"
                    name="employer"
                    value={formData.employer}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employer Phone
                </label>
                <input
                  type="tel"
                  name="employer_phone"
                  value={formData.employer_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Unit Assignment */}
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide pt-4">Unit Assignment</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Unit
                </label>
                <select
                  name="unit_id"
                  value={formData.unit_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="">No unit (assign later)</option>
                  {availableUnits.map((u) => {
                    const prop = properties.find((p) => p.id === u.infrastructure_id);
                    return (
                      <option key={u.id} value={u.id}>
                        {u.unit_number} — {prop?.name || 'Unknown'} ({u.status})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Move-in Date
                  </label>
                  <input
                    type="date"
                    name="move_in_date"
                    value={formData.move_in_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Emergency Contact */}
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide pt-4">Emergency Contact</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Address
                </label>
                <input
                  type="text"
                  name="current_address"
                  value={formData.current_address}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
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
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingTenant ? 'Update Tenant' : 'Create Tenant'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Tenants;