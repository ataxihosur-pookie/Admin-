import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, Users, TrendingUp, Upload, X, Image as ImageIcon } from 'lucide-react';
import databaseService from '../services/databaseService';

interface Advertisement {
  id: string;
  title: string;
  description: string;
  images: string[];
  target_audience: 'all' | 'new_customers' | 'frequent_customers' | 'premium_customers';
  start_date: string;
  end_date: string;
  is_active: boolean;
  click_count: number;
  view_count: number;
  priority: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface AdFormData {
  title: string;
  description: string;
  images: string[];
  target_audience: 'all' | 'new_customers' | 'frequent_customers' | 'premium_customers';
  start_date: string;
  end_date: string;
  priority: number;
}

const AdvertisementsManagement: React.FC = () => {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState<AdFormData>({
    title: '',
    description: '',
    images: [],
    target_audience: 'all',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 5
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageInput, setImageInput] = useState('');

  const targetAudienceOptions = [
    { value: 'all', label: 'All Customers', icon: '👥' },
    { value: 'new_customers', label: 'New Customers', icon: '🆕' },
    { value: 'frequent_customers', label: 'Frequent Customers', icon: '⭐' },
    { value: 'premium_customers', label: 'Premium Customers', icon: '💎' }
  ];

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    setLoading(true);
    try {
      const ads = await databaseService.fetchAdvertisements();
      setAdvertisements(ads);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.images.length === 0) newErrors.images = 'At least one image is required';
    if (formData.images.length > 10) newErrors.images = 'Maximum 10 images allowed';
    
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      newErrors.end_date = 'End date must be after start date';
    }

    // Validate image URLs
    const invalidImages = formData.images.filter(url => !isValidImageUrl(url));
    if (invalidImages.length > 0) {
      newErrors.images = 'Some image URLs are invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidImageUrl = (url: string): boolean => {
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingAd) {
        await databaseService.updateAdvertisement(editingAd.id, formData);
      } else {
        await databaseService.createAdvertisement(formData);
      }
      
      resetForm();
      await fetchAdvertisements();
    } catch (error) {
      console.error('Error saving advertisement:', error);
      alert('Failed to save advertisement. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      images: [],
      target_audience: 'all',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 5
    });
    setErrors({});
    setImageInput('');
    setShowCreateForm(false);
    setEditingAd(null);
  };

  const handleEdit = (ad: Advertisement) => {
    setFormData({
      title: ad.title,
      description: ad.description,
      images: ad.images,
      target_audience: ad.target_audience,
      start_date: ad.start_date.split('T')[0],
      end_date: ad.end_date.split('T')[0],
      priority: ad.priority
    });
    setEditingAd(ad);
    setShowCreateForm(true);
  };

  const handleToggleActive = async (adId: string, isActive: boolean) => {
    try {
      await databaseService.updateAdvertisementStatus(adId, !isActive);
      await fetchAdvertisements();
    } catch (error) {
      console.error('Error updating advertisement status:', error);
      alert('Failed to update advertisement status');
    }
  };

  const handleDelete = async (adId: string) => {
    if (confirm('Are you sure you want to delete this advertisement? This action cannot be undone.')) {
      try {
        await databaseService.deleteAdvertisement(adId);
        await fetchAdvertisements();
      } catch (error) {
        console.error('Error deleting advertisement:', error);
        alert('Failed to delete advertisement');
      }
    }
  };

  const addImage = () => {
    if (!imageInput.trim()) return;
    
    if (!isValidImageUrl(imageInput)) {
      alert('Please enter a valid image URL (jpg, jpeg, png, gif, webp)');
      return;
    }

    if (formData.images.length >= 10) {
      alert('Maximum 10 images allowed per advertisement');
      return;
    }

    if (formData.images.includes(imageInput)) {
      alert('This image URL is already added');
      return;
    }

    setFormData({
      ...formData,
      images: [...formData.images, imageInput]
    });
    setImageInput('');
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  const getStatusColor = (ad: Advertisement) => {
    const now = new Date();
    const startDate = new Date(ad.start_date);
    const endDate = new Date(ad.end_date);
    
    if (!ad.is_active) return 'bg-gray-100 text-gray-800';
    if (now < startDate) return 'bg-blue-100 text-blue-800';
    if (now > endDate) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (ad: Advertisement) => {
    const now = new Date();
    const startDate = new Date(ad.start_date);
    const endDate = new Date(ad.end_date);
    
    if (!ad.is_active) return 'Inactive';
    if (now < startDate) return 'Scheduled';
    if (now > endDate) return 'Expired';
    return 'Active';
  };

  const suggestedImages = [
    'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1402787/pexels-photo-1402787.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800'
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading advertisements...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Advertisements Management</h3>
          <p className="text-gray-600 mt-1">Create and manage image advertisements for the customer app</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={fetchAdvertisements}
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
            <span>Create Advertisement</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Ads</p>
              <p className="text-3xl font-bold">{advertisements.length}</p>
            </div>
            <span className="text-4xl">📢</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active Ads</p>
              <p className="text-3xl font-bold">
                {advertisements.filter(ad => ad.is_active && new Date(ad.end_date) > new Date()).length}
              </p>
            </div>
            <span className="text-4xl">✅</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Views</p>
              <p className="text-3xl font-bold">
                {advertisements.reduce((sum, ad) => sum + ad.view_count, 0)}
              </p>
            </div>
            <span className="text-4xl">👁️</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Total Clicks</p>
              <p className="text-3xl font-bold">
                {advertisements.reduce((sum, ad) => sum + ad.click_count, 0)}
              </p>
            </div>
            <span className="text-4xl">👆</span>
          </div>
        </div>
      </div>

      {/* Advertisements List */}
      {advertisements.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📢</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Advertisements Found</h3>
          <p className="text-gray-600 mb-4">Create your first advertisement to promote services to customers.</p>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Advertisement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advertisements.map((ad) => (
            <div key={ad.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Ad Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold">{ad.title}</h4>
                    <p className="text-indigo-100 text-sm">{ad.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ad)}`}>
                      {getStatusText(ad)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Image Preview */}
              <div className="p-4">
                {ad.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {ad.images.slice(0, 4).map((image, index) => (
                      <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`Ad image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                          }}
                        />
                        {index === 3 && ad.images.length > 4 && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white font-bold">+{ad.images.length - 4}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                {/* Ad Details */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Target</div>
                      <div className="text-sm font-medium">
                        {targetAudienceOptions.find(opt => opt.value === ad.target_audience)?.label}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Priority</div>
                      <div className="text-sm font-medium">{ad.priority}/10</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Views</div>
                      <div className="text-sm font-medium">{ad.view_count}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Clicks</div>
                      <div className="text-sm font-medium">{ad.click_count}</div>
                    </div>
                  </div>

                  {/* Validity */}
                  <div className="text-xs text-gray-500">
                    <div>Start: {new Date(ad.start_date).toLocaleDateString('en-IN')}</div>
                    <div>End: {new Date(ad.end_date).toLocaleDateString('en-IN')}</div>
                  </div>

                  {/* CTR */}
                  {ad.view_count > 0 && (
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <div className="text-xs text-blue-600">
                        CTR: {((ad.click_count / ad.view_count) * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(ad)}
                        className="text-gray-600 hover:text-gray-800 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(ad.id, ad.is_active)}
                        className={`p-1 ${ad.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                      >
                        {ad.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-xs text-gray-500">
                      {ad.images.length} image{ad.images.length !== 1 ? 's' : ''}
                    </span>
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
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-semibold text-gray-900">
                {editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}
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
                      Advertisement Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Special Discount Offer"
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Audience *
                    </label>
                    <select
                      value={formData.target_audience}
                      onChange={(e) => setFormData({...formData, target_audience: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {targetAudienceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
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
                    placeholder="Describe the advertisement offer..."
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>
              </div>

              {/* Image Management */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="text-lg font-medium text-gray-900">Images (Max 10)</h5>
                  <span className="text-sm text-gray-500">{formData.images.length}/10 images</span>
                </div>

                {/* Add Image Input */}
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                   onKeyPress={(e) => {
                     if (e.key === 'Enter') {
                       e.preventDefault();
                       addImage();
                     }
                   }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter image URL (jpg, png, gif, webp)"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    disabled={formData.images.length >= 10}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Suggested Images */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Quick Add (Sample Images):</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedImages.map((url, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (formData.images.length < 10 && !formData.images.includes(url)) {
                            setFormData({
                              ...formData,
                              images: [...formData.images, url]
                            });
                          }
                        }}
                        disabled={formData.images.length >= 10 || formData.images.includes(url)}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        Sample {index + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Preview Grid */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={image}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Invalid+Image';
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
              </div>

              {/* Schedule & Priority */}
              <div className="space-y-4">
                <h5 className="text-lg font-medium text-gray-900">Schedule & Priority</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.end_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Higher priority ads show first</p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h6 className="text-sm font-medium text-blue-900 mb-2">Customer App Preview</h6>
                <div className="bg-white rounded-lg p-3 border">
                  <div className="text-sm font-medium text-gray-900">{formData.title || 'Advertisement Title'}</div>
                  <div className="text-xs text-gray-600 mt-1">{formData.description || 'Advertisement description'}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-blue-600">
                      {targetAudienceOptions.find(opt => opt.value === formData.target_audience)?.icon} 
                      {targetAudienceOptions.find(opt => opt.value === formData.target_audience)?.label}
                    </span>
                    <span className="text-xs text-gray-500">{formData.images.length} images</span>
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
                  {editingAd ? 'Update Advertisement' : 'Create Advertisement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertisementsManagement;