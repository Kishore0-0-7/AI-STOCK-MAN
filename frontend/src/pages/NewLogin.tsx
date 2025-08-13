import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Package,
  Eye,
  EyeOff,
  AlertCircle,
  Users,
  Shield,
  Settings,
  Truck,
  UserCog,
  Clipboard,
  Building,
  Archive,
} from "lucide-react";
import { LoginCredentials } from "@/services/authApi";

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await login(credentials);
      // Navigation will happen via useEffect when isAuthenticated changes
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (email: string) => {
    setCredentials({
      email,
      password: "admin123", // All demo accounts use the same password
    });
  };

  // Demo accounts with role descriptions
  const demoAccounts = [
    {
      email: "admin@warehouse.com",
      role: "Super Admin",
      description: "Full system access and user management",
      icon: Shield,
      color: "bg-red-500",
    },
    {
      email: "manager@warehouse.com",
      role: "Warehouse Manager",
      description: "Complete warehouse operations management",
      icon: Building,
      color: "bg-blue-500",
    },
    {
      email: "inventory@warehouse.com",
      role: "Inventory Manager",
      description: "Stock management and inventory control",
      icon: Archive,
      color: "bg-green-500",
    },
    {
      email: "qc@warehouse.com",
      role: "Quality Controller",
      description: "Quality control and inspection processes",
      icon: Clipboard,
      color: "bg-purple-500",
    },
    {
      email: "production@warehouse.com",
      role: "Production Supervisor",
      description: "Production planning and monitoring",
      icon: Settings,
      color: "bg-orange-500",
    },
    {
      email: "logistics@warehouse.com",
      role: "Logistics Coordinator",
      description: "Shipping and logistics management",
      icon: Truck,
      color: "bg-cyan-500",
    },
    {
      email: "purchase@warehouse.com",
      role: "Purchase Manager",
      description: "Supplier management and procurement",
      icon: UserCog,
      color: "bg-indigo-500",
    },
    {
      email: "keeper@warehouse.com",
      role: "Store Keeper",
      description: "Basic stock operations and storage",
      icon: Package,
      color: "bg-amber-500",
    },
    {
      email: "viewer@warehouse.com",
      role: "Viewer",
      description: "Read-only access to warehouse data",
      icon: Eye,
      color: "bg-gray-500",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                AI Stock Management
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Warehouse Management System
              </p>
            </div>
          </div>

          {/* Login Form */}
          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold">
                Sign in to your account
              </CardTitle>
              <CardDescription>
                Enter your credentials to access the warehouse management system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@warehouse.com"
                    value={credentials.email}
                    onChange={(e) =>
                      setCredentials({ ...credentials, email: e.target.value })
                    }
                    className="h-11"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={credentials.password}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          password: e.target.value,
                        })
                      }
                      className="h-11 pr-10"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Use demo accounts to explore the system
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Demo Accounts */}
      <div className="hidden lg:flex lg:flex-1 bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col w-full p-8 xl:p-12">
          <div className="flex-1">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Demo Accounts
                </h2>
                <p className="text-muted-foreground">
                  Click on any account to quickly sign in and explore role-based
                  features
                </p>
                <div className="mt-3">
                  <Badge variant="secondary" className="text-xs">
                    Password for all accounts: admin123
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid gap-3 max-h-[70vh] overflow-y-auto pr-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => handleDemoLogin(account.email)}
                    className="p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 text-left group"
                    disabled={isLoading}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${account.color} flex items-center justify-center flex-shrink-0`}
                      >
                        <account.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">
                            {account.role}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {account.email}
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {account.description}
                        </p>
                      </div>
                      <Users className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
