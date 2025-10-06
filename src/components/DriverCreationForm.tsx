import React, { useState } from 'react';
import { User, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface DriverFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  licenseNumber: string;
  licenseExpiry: string;
  vehicleRegistration: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  username: string;
  password: string;
}

interface DriverCreationFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const DriverCreationForm: React.FC<DriverCreationFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState<DriverFormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    licenseNumber: '',
    licenseExpiry: '',
    vehicleRegistration: '',
    vehicleType: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    username: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [creationProgress, setCreationProgress] = useState<string[]>([]);

  const vehicleTypes = [
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'hatchback_ac', label: 'Hatchback AC' },
    { value: 'sedan', label: 'Sedan' },
    { value: 'sedan_ac', label: 'Sedan AC' },
    { value: 'suv', label: 'SUV' },
    { value: 'suv_ac', label: 'SUV AC' }
  ];

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
      if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'License number is required';
      if (!formData.licenseExpiry) newErrors.licenseExpiry = 'License expiry is required';
      else if (new Date(formData.licenseExpiry) <= new Date()) newErrors.licenseExpiry = 'License must not be expired';
    }

    if (stepNumber === 3) {
      if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required';
      if (!formData.vehicleRegistration.trim()) newErrors.vehicleRegistration = 'Vehicle registration is required';
      if (!formData.vehicleMake.trim()) newErrors.vehicleMake = 'Vehicle make is required';
      if (!formData.vehicleModel.trim()) newErrors.vehicleModel = 'Vehicle model is required';
      if (!formData.vehicleYear.trim()) newErrors.vehicleYear = 'Vehicle year is required';
      else if (parseInt(formData.vehicleYear) < 2000 || parseInt(formData.vehicleYear) > new Date().getFullYear()) {
        newErrors.vehicleYear = 'Invalid vehicle year';
      }
      if (!formData.vehicleColor.trim()) newErrors.vehicleColor = 'Vehicle color is required';
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

  const createDriverBulletproof = async () => {
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
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-create-driver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          licenseNumber: formData.licenseNumber,
          licenseExpiry: formData.licenseExpiry,
          vehicleRegistration: formData.vehicleRegistration,
          vehicleType: formData.vehicleType,
          vehicleMake: formData.vehicleMake,
          vehicleModel: formData.vehicleModel,
          vehicleYear: formData.vehicleYear,
          vehicleColor: formData.vehicleColor,
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
      updateProgress('🚗 Registering vehicle...');
      updateProgress('✅ Vehicle registered');
      updateProgress('👤 Creating driver profile...');
      updateProgress('✅ Driver profile created');
      updateProgress('🔗 Linking vehicle to driver...');
      updateProgress('✅ Vehicle linked to driver');
      updateProgress('🔐 Setting up login credentials...');
      updateProgress('✅ Login credentials created');
      updateProgress('🎉 Driver creation completed successfully!');
      
      // Show success message with all details
      setTimeout(() => {
        const driver = result.driver;
        alert(`🎉 Driver Created Successfully!

📋 Driver Details:
• Name: ${driver.full_name}
• Email: ${driver.email}
• Phone: ${formData.phoneNumber}
• License: ${driver.license_number}

🚗 Vehicle Details:
• Registration: ${driver.vehicle_registration}
• Vehicle: ${formData.vehicleMake} ${formData.vehicleModel}
• Type: ${formData.vehicleType}

🔐 Login Credentials:
• Username: ${driver.username}
• Password: ${driver.password}

✅ Driver ID: ${driver.id}
✅ Vehicle ID: ${driver.vehicle_id}

The driver can now use these credentials to log into the driver app.`);
        
        // Only call callbacks, don't trigger any auth-related actions
        onSuccess();
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Driver creation failed:', error);
      updateProgress(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => {
        alert(`❌ Driver Creation Failed\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support if the issue persists.`);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(4)) {
      await createDriverBulletproof();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter driver's full name"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">License Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Number *
              </label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.licenseNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter driving license number"
              />
              {errors.licenseNumber && <p className="text-red-500 text-sm mt-1">{errors.licenseNumber}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Expiry Date *
              </label>
              <input
                type="date"
                value={formData.licenseExpiry}
                onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.licenseExpiry ? 'border-red-500' : 'border-gray-300'
                }`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.licenseExpiry && <p className="text-red-500 text-sm mt-1">{errors.licenseExpiry}</p>}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type *
                </label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.vehicleType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select vehicle type</option>
                  {vehicleTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.vehicleType && <p className="text-red-500 text-sm mt-1">{errors.vehicleType}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  value={formData.vehicleRegistration}
                  onChange={(e) => setFormData({...formData, vehicleRegistration: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.vehicleRegistration ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., KA 01 AB 1234"
                />
                {errors.vehicleRegistration && <p className="text-red-500 text-sm mt-1">{errors.vehicleRegistration}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Make *
                </label>
                <input
                  type="text"
                  value={formData.vehicleMake}
                  onChange={(e) => setFormData({...formData, vehicleMake: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.vehicleMake ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Maruti, Hyundai"
                />
                {errors.vehicleMake && <p className="text-red-500 text-sm mt-1">{errors.vehicleMake}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.vehicleModel ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Swift, i20"
                />
                {errors.vehicleModel && <p className="text-red-500 text-sm mt-1">{errors.vehicleModel}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year *
                </label>
                <input
                  type="number"
                  min="2000"
                  max={new Date().getFullYear()}
                  value={formData.vehicleYear}
                  onChange={(e) => setFormData({...formData, vehicleYear: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.vehicleYear ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 2020"
                />
                {errors.vehicleYear && <p className="text-red-500 text-sm mt-1">{errors.vehicleYear}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color *
                </label>
                <input
                  type="text"
                  value={formData.vehicleColor}
                  onChange={(e) => setFormData({...formData, vehicleColor: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.vehicleColor ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., White, Black"
                />
                {errors.vehicleColor && <p className="text-red-500 text-sm mt-1">{errors.vehicleColor}</p>}
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
                placeholder="Enter username for driver app"
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
                <div><span className="font-medium">👤 Name:</span> {formData.fullName}</div>
                <div><span className="font-medium">📧 Email:</span> {formData.email}</div>
                <div><span className="font-medium">📱 Phone:</span> {formData.phoneNumber}</div>
                <div><span className="font-medium">🪪 License:</span> {formData.licenseNumber}</div>
                <div><span className="font-medium">🚗 Vehicle:</span> {formData.vehicleMake} {formData.vehicleModel} ({formData.vehicleRegistration})</div>
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
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">🚗 Create New Driver</h2>
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNum}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          {renderStep()}
          
          {/* Creation Progress */}
          {loading && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="font-medium text-blue-900">🚀 Creating Driver...</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {creationProgress.map((message, index) => (
                  <div key={index} className="text-sm text-blue-800 flex items-center space-x-2">
                    {message.startsWith('✅') ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : message.startsWith('❌') ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{message.replace(/^[✅❌🔍📝🚗👤🔗🔐🎉]/, '').trim()}</span>
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                    <span>🚀 Create Driver</span>
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

export default DriverCreationForm;