import React, { useState } from 'react';
import { Shield, Mail, Lock, AlertCircle, Users, Car, BarChart3, Settings } from 'lucide-react';

interface LoginPageProps {
  onSignIn: (email: string, password: string) => Promise<void>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSignIn }) => {
  const [email, setEmail] = useState('admin@taxiapp.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSignIn(email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      await onSignIn('admin@taxiapp.com', 'admin123');
    } catch (err: any) {
      console.error('Quick login error:', err);
      setError('Quick login failed. Please ensure Supabase is connected.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex flex-col justify-center text-white">
          <div className="mb-12">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">TaxiApp</h1>
                <p className="text-red-200 text-lg">Admin Dashboard</p>
              </div>
            </div>
            
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Complete Platform
              <br />
              <span className="text-red-400">Management</span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Comprehensive control over your taxi ecosystem with real-time monitoring, 
              analytics, and seamless integration across all applications.
            </p>
          </div>

          <div className="space-y-6">
            <FeatureItem 
              icon={<Users className="w-6 h-6" />}
              title="Multi-Role User Management"
              description="Manage customers, drivers, vendors with role-based access control"
            />
            <FeatureItem 
              icon={<Car className="w-6 h-6" />}
              title="Fleet & Driver Operations"
              description="Real-time driver status, vehicle tracking, and ride allocation"
            />
            <FeatureItem 
              icon={<BarChart3 className="w-6 h-6" />}
              title="Advanced Analytics"
              description="Revenue tracking, performance metrics, and business insights"
            />
            <FeatureItem 
              icon={<Settings className="w-6 h-6" />}
              title="Platform Configuration"
              description="Pricing management, zone settings, and system administration"
            />
          </div>

          <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <h3 className="text-lg font-semibold mb-4">Connected Applications</h3>
            <div className="grid grid-cols-3 gap-4">
              <AppStatus name="Customer" status="Ready" color="bg-blue-500" />
              <AppStatus name="Driver" status="Ready" color="bg-green-500" />
              <AppStatus name="Vendor" status="Ready" color="bg-purple-500" />
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">TaxiApp Admin</h1>
              <p className="text-red-200">Platform Management Dashboard</p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-600">Sign in to your admin dashboard</p>
              </div>

              {/* Quick Setup Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Quick Setup Available</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Use the Quick Login button below for instant access with default credentials.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-700 text-sm font-medium">Authentication Error</p>
                      <p className="text-red-600 text-xs mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                      placeholder="Enter admin email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      'Sign In to Dashboard'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickLogin}
                    disabled={isLoading}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50"
                  >
                    Quick Login (Default Credentials)
                  </button>
                </div>
              </form>

              {/* Credentials Display */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border">
                <p className="text-sm font-medium text-gray-700 mb-3">Default Admin Credentials:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Email:</span>
                    <code className="bg-white px-3 py-1 rounded-lg text-gray-800 font-mono">admin@taxiapp.com</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Password:</span>
                    <code className="bg-white px-3 py-1 rounded-lg text-gray-800 font-mono">admin123</code>
                  </div>
                </div>
              </div>

              {/* Setup Status */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">Platform Status</p>
                  <div className="flex justify-center space-x-2">
                    <StatusDot color="bg-green-500" label="Backend" />
                    <StatusDot color="bg-yellow-500" label="Database" />
                    <StatusDot color="bg-blue-500" label="API" />
                  </div>
                </div>
              </div>

              {/* Supabase Connection Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Supabase Connection Required</p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Click "Connect to Supabase" in the top right to set up your database, or use Quick Login for demo mode.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => (
  <div className="flex items-start space-x-4">
    <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{description}</p>
    </div>
  </div>
);

interface AppStatusProps {
  name: string;
  status: string;
  color: string;
}

const AppStatus: React.FC<AppStatusProps> = ({ name, status, color }) => (
  <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
    <div className={`w-3 h-3 ${color} rounded-full mx-auto mb-2`}></div>
    <p className="text-sm font-medium text-white">{name}</p>
    <p className="text-xs text-gray-300">{status}</p>
  </div>
);

interface StatusDotProps {
  color: string;
  label: string;
}

const StatusDot: React.FC<StatusDotProps> = ({ color, label }) => (
  <div className="flex items-center space-x-1">
    <div className={`w-2 h-2 ${color} rounded-full`}></div>
    <span className="text-xs text-gray-600">{label}</span>
  </div>
);

export default LoginPage;