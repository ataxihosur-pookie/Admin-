import React, { useState } from 'react';
import { User, Phone, Mail, Plus, CheckCircle, AlertCircle } from 'lucide-react';

interface TestCustomerCreationProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface CustomerFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

const TestCustomerCreation: React.FC<TestCustomerCreationProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: 'customer123'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [creationProgress, setCreationProgress] = useState<string[]>([]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    else if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) newErrors.phoneNumber = 'Invalid phone number';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateProgress = (message: string) => {
    setCreationProgress(prev => [...prev, message]);
  };

  const createTestCustomer = async () => {
    setLoading(true);
    setCreationProgress([]);
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase SERVICE ROLE KEY configuration missing');
      }
      
      updateProgress('🚀 Connecting with admin privileges...');
      
      // Call edge function to create customer with SERVICE ROLE
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-create-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      updateProgress('✅ Validation passed');
      updateProgress('📝 Creating customer profile...');
      updateProgress('✅ Customer profile created');
      updateProgress('🔐 Setting up authentication...');
      updateProgress('✅ Authentication configured');
      updateProgress('🎉 Test customer created successfully!');
      
      setTimeout(() => {
        const customer = result.customer;
        alert(`🎉 Test Customer Created Successfully!

📋 Customer Details:
• Name: ${customer.full_name}
• Email: ${customer.email}
• Phone: ${formData.phoneNumber}
• Role: Customer

🔐 Login Credentials:
• Email: ${customer.email}
• Password: ${formData.password}

✅ Customer ID: ${customer.id}

This customer can now use the customer mobile app to book rides.`);
        
        if (onSuccess) {
          onSuccess();
        }
        if (onClose) {
          onClose();
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Customer creation failed:', error);
      updateProgress(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => {
        alert(`❌ Customer Creation Failed\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again.`);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await createTestCustomer();
    }
  };

  const generateTestData = () => {
    const testCustomers = [
      { name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '9876543210' },
      { name: 'Priya Sharma', email: 'priya@example.com', phone: '8765432109' },
      { name: 'Suresh Babu', email: 'suresh@example.com', phone: '7654321098' },
      { name: 'Anita Singh', email: 'anita@example.com', phone: '6543210987' }
    ];
    
    const randomCustomer = testCustomers[Math.floor(Math.random() * testCustomers.length)];
    setFormData({
      fullName: randomCustomer.name,
      email: randomCustomer.email,
      phoneNumber: randomCustomer.phone,
      password: 'customer123'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">👥 Create Test Customer</h2>
              <p className="text-sm text-gray-600">Add a test customer to the database</p>
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

        {/* Quick Generate Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={generateTestData}
            disabled={loading}
            className="w-full bg-purple-100 text-purple-700 py-2 px-4 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>🎲</span>
            <span>Generate Random Test Data</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Enter customer's full name"
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
          
          {/* Creation Progress */}
          {loading && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-medium text-blue-900">🚀 Creating Customer...</span>
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
                    <span>{message.replace(/^[✅❌🔍📝👥🔐🎉]/, '').trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>👥 Create Customer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestCustomerCreation;