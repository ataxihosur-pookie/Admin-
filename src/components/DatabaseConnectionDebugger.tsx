import React, { useState } from 'react';
import { Database, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const DatabaseConnectionDebugger: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDatabaseConnection = async () => {
    setLoading(true);
    try {
      console.log('🔍 Testing current database connection...');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      console.log('🔗 Environment Variables:');
      console.log('   VITE_SUPABASE_URL:', supabaseUrl);
      console.log('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
      console.log('   VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Present' : 'Missing');
      
      // Test with ANON KEY
      const anonResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=count`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      });
      
      const anonResult = await anonResponse.json();
      console.log('📊 ANON KEY test result:', anonResult);
      
      // Test with SERVICE ROLE KEY
      const serviceResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=*`, {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        }
      });
      
      const serviceResult = await serviceResponse.json();
      console.log('📊 SERVICE ROLE KEY test result:', serviceResult);
      
      setTestResults({
        url: supabaseUrl,
        anonKeyWorks: anonResponse.ok,
        serviceKeyWorks: serviceResponse.ok,
        totalUsers: serviceResult.length || 0,
        users: serviceResult.slice(0, 5), // Show first 5 users
        allRoles: serviceResult.map((u: any) => u.role),
        allEmails: serviceResult.map((u: any) => u.email)
      });
      
    } catch (error) {
      console.error('❌ Database test failed:', error);
      setTestResults({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Database Connection Debugger</h3>
            <p className="text-sm text-gray-600">Verify which database your app is connected to</p>
          </div>
        </div>
        <button
          onClick={testDatabaseConnection}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Test Connection</span>
        </button>
      </div>

      {/* Environment Variables */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Environment Variables</h4>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm font-mono">
          <div>
            <span className="text-gray-600">VITE_SUPABASE_URL:</span>
            <span className="ml-2 text-blue-600">{import.meta.env.VITE_SUPABASE_URL || 'Not set'}</span>
          </div>
          <div>
            <span className="text-gray-600">VITE_SUPABASE_ANON_KEY:</span>
            <span className="ml-2 text-green-600">
              {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">VITE_SUPABASE_SERVICE_ROLE_KEY:</span>
            <span className="ml-2 text-purple-600">
              {import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing'}
            </span>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900">Connection Test Results</h4>
          
          {testResults.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 font-medium">Connection Failed</span>
              </div>
              <p className="text-red-600 text-sm mt-2">{testResults.error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connection Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${
                  testResults.anonKeyWorks 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    {testResults.anonKeyWorks ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium">ANON KEY</span>
                  </div>
                  <p className="text-sm mt-1">
                    {testResults.anonKeyWorks ? 'Working' : 'Failed'}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  testResults.serviceKeyWorks 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    {testResults.serviceKeyWorks ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium">SERVICE ROLE KEY</span>
                  </div>
                  <p className="text-sm mt-1">
                    {testResults.serviceKeyWorks ? 'Working' : 'Failed'}
                  </p>
                </div>
              </div>

              {/* Database Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">Database Information</h5>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-blue-700">Database URL:</span>
                    <span className="ml-2 font-mono text-blue-800">{testResults.url}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Total Users Found:</span>
                    <span className="ml-2 font-bold text-blue-800">{testResults.totalUsers}</span>
                  </div>
                </div>
              </div>

              {/* Users Found */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Users in Database</h5>
                
                {testResults.totalUsers === 0 ? (
                  <p className="text-gray-600 text-sm">No users found in database</p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Roles Found:</span>
                        <div className="mt-1">
                          {testResults.allRoles.map((role: string, index: number) => (
                            <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-700">Role Distribution:</span>
                        <div className="mt-1 text-sm text-gray-600">
                          {Object.entries(testResults.allRoles.reduce((acc: any, role: string) => {
                            acc[role] = (acc[role] || 0) + 1;
                            return acc;
                          }, {})).map(([role, count]) => (
                            <div key={role}>
                              {role}: {count as number}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-700">Sample Users:</span>
                      <div className="mt-2 space-y-2">
                        {testResults.users.map((user: any, index: number) => (
                          <div key={index} className="bg-white p-3 rounded border text-sm">
                            <div><span className="font-medium">Name:</span> {user.full_name}</div>
                            <div><span className="font-medium">Email:</span> {user.email}</div>
                            <div><span className="font-medium">Role:</span> <span className="bg-gray-100 px-2 py-1 rounded">{user.role}</span></div>
                            <div><span className="font-medium">ID:</span> <span className="font-mono text-xs">{user.id}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Issue Diagnosis */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-yellow-900 mb-2">Issue Diagnosis</h5>
                    {testResults.totalUsers === 1 && testResults.allRoles.includes('admin') ? (
                      <div className="text-sm text-yellow-800 space-y-2">
                        <p><strong>Problem:</strong> Your app is connected to a database that only has 1 admin user.</p>
                        <p><strong>Expected:</strong> You showed a screenshot with 10 customers.</p>
                        <p><strong>Solution:</strong> You need to connect to the correct Supabase project that contains your customer data.</p>
                        <div className="mt-3 p-3 bg-yellow-100 rounded">
                          <p className="font-medium">Next Steps:</p>
                          <ol className="list-decimal list-inside text-sm mt-1 space-y-1">
                            <li>Check your Supabase dashboard URL in the screenshot</li>
                            <li>Verify you're using the correct project's SERVICE ROLE KEY</li>
                            <li>Update your .env file with the correct credentials</li>
                            <li>Click "Connect to Supabase" button to reconfigure</li>
                          </ol>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-yellow-800">
                        Unexpected database state. Please check your Supabase configuration.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseConnectionDebugger;