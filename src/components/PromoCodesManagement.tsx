import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, Eye, EyeOff, Calendar, Users, TrendingUp } from 'lucide-react';
import databaseService from '../services/databaseService';

interface PromoCode {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  minimum_fare: number;
  maximum_discount?: number;
  usage_limit?: number;
  usage_count: number;
  user_usage_limit: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface PromoCodesManagementProps {
  user: {
    id: string;
    email: string;
    role: string;
    full_name: string;
  };
}

interface PromoFormData {
  code: string;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  minimum_fare: number;
  maximum_discount: number;
  usage_limit: number;
  user_usage_limit: number;
  valid_from: string;
  valid_until: string;
}

const PromoCodesManagement: React.FC<PromoCodesManagementProps> = ({ user }) => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState<PromoFormData>({
    code: '',
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    minimum_fare: 100,
    maximum_discount: 50,
    usage_limit: 100,
    user_usage_limit: 1,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching promo codes from database...');
      const codes = await databaseService.fetchPromoCodes();
      setPromoCodes(codes);
      console.log(`✅ Loaded ${codes.length} promo codes`);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      alert('Failed to load promo codes. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) newErrors.code = 'Promo code is required';
    else if (formData.code.length < 3) newErrors.code = 'Code must be at least 3 characters';
    else if (!/^[A-Z0-9]+$/.test(formData.code)) newErrors.code = 'Code must contain only uppercase letters and numbers';

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    if (formData.discount_value <= 0) newErrors.discount_value = 'Discount value must be greater than 0';
    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      newErrors.discount_value = 'Percentage cannot exceed 100%';
    }
    
    if (formData.minimum_fare < 0) newErrors.minimum_fare = 'Minimum fare cannot be negative';
    if (formData.usage_limit && formData.usage_limit <= 0) newErrors.usage_limit = 'Usage limit must be greater than 0';
    if (formData.user_usage_limit <= 0) newErrors.user_usage_limit = 'User usage limit must be greater than 0';
    
    if (new Date(formData.valid_until) <= new Date(formData.valid_from)) {
      newErrors.valid_until = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      console.log('💾 Saving promo code:', formData);
      
      if (editingPromo) {
        console.log('📝 Updating existing promo code:', editingPromo.id);
        await databaseService.updatePromoCode(editingPromo.id, formData);
        alert('Promo code updated successfully!');
      } else {
        console.log('➕ Creating new promo code');
        await databaseService.createPromoCode(formData, user);
        alert('Promo code created successfully!');
      }
      
      resetForm();
      await fetchPromoCodes();
    } catch (error) {
      console.error('Error saving promo code:', error);
      alert(`Failed to save promo code: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      title: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      minimum_fare: 100,
      maximum_discount: 50,
      usage_limit: 100,
      user_usage_limit: 1,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setErrors({});
    setShowCreateForm(false);
    setEditingPromo(null);
  };

  const handleEdit = (promo: PromoCode) => {
    setFormData({
      code: promo.code,
      title: promo.title,
      description: promo.description,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      minimum_fare: promo.minimum_fare,
      maximum_discount: promo.maximum_discount || 0,
      usage_limit: promo.usage_limit || 0,
      user_usage_limit: promo.user_usage_limit,
      valid_from: promo.valid_from.split('T')[0],
      valid_until: promo.valid_until.split('T')[0]
    });
    setEditingPromo(promo);
    setShowCreateForm(true);
  };

  const handleToggleActive = async (promoId: string, isActive: boolean) => {
    try {
      console.log('🔄 Toggling promo code status:', promoId, !isActive);
      await databaseService.updatePromoCodeStatus(promoId, !isActive);
      alert(`Promo code ${!isActive ? 'activated' : 'deactivated'} successfully!`);
      await fetchPromoCodes();
    } catch (error) {
      console.error('Error updating promo code status:', error);
      alert(`Failed to update promo code status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (promoId: string) => {
    if (confirm('Are you sure you want to delete this promo code? This action cannot be undone.')) {
      try {
        console.log('🗑️ Deleting promo code:', promoId);
        await databaseService.deletePromoCode(promoId);
        alert('Promo code deleted successfully!');
        await fetchPromoCodes();
      } catch (error) {
        console.error('Error deleting promo code:', error);
        alert(`Failed to delete promo code: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Promo code copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  };

  const getDiscountDisplay = (promo: PromoCode) => {
    if (promo.discount_type === 'percentage') {
      return `${promo.discount_value}% OFF`;
    } else {
      return `₹${promo.discount_value} OFF`;
    }
  };

  const getStatusColor = (promo: PromoCode) => {
    const now = new Date();
    const validFrom = new Date(promo.valid_from);
    const validUntil = new Date(promo.valid_until);
    
    if (!promo.is_active) return 'bg-gray-100 text-gray-800';
    if (now < validFrom) return 'bg-blue-100 text-blue-800';
    if (now > validUntil) return 'bg-red-100 text-red-800';
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (promo: PromoCode) => {
    const now = new Date();
    const validFrom = new Date(promo.valid_from);
    const validUntil = new Date(promo.valid_until);
    
    if (!promo.is_active) return 'Inactive';
    if (now < validFrom) return 'Scheduled';
    if (now > validUntil) return 'Expired';
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) return 'Exhausted';
    return 'Active';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading promo codes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Promo Codes Management</h3>
          <p className="text-gray-600 mt-1">Create and manage promotional codes for customer discounts</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={fetchPromoCodes}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo Code</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Codes</p>
              <p className="text-3xl font-bold">{promoCodes.length}</p>
            </div>
            <span className="text-4xl">🏷️</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active Codes</p>
              <p className="text-3xl font-bold">
                {promoCodes.filter(p => p.is_active && new Date(p.valid_until) > new Date()).length}
              </p>
            </div>
            <span className="text-4xl">✅</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Usage</p>
              <p className="text-3xl font-bold">
                {promoCodes.reduce((sum, p) => sum + p.usage_count, 0)}
              </p>
            </div>
            <span className="text-4xl">📊</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Avg Discount</p>
              <p className="text-3xl font-bold">
                {promoCodes.length > 0 
                  ? Math.round(promoCodes.reduce((sum, p) => sum + p.discount_value, 0) / promoCodes.length)
                  : 0}
                {promoCodes.length > 0 && promoCodes[0].discount_type === 'percentage' ? '%' : '₹'}
              </p>
            </div>
            <span className="text-4xl">💰</span>
          </div>
        </div>
      </div>

      {/* Promo Codes List */}
      {promoCodes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Promo Codes Found</h3>
          <p className="text-gray-600 mb-4">Create your first promotional code to offer discounts to customers.</p>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Promo Code
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promoCodes.map((promo) => (
            <div key={promo.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Promo Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold">{promo.code}</h4>
                    <p className="text-indigo-100 text-sm">{promo.title}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(promo)}`}>
                      {getStatusText(promo)}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold">{getDiscountDisplay(promo)}</div>
                  {promo.discount_type === 'percentage' && promo.maximum_discount && (
                    <div className="text-sm text-indigo-200">Max ₹{promo.maximum_discount}</div>
                  )}
                </div>
              </div>

              {/* Promo Details */}
              <div className="p-4 space-y-3">
                <div className="text-sm text-gray-600">{promo.description}</div>
                
                {/* Usage Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Usage</div>
                    <div className="text-sm font-medium">
                      {promo.usage_count}
                      {promo.usage_limit && ` / ${promo.usage_limit}`}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Min Fare</div>
                    <div className="text-sm font-medium">₹{promo.minimum_fare}</div>
                  </div>
                </div>

                {/* Validity */}
                <div className="text-xs text-gray-500">
                  <div>Valid from: {new Date(promo.valid_from).toLocaleDateString('en-IN')}</div>
                  <div>Valid until: {new Date(promo.valid_until).toLocaleDateString('en-IN')}</div>
                </div>

                {/* Progress Bar for Usage */}
                {promo.usage_limit && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Usage Progress</span>
                      <span>{Math.round((promo.usage_count / promo.usage_limit) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((promo.usage_count / promo.usage_limit) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-3 border-t">
                  <button
                    onClick={() => copyToClipboard(promo.code)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(promo)}
                      className="text-gray-600 hover:text-gray-800 p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(promo.id, promo.is_active)}
                      className={`p-1 ${promo.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                    >
                      {promo.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-semibold text-gray-900">
                {editingPromo ? 'Edit Promo Code' : 'Create New Promo Code'}
              </h4>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h5 className="text-lg font-medium text-gray-900">Basic Information</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Promo Code *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                        className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.code ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., SAVE20"
                        maxLength={20}
                      />
                      <button
                        type="button"
                        onClick={generateRandomCode}
                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        🎲
                      </button>
                    </div>
                    {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., New Year Special"
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    rows={3}
                    placeholder="Describe the promotional offer..."
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>
              </div>

              {/* Discount Configuration */}
              <div className="space-y-4">
                <h5 className="text-lg font-medium text-gray-900">Discount Configuration</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Type *
                    </label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) => setFormData({...formData, discount_type: e.target.value as 'percentage' | 'fixed_amount'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="percentage">Percentage Discount</option>
                      <option value="fixed_amount">Fixed Amount Discount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Value *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.discount_value}
                        onChange={(e) => setFormData({...formData, discount_value: parseFloat(e.target.value)})}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.discount_value ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={formData.discount_type === 'percentage' ? '10' : '50'}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {formData.discount_type === 'percentage' ? '%' : '₹'}
                      </span>
                    </div>
                    {errors.discount_value && <p className="text-red-500 text-sm mt-1">{errors.discount_value}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Fare (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minimum_fare}
                      onChange={(e) => setFormData({...formData, minimum_fare: parseFloat(e.target.value)})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.minimum_fare ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="100"
                    />
                    {errors.minimum_fare && <p className="text-red-500 text-sm mt-1">{errors.minimum_fare}</p>}
                  </div>

                  {formData.discount_type === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Discount (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.maximum_discount}
                        onChange={(e) => setFormData({...formData, maximum_discount: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="50"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Usage Limits */}
              <div className="space-y-4">
                <h5 className="text-lg font-medium text-gray-900">Usage Limits</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Usage Limit
                    </label>
                    <input
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({...formData, usage_limit: parseInt(e.target.value)})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.usage_limit ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="100 (leave 0 for unlimited)"
                    />
                    {errors.usage_limit && <p className="text-red-500 text-sm mt-1">{errors.usage_limit}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Per User Limit *
                    </label>
                    <input
                      type="number"
                      value={formData.user_usage_limit}
                      onChange={(e) => setFormData({...formData, user_usage_limit: parseInt(e.target.value)})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.user_usage_limit ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="1"
                    />
                    {errors.user_usage_limit && <p className="text-red-500 text-sm mt-1">{errors.user_usage_limit}</p>}
                  </div>
                </div>
              </div>

              {/* Validity Period */}
              <div className="space-y-4">
                <h5 className="text-lg font-medium text-gray-900">Validity Period</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid From *
                    </label>
                    <input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid Until *
                    </label>
                    <input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.valid_until ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.valid_until && <p className="text-red-500 text-sm mt-1">{errors.valid_until}</p>}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h6 className="text-sm font-medium text-blue-900 mb-2">Preview</h6>
                <div className="text-sm space-y-1">
                  <div className="font-medium text-blue-900">Code: {formData.code || 'PROMO_CODE'}</div>
                  <div className="text-blue-800">{formData.title || 'Promo Title'}</div>
                  <div className="text-blue-700">
                    {formData.discount_type === 'percentage' 
                      ? `${formData.discount_value}% discount` 
                      : `₹${formData.discount_value} off`}
                    {formData.minimum_fare > 0 && ` on rides above ₹${formData.minimum_fare}`}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPromo ? 'Update Promo Code' : 'Create Promo Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodesManagement;