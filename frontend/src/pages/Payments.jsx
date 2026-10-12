import { useState, useEffect, useRef } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  X,
  Loader2,
  Download,
  Upload,
  FileText,
  Paperclip,
  Calendar,
  CreditCard,
  Building2,
  AlertCircle,
  CheckCircle,
  Trash2
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { paymentAPI, tenantAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Proof file state
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    tenant_id: '',
    amount: '',
    payment_method: 'mobile_money',
    payment_date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, tenantsRes] = await Promise.all([
        paymentAPI.list(),
        tenantAPI.list()
      ]);
      setPayments(paymentsRes.data.data || []);
      setTenants(tenantsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load payments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tenant_id: '',
      amount: '',
      payment_method: 'mobile_money',
      payment_date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      notes: ''
    });
    setProofFile(null);
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofPreview(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle proof file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, PNG, JPG, JPEG files are allowed');
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setProofFile(file);

    // Preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setProofPreview(url);
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

    if (!formData.tenant_id || !formData.amount || !formData.payment_method || !formData.payment_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      // STEP 1: Create payment
      const response = await paymentAPI.create({
        tenant_id: formData.tenant_id,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        payment_date: formData.payment_date,
        reference: formData.reference || undefined,
        description: formData.description || undefined,
        notes: formData.notes || undefined
      });

      const createdPayments = response.data.data.payments || [];
      toast.success('Payment recorded successfully');

      // STEP 2: Upload proof if selected (to first payment record)
      if (proofFile && createdPayments.length > 0) {
        const firstPayment = createdPayments[0];
        const formDataUpload = new FormData();
        formDataUpload.append('proof', proofFile);

        try {
          await paymentAPI.uploadProof(firstPayment.id, formDataUpload);
          toast.success('Payment proof uploaded');
        } catch (uploadError) {
          toast.error('Payment saved but proof upload failed');
          console.error(uploadError);
        }
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReceipt = async (payment) => {
    try {
      toast.loading('Generating receipt...', { id: 'receipt' });
      const response = await paymentAPI.downloadReceipt(payment.id);

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Receipt-${payment.id.slice(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Receipt downloaded', { id: 'receipt' });
    } catch (error) {
      toast.error('Failed to download receipt', { id: 'receipt' });
      console.error(error);
    }
  };

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (filterMethod !== 'all' && p.payment_method !== filterMethod) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const tenantName = `${p.tenant?.first_name} ${p.tenant?.last_name}`.toLowerCase();
      return (
        tenantName.includes(q) ||
        p.reference?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalFiltered = filteredPayments.reduce(
    (sum, p) => sum + parseFloat(p.amount), 0
  );

  const getMethodBadge = (method) => {
    const badges = {
      mobile_money: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Mobile Money' },
      bank_transfer: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Bank Transfer' },
      cash: { bg: 'bg-green-100', text: 'text-green-700', label: 'Cash' }
    };
    return badges[method] || badges.cash;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-1">
              {payments.length} {payments.length === 1 ? 'payment' : 'payments'} • {formatCurrency(totalFiltered)} total
            </p>
          </div>
          <button
            onClick={openCreateModal}
            disabled={tenants.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Record Payment
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
              placeholder="Search by tenant, reference, or description..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">All Payment Methods</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
          </select>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="w-1/2 h-6 bg-gray-200 rounded mb-2" />
                <div className="w-1/3 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {searchQuery || filterMethod !== 'all' ? 'No payments match' : 'No payments yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {tenants.length === 0
                ? 'Add tenants first before recording payments'
                : 'Record your first payment to get started'}
            </p>
            {tenants.length > 0 && !searchQuery && filterMethod === 'all' && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                Record First Payment
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => {
              const methodBadge = getMethodBadge(payment.payment_method);
              const hasProof = !!payment.proof_file;

              return (
                <div
                  key={payment.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Icon + Amount */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${methodBadge.bg} ${methodBadge.text}`}>
                            {methodBadge.label}
                          </span>
                          {hasProof && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              Proof
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-medium text-gray-700">
                          {payment.tenant?.first_name} {payment.tenant?.last_name}
                        </p>

                        {payment.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {payment.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(payment.payment_date)}
                          </span>
                          {payment.reference && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {payment.reference}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:flex-shrink-0">
                      <button
                        onClick={() => handleDownloadReceipt(payment)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Receipt</span>
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
                <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
                <p className="text-sm text-gray-500 mt-1">Payment applies to oldest dues first</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Tenant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant <span className="text-red-500">*</span>
                </label>
                <select
                  name="tenant_id"
                  value={formData.tenant_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select tenant</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name} — {t.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (RWF) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="450000"
                    min="0"
                    step="1000"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              {/* Method + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference
                </label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  placeholder="TXN-2026-001"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-gray-400 text-xs">(max 150 chars)</span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  maxLength="150"
                  placeholder="September rent payment"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {formData.description.length}/150
                </p>
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

              {/* PROOF UPLOAD */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Proof
                  <span className="text-gray-400 text-xs font-normal ml-2">
                    (PDF, PNG, JPG — max 2MB)
                  </span>
                </label>

                {!proofFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload or drag file here
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, PNG, JPG, JPEG (max 2MB)
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg p-3 flex items-center gap-3">
                    {proofPreview ? (
                      <img
                        src={proofPreview}
                        alt="Proof preview"
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-red-50 rounded flex items-center justify-center">
                        <FileText className="w-8 h-8 text-red-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {proofFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(proofFile.size / 1024).toFixed(1)} KB
                      </p>
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
                    Recording...
                  </>
                ) : (
                  'Record Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Payments;