import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';

interface Driver {
  driver_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  username?: string;
  password?: string;
}

interface DriverCredentialsModalProps {
  driver: Driver;
  onClose: () => void;
  onRefresh: () => void;
}

const DriverCredentialsModal: React.FC<DriverCredentialsModalProps> = ({
  driver,
  onClose,
  onRefresh
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
    created_at?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchCredentials();
  }, [driver.user_id]);

  const fetchCredentials = async () => {
    setLoading(true);
    setError('');
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      console.log('🔍 Fetching credentials for driver:', driver.user_id);

      const response = await fetch(`${supabaseUrl}/functions/v1/get-driver-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          user_id: driver.user_id
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch credentials');
      }

      setCredentials(result.credentials);
      console.log('✅ Credentials fetched successfully');
      
    } catch (error) {
      console.error('❌ Error fetching credentials:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch credentials');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${type} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const generateNewCredentials = async () => {
    if (!confirm('Generate new login credentials for this driver? This will invalidate their current login.')) {
      return;
    }

    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/regenerate-driver-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          user_id: driver.user_id,
          driver_name: driver.full_name
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate new credentials');
      }

      setCredentials(result.credentials);
      alert(`✅ New credentials generated!\n\nUsername: ${result.credentials.username}\nPassword: ${result.credentials.password}\n\nPlease share these with the driver.`);
      onRefresh(); // Refresh the drivers list
      
    } catch (error) {
      console.error('❌ Error generating credentials:', error);
      alert(`Failed to generate new credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Driver Login Credentials</h3>
            <p className="text-sm text-gray-600">{driver.full_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Driver Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Name:</span> {driver.full_name}</div>
            <div><span className="font-medium">Email:</span> {driver.email}</div>
            <div><span className="font-medium">Phone:</span> {driver.phone_number}</div>
            <div><span className="font-medium">Driver ID:</span> #{driver.driver_id.slice(-8)}</div>
          </div>
        </div>

        {/* Credentials */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading credentials...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
            <button
              onClick={fetchCredentials}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        ) : credentials ? (
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={credentials.username}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(credentials.username, 'Username')}
                  className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(credentials.password, 'Password')}
                  className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Creation Date */}
            {credentials.created_at && (
              <div className="text-xs text-gray-500">
                Credentials created: {new Date(credentials.created_at).toLocaleString('en-IN')}
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">📱 Driver App Login Instructions</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Open the Driver App</li>
                <li>2. Enter the username and password above</li>
                <li>3. Driver can start accepting rides</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🔐</div>
            <div className="text-gray-600">No credentials found</div>
            <div className="text-sm text-gray-500 mt-1">This driver may not have login credentials set up</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={fetchCredentials}
              disabled={loading}
              className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            {credentials && (
              <button
                onClick={generateNewCredentials}
                disabled={loading}
                className="px-4 py-2 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
              >
                Generate New
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverCredentialsModal;