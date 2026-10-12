import { useState, useEffect } from 'react';
import {
  DoorOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  X,
  Loader2,
  Bed,
  Bath,
  Maximize,
  Building2
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { unitAPI, infrastructureAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const Units = () => {
  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProperty, setFilterProperty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    infrastructure_id: '',
    unit_number: '',
    floor: 1,
    type: 'apartment',
    status: 'vacant',
    size_sqm: 50,
    bedrooms: 1,
    bathrooms: 1,
    monthly_rent: 100000,
    security_deposit: 0,
    is_furnished: false,
    has_water_meter: false,
    has_electricity_meter: false,
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [unitsRes, propsRes] = await Promise.all([
        unitAPI.list(),
        infrastructureAPI.list()
      ]);
      setUnits(unitsRes.data.data || []);
      setProperties(propsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load units');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      infrastructure_id: properties[0]?.id || '',
      unit_number: '',
      floor: 1,
      type: 'apartment',
      status: 'vacant',
      size_sqm: 50,
      bedrooms: 1,
      bathrooms: 1,
      monthly_rent: 100000,
      security_deposit: 0,
      is_furnished: false,
      has_water_meter: false,
      has_electricity_meter: false,
      description: ''
    });
    setEditingUnit(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (unit) => {
    setFormData({
      infrastructure_id: unit.infrastructure_id || '',
      unit_number: unit.unit_number || '',
      floor: unit.floor || 1,
      type: unit.type || 'apartment',
      status: unit.status || 'vacant',
      size_sqm: parseFloat(unit.size_sqm) || 50,
      bedrooms: unit.bedrooms || 1,
      bathrooms: unit.bathrooms || 1,
      monthly_rent: parseFloat(unit.monthly_rent) || 100000,
      security_deposit: parseFloat(unit.security_deposit) || 0,
      is_furnished: unit.is_furnished || false,
      has_water_meter: unit.has_water_meter || false,
      has_electricity_meter: unit.has_electricity_meter || false,
      description: unit.description || ''
    });
    setEditingUnit(unit);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.infrastructure_id || !formData.unit_number) {
      toast.error('Property and unit number are required');
      return;
    }

    setSaving(true);
    try {
      if (editingUnit) {
        await unitAPI.update(editingUnit.id, formData);
        toast.success('Unit updated successfully');
      } else {
        await unitAPI.create(formData);
        toast.success('Unit created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save unit');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (unit) => {
    if (!window.confirm(`Delete unit ${unit.unit_number}? This cannot be undone.`)) {
      return;
    }

    try {
      await unitAPI.delete(unit.id);
      toast.success('Unit deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete unit');
    }
  };

  // Filter units
  const filteredUnits = units.filter((u) => {
    if (filterProperty !== 'all' && u.infrastructure_id !== filterProperty) return false;
    if (filterStatus !== 'all' && u.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        u.unit_number?.toLowerCase().includes(q) ||
        u.type?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusColor = (status) => {
    const colors = {
      vacant: 'bg-green-100 text-green-700',
      occupied: 'bg-blue-100 text-blue-700',
      maintenance: 'bg-yellow-100 text-yellow-700',
      reserved: 'bg-purple-100 text-purple-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Units</h1>
            <p className="text-gray-600 mt-1">
              {units.length} {units.length === 1 ? 'unit' : 'units'} total
            </p>
          </div>
          <button
            onClick={openCreateModal}
            disabled={properties.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Add Unit
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
              placeholder="Search units by number or type..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={filterProperty}
              onChange={(e) => setFilterProperty(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4" />
                <div className="w-3/4 h-5 bg-gray-200 rounded mb-2" />
                <div className="w-1/2 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <DoorOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {searchQuery || filterProperty !== 'all' || filterStatus !== 'all'
                ? 'No units match your filters'
                : 'No units yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {properties.length === 0
                ? 'Add a property first before creating units'
                : 'Get started by adding your first unit'}
            </p>
            {properties.length > 0 && !searchQuery && filterProperty === 'all' && filterStatus === 'all' && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                Add Your First Unit
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUnits.map((unit) => (
              <div
                key={unit.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <div className="p-6">
                  {/* Icon + Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DoorOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(unit.status)}`}>
                      {unit.status}
                    </span>
                  </div>

                  {/* Unit number + type */}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {unit.unit_number}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                    <Building2 className="w-4 h-4" />
                    <span>{unit.infrastructure?.name || 'Unknown property'}</span>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Maximize className="w-3.5 h-3.5" />
                      <span>{parseFloat(unit.size_sqm).toFixed(0)} m²</span>
                    </div>
                    {unit.bedrooms > 0 && (
                      <div className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5" />
                        <span>{unit.bedrooms} bed</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5" />
                      <span>{unit.bathrooms} bath</span>
                    </div>
                  </div>

                  {/* Rent */}
                  <div className="pt-3 border-t border-gray-100 mb-3">
                    <p className="text-xs text-gray-500 mb-1">Monthly Rent</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(unit.monthly_rent)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openEditModal(unit)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(unit)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUnit ? 'Edit Unit' : 'Add New Unit'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editingUnit ? 'Update unit details' : 'Fill in the unit details'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Property */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property <span className="text-red-500">*</span>
                </label>
                <select
                  name="infrastructure_id"
                  value={formData.infrastructure_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select a property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Unit number + Floor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="unit_number"
                    value={formData.unit_number}
                    onChange={handleChange}
                    placeholder="e.g., A101"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Floor
                  </label>
                  <input
                    type="number"
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Type + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="apartment">Apartment</option>
                    <option value="office">Office</option>
                    <option value="shop">Shop</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="studio">Studio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="vacant">Vacant</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>
              </div>

              {/* Size + Bedrooms + Bathrooms */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size (m²)
                  </label>
                  <input
                    type="number"
                    name="size_sqm"
                    value={formData.size_sqm}
                    onChange={handleChange}
                    min="1"
                    step="0.5"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Rent + Deposit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Rent (RWF) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="monthly_rent"
                    value={formData.monthly_rent}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Deposit (RWF)
                  </label>
                  <input
                    type="number"
                    name="security_deposit"
                    value={formData.security_deposit}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Features
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'is_furnished', label: 'Furnished' },
                    { name: 'has_water_meter', label: 'Water Meter' },
                    { name: 'has_electricity_meter', label: 'Electricity Meter' }
                  ].map((feature) => (
                    <label key={feature.name} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name={feature.name}
                        checked={formData[feature.name]}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </form>

            {/* Footer */}
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
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingUnit ? 'Update Unit' : 'Create Unit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Units;