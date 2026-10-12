import { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Calendar,
  User,
  Upload,
  FileText,
  Paperclip,
  Wrench,
  PaintBucket,
  Zap,
  Sparkles,
  Shield,
  FileText as FileTextIcon,
  Users as UsersIcon,
  Plane,
  Phone,
  Package,
  MoreHorizontal
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { expenseAPI, infrastructureAPI } from '../services/api';
import { formatCurrency, formatCurrencyShort, formatDate, formatPercentage } from '../utils/formatters';
import toast from 'react-hot-toast';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Proof file
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    infrastructure_id: '',
    category: 'repair',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    paid_by: 'owner',
    notes: ''
  });

  const categories = [
    { value: 'repair', label: 'Repair', icon: Wrench, color: 'blue' },
    { value: 'maintenance', label: 'Maintenance', icon: PaintBucket, color: 'green' },
    { value: 'utilities', label: 'Utilities', icon: Zap, color: 'yellow' },
    { value: 'cleaning', label: 'Cleaning', icon: Sparkles, color: 'cyan' },
    { value: 'security', label: 'Security', icon: Shield, color: 'red' },
    { value: 'taxes', label: 'Taxes', icon: FileTextIcon, color: 'purple' },
    { value: 'salaries', label: 'Salaries', icon: UsersIcon, color: 'indigo' },
    { value: 'insurance', label: 'Insurance', icon: Shield, color: 'pink' },
    { value: 'transport', label: 'Transport', icon: Plane, color: 'orange' },
    { value: 'communication', label: 'Communication', icon: Phone, color: 'teal' },
    { value: 'supplies', label: 'Supplies', icon: Package, color: 'lime' },
    { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'gray' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesRes, propsRes, summaryRes] = await Promise.all([
        expenseAPI.list(),
        infrastructureAPI.list(),
        expenseAPI.summary()
      ]);
      setExpenses(expensesRes.data.data || []);
      setProperties(propsRes.data.data || []);
      setSummary(summaryRes.data.data);
    } catch (error) {
      toast.error('Failed to load expenses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      infrastructure_id: properties[0]?.id || '',
      category: 'repair',
      description: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      paid_by: 'owner',
      notes: ''
    });
    setProofFile(null);
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofPreview(null);
    setEditingExpense(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (expense) => {
    setFormData({
      infrastructure_id: expense.infrastructure_id || '',
      category: expense.category || 'repair',
      description: expense.description || '',
      amount: parseFloat(expense.amount) || '',
      expense_date: expense.expense_date || '',
      paid_by: expense.paid_by || 'owner',
      notes: expense.notes || ''
    });
    setEditingExpense(expense);
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, PNG, JPG, JPEG files are allowed');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setProofFile(file);
    if (file.type.startsWith('image/')) {
      setProofPreview(URL.createObjectURL(file));
    } else {
      setProofPreview(null);
    }
  };

  const removeProof = () => {
    setProofFile(null);
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.infrastructure_id || !formData.category || !formData.description || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      if (editingExpense) {
        await expenseAPI.update(editingExpense.id, formData);
        toast.success('Expense updated successfully');
      } else {
        await expenseAPI.create(formData);
        toast.success('Expense recorded successfully');
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (expense) => {
    setProcessingId(expense.id);
    try {
      await expenseAPI.approve(expense.id);
      toast.success('Expense approved');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (expense) => {
    const reason = window.prompt('Rejection reason (optional):');
    if (reason === null) return;

    setProcessingId(expense.id);
    try {
      await expenseAPI.reject(expense.id, reason || 'No reason provided');
      toast.success('Expense rejected');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete this expense? This cannot be undone.`)) return;

    try {
      await expenseAPI.delete(expense.id);
      toast.success('Expense deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  // Filter
  const filteredExpenses = expenses.filter((e) => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.description?.toLowerCase().includes(q) ||
        e.infrastructure?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalFiltered = filteredExpenses.reduce(
    (sum, e) => sum + parseFloat(e.amount), 0
  );

  const getCategoryInfo = (value) => {
    return categories.find((c) => c.value === value) || categories[11];
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Approved' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Pending' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Rejected' }
    };
    return badges[status] || badges.pending;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Expenses</h1>
            <p className="text-gray-600 mt-1">
              {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'} • {formatCurrency(totalFiltered)} total
            </p>
          </div>
          <button
            onClick={openCreateModal}
            disabled={properties.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Add Expense
          </button>
        </div>

        {/* SUMMARY CARD */}
        {summary && summary.by_category.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">Category Summary</h3>
                <p className="text-sm text-gray-500">Approved expenses breakdown</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.total_approved)}
                </p>
                <p className="text-xs text-gray-500">
                  {summary.total_count} approved
                  {summary.pending_count > 0 && ` • ${summary.pending_count} pending`}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {summary.by_category.slice(0, 5).map((cat) => {
                const info = getCategoryInfo(cat.category);
                const Icon = info.icon;
                return (
                  <div key={cat.category} className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 capitalize flex-shrink-0 w-32">
                      {cat.category}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-24 text-right">
                      {formatCurrencyShort(cat.amount)}
                    </span>
                    <span className="text-xs text-gray-500 w-12 text-right">
                      {formatPercentage(cat.percentage, 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by description or property..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="w-1/2 h-5 bg-gray-200 rounded mb-2" />
                <div className="w-1/3 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
                ? 'No expenses match your filters'
                : 'No expenses yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {properties.length === 0
                ? 'Add a property first before recording expenses'
                : 'Record your first expense to get started'}
            </p>
            {properties.length > 0 && !searchQuery && filterCategory === 'all' && filterStatus === 'all' && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                Record First Expense
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => {
              const categoryInfo = getCategoryInfo(expense.category);
              const CategoryIcon = categoryInfo.icon;
              const statusBadge = getStatusBadge(expense.status);
              const StatusIcon = statusBadge.icon;
              const hasProof = !!expense.receipt_file;

              return (
                <div
                  key={expense.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Left: Icon + Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-${categoryInfo.color}-100`}>
                        <CategoryIcon className={`w-6 h-6 text-${categoryInfo.color}-600`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            {formatCurrency(expense.amount)}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.text} flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusBadge.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                            {categoryInfo.label}
                          </span>
                          {hasProof && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              Receipt
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-700 mb-1">{expense.description}</p>

                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {expense.infrastructure?.name || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(expense.expense_date)}
                          </span>
                          {expense.creator && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {expense.creator.first_name}
                            </span>
                          )}
                        </div>

                        {expense.rejection_reason && (
                          <p className="text-xs text-red-600 mt-2">
                            ❌ {expense.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 flex-wrap lg:flex-shrink-0">
                      {expense.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(expense)}
                            disabled={processingId === expense.id}
                            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                          >
                            {processingId === expense.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(expense)}
                            disabled={processingId === expense.id}
                            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}

                      {expense.status === 'pending' && (
                        <button
                          onClick={() => openEditModal(expense)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(expense)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
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
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingExpense ? 'Edit Expense' : 'Record Expense'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editingExpense ? 'Update expense details' : 'Record a new expense'}
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
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = formData.category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.value })}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className={`text-xs font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (RWF) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="150000"
                  min="0"
                  step="1000"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="e.g., Fixed leaking pipe in A101"
                  maxLength="500"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* Date + Paid By */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    name="expense_date"
                    value={formData.expense_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paid By
                  </label>
                  <select
                    name="paid_by"
                    value={formData.paid_by}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="tenant">Tenant</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Receipt Upload */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt / Proof
                  <span className="text-gray-400 text-xs font-normal ml-2">
                    (Optional — PDF, PNG, JPG — max 2MB)
                  </span>
                </label>

                {!proofFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload receipt
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, PNG, JPG, JPEG (max 2MB)
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg p-3 flex items-center gap-3">
                    {proofPreview ? (
                      <img src={proofPreview} alt="Receipt" className="w-16 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-red-50 rounded flex items-center justify-center">
                        <FileText className="w-8 h-8 text-red-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{proofFile.name}</p>
                      <p className="text-xs text-gray-500">{(proofFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeProof}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
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
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingExpense ? 'Update Expense' : 'Record Expense'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Expenses;