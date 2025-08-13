import React, { useState } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Warehouse, LogIn, User, Shield, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { login, loading } = useAuth();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }

    const success = await login(credentials.username, credentials.password);
    if (!success) {
      setError('Invalid credentials. Please try again.');
    }
  };

  const handleDemoLogin = (username: string) => {
    setCredentials({ username, password: 'password' });
  };

  const demoAccounts = [
    {
      username: 'admin',
      role: 'Super Administrator',
      description: 'Full access to all features',
      icon: <Shield className="h-4 w-4" />
    },
    {
      username: 'warehouse_manager',
      role: 'Warehouse Manager',
      description: 'Manage warehouse operations and staff',
      icon: <Warehouse className="h-4 w-4" />
    },
    {
      username: 'inventory_manager',
      role: 'Inventory Manager',
      description: 'Manage stock levels and inventory',
      icon: <User className="h-4 w-4" />
    },
    {
      username: 'qc_controller',
      role: 'Quality Controller',
      description: 'Quality control and inspection',
      icon: <User className="h-4 w-4" />
    },
    {
      username: 'production_supervisor',
      role: 'Production Supervisor',
      description: 'Oversee production activities',
      icon: <User className="h-4 w-4" />
    },
    {
      username: 'operator',
      role: 'Warehouse Operator',
      description: 'Basic warehouse operations',
      icon: <User className="h-4 w-4" />
    },
    {
      username: 'viewer',
      role: 'Report Viewer',
      description: 'View-only access to reports',
      icon: <User className="h-4 w-4" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Warehouse className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">AI Stock Management</CardTitle>
                <CardDescription>Warehouse Management System</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  disabled={loading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Demo Mode</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
            >
              {showDemoAccounts ? 'Hide' : 'Show'} Demo Accounts
            </Button>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        {showDemoAccounts && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Demo Accounts</CardTitle>
              <CardDescription>
                Click on any role to quickly sign in. Default password: "password"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoAccounts.map((account) => (
                  <div
                    key={account.username}
                    onClick={() => handleDemoLogin(account.username)}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-md">
                        {account.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{account.role}</div>
                        <div className="text-xs text-gray-600 mt-1">{account.description}</div>
                        <div className="text-xs text-blue-600 mt-1">@{account.username}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This is a demo environment. Each role has different permissions and will show different parts of the application.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Login;
