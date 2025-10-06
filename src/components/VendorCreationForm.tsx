import React, { useState } from 'react';
import { Building, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface VendorFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  licenseNumber: string;
  address: string;
  username: string;
  password: string;
  // Fleet information
  totalVehicles: number;
  totalDrivers: number;
  // Driver details
  driverNames: string;
  driverLicenses: string;
  driverPhones: string;
  // Vehicle details
  vehicleRegistrations: string;
  vehicleMakes: string;
  vehicleModels: string;
  vehicleTypes: string;
}

interface VendorCreationFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const VendorCreationForm: React.FC<VendorCreationFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState<VendorFormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    licenseNumber: '',
    address: '',
    username: '',
    password: '',
    totalVehicles: 0,
    totalDrivers: 0,
    driverNames: '',
    driverLicenses: '',
    driverPhones: '',
    vehicleRegistrations: '',
    vehicleMakes: '',
    vehicleModels: '',
    vehicleTypes: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [creationProgress, setCreationProgress] = useState<string[]>([]);


  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
      else if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) newErrors.phoneNumber = 'Invalid phone number';
    }

    if (stepNumber === 2) {
      if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
      if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'License number is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
    }

    if (stepNumber === 3) {
      if (formData.totalVehicles < 0) newErrors.totalVehicles = 'Total vehicles cannot be negative';
      if (formData.totalDrivers < 0) newErrors.totalDrivers = 'Total drivers cannot be negative';
      if (formData.totalDrivers > 0 && !formData.driverNames.trim()) newErrors.driverNames = 'Driver names are required when driver count > 0';
      if (formData.totalVehicles > 0 && !formData.vehicleRegistrations.trim()) newErrors.vehicleRegistrations = 'Vehicle registrations are required when vehicle count > 0';
    }

    if (stepNumber === 4) {
      if (!formData.username.trim()) newErrors.username = 'Username is required';
      else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
      if (!formData.password.trim()) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setErrors({});
  };

  const updateProgress = (message: string) => {
    setCreationProgress(prev => [...prev, message]);
  };

  const createVendor = async () => {
    setLoading(true);
    setCreationProgress([]);
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }
      
      updateProgress('🚀 Connecting to secure admin service...');
      
      // Call the edge function that uses SERVICE ROLE KEY to bypass RLS
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-create-vendor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          companyName: formData.companyName,
          licenseNumber: formData.licenseNumber,
          address: formData.address,
          totalVehicles: formData.totalVehicles,
          totalDrivers: formData.totalDrivers,
          driverNames: formData.driverNames,
          driverLicenses: formData.driverLicenses,
          driverPhones: formData.driverPhones,
          vehicleRegistrations: formData.vehicleRegistrations,
          vehicleMakes: formData.vehicleMakes,
          vehicleModels: formData.vehicleModels,
          vehicleTypes: formData.vehicleTypes,
          username: formData.username,
          password: formData.password
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      updateProgress('✅ Validation passed - creating records...');
      updateProgress('📝 Creating user profile...');
      updateProgress('✅ User profile created');
      updateProgress('🏢 Creating vendor profile...');
      updateProgress('✅ Vendor profile created');
      updateProgress('🔐 Setting up login credentials...');
      updateProgress('✅ Login credentials created');
      updateProgress('🎉 Vendor creation completed successfully!');
      
      // Show success message with all details
      setTimeout(() => {
        const vendor = result.vendor;
        alert(`🎉 Vendor Created Successfully!

📋 Vendor Details:
• Company: ${vendor.company_name}
• Contact: ${vendor.full_name}
• Email: ${vendor.email}
• Phone: ${formData.phoneNumber}
• License: ${vendor.license_number}

🔐 Login Credentials:
• Username: ${vendor.username}
• Password: ${vendor.password}

✅ Vendor ID: ${vendor.id}

The vendor can now use these credentials to log into the vendor portal app.`);
        
        // Call success callback first, then close modal
        if (onSuccess) {
          onSuccess();
        }
        if (onClose) {
          onClose();
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Vendor creation failed:', error);
      updateProgress(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => {
        alert(`❌ Vendor Creation Failed\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support if the issue persists.`);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(4)) {
      await createVendor();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter contact person's full name"
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter 10-digit phone number"
              />
              {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.companyName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter company name"
              />
              {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business License Number *
              </label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.licenseNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter business license number"
              />
              {errors.licenseNumber && <p className="text-red-500 text-sm mt-1">{errors.licenseNumber}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Enter complete business address"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Vehicles *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalVehicles}
                  onChange={(e) => setFormData({...formData, totalVehicles: parseInt(e.target.value) || 0})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.totalVehicles ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Number of vehicles in fleet"
                />
                {errors.totalVehicles && <p className="text-red-500 text-sm mt-1">{errors.totalVehicles}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Drivers *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalDrivers}
                  onChange={(e) => setFormData({...formData, totalDrivers: parseInt(e.target.value) || 0})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.totalDrivers ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Number of drivers in fleet"
                />
                {errors.totalDrivers && <p className="text-red-500 text-sm mt-1">{errors.totalDrivers}</p>}
              </div>
            </div>
            
            {/* Driver Details Section */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900 border-b pb-2">👥 Driver Details</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver Names {formData.totalDrivers > 0 && '*'}
                </label>
                <textarea
                  value={formData.driverNames}
                  onChange={(e) => setFormData({...formData, driverNames: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.driverNames ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                  placeholder="Enter driver names (one per line)&#10;e.g.:&#10;Rajesh Kumar&#10;Suresh Babu&#10;Priya Sharma"
                />
                {errors.driverNames && <p className="text-red-500 text-sm mt-1">{errors.driverNames}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver License Numbers
                  </label>
                  <textarea
                    value={formData.driverLicenses}
                    onChange={(e) => setFormData({...formData, driverLicenses: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter license numbers (one per line)&#10;e.g.:&#10;DL123456789&#10;DL987654321"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver Phone Numbers
                  </label>
                  <textarea
                    value={formData.driverPhones}
                    onChange={(e) => setFormData({...formData, driverPhones: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter phone numbers (one per line)&#10;e.g.:&#10;9876543210&#10;8765432109"
                  />
                </div>
              </div>
            </div>
            
            {/* Vehicle Details Section */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900 border-b pb-2">🚗 Vehicle Details</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Registration Numbers {formData.totalVehicles > 0 && '*'}
                </label>
                <textarea
                  value={formData.vehicleRegistrations}
                  onChange={(e) => setFormData({...formData, vehicleRegistrations: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.vehicleRegistrations ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                  placeholder="Enter registration numbers (one per line)&#10;e.g.:&#10;KA 01 AB 1234&#10;KA 02 CD 5678"
                />
                {errors.vehicleRegistrations && <p className="text-red-500 text-sm mt-1">{errors.vehicleRegistrations}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Makes
                  </label>
                  <textarea
                    value={formData.vehicleMakes}
                    onChange={(e) => setFormData({...formData, vehicleMakes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter makes (one per line)&#10;e.g.:&#10;Maruti&#10;Hyundai"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Models
                  </label>
                  <textarea
                    value={formData.vehicleModels}
                    onChange={(e) => setFormData({...formData, vehicleModels: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter models (one per line)&#10;e.g.:&#10;Swift&#10;i20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Types
                  </label>
                  <textarea
                    value={formData.vehicleTypes}
                    onChange={(e) => setFormData({...formData, vehicleTypes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter types (one per line)&#10;e.g.:&#10;sedan_ac&#10;hatchback_ac"
                  />
                </div>
              </div>
            </div>
            
            {/* Fleet Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="text-sm font-medium text-blue-900 mb-2">📊 Fleet Summary</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Total Vehicles:</span>
                  <div className="font-medium">{formData.totalVehicles}</div>
                </div>
                <div>
                  <span className="text-blue-700">Total Drivers:</span>
                  <div className="font-medium">{formData.totalDrivers}</div>
                </div>
                <div>
                  <span className="text-blue-700">Driver Names:</span>
                  <div className="font-medium text-xs">
                    {formData.driverNames ? formData.driverNames.split('\n').length : 0} entered
                  </div>
                </div>
                <div>
                  <span className="text-blue-700">Vehicle Registrations:</span>
                  <div className="font-medium text-xs">
                    {formData.vehicleRegistrations ? formData.vehicleRegistrations.split('\n').length : 0} entered
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Login Credentials</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter username for vendor portal"
              />
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter password (min 6 characters)"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
            
            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mt-6">
              <h4 className="font-medium text-gray-900 mb-3">📋 Summary</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">👤 Contact:</span> {formData.fullName}</div>
                <div><span className="font-medium">📧 Email:</span> {formData.email}</div>
                <div><span className="font-medium">📱 Phone:</span> {formData.phoneNumber}</div>
                <div><span className="font-medium">🏢 Company:</span> {formData.companyName}</div>
                <div><span className="font-medium">📄 License:</span> {formData.licenseNumber}</div>
                <div><span className="font-medium">🚗 Fleet Size:</span> {formData.totalVehicles} vehicles, {formData.totalDrivers} drivers</div>
                <div><span className="font-medium">👥 Drivers:</span> {formData.driverNames ? formData.driverNames.split('\n').length : 0} names provided</div>
                <div><span className="font-medium">🚗 Vehicles:</span> {formData.vehicleRegistrations ? formData.vehicleRegistrations.split('\n').length : 0} registrations provided</div>
                <div><span className="font-medium">🔐 Username:</span> {formData.username}</div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">🏢 Create New Vendor</h2>
              <p className="text-sm text-gray-600">Step {step} of 4</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum <= step
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNum}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          {renderStep()}
          
          {/* Creation Progress */}
          {loading && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Loader className="w-5 h-5 text-purple-600 animate-spin" />
                <span className="font-medium text-purple-900">🚀 Creating Vendor...</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {creationProgress.map((message, index) => (
                  <div key={index} className="text-sm text-purple-800 flex items-center space-x-2">
                    {message.startsWith('✅') ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : message.startsWith('❌') ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{message.replace(/^[✅❌🔍📝🏢🔐🎉]/, '').trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={step === 1 || loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              ← Previous
            </button>
            
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>🚀 Create Vendor</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorCreationForm;