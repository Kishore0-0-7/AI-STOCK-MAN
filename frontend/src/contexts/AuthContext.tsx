import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  authApi,
  User as ApiUser,
  LoginCredentials,
  getAuthToken,
  removeAuthToken,
} from "@/services/authApi";

// Role-based permissions system
export enum UserRole {
  SUPER_ADMIN = "super_admin",
  WAREHOUSE_MANAGER = "warehouse_manager",
  INVENTORY_MANAGER = "inventory_manager",
  QUALITY_CONTROLLER = "quality_controller",
  PRODUCTION_SUPERVISOR = "production_supervisor",
  LOGISTICS_COORDINATOR = "logistics_coordinator",
  PURCHASE_MANAGER = "purchase_manager",
  STORE_KEEPER = "store_keeper",
  VIEWER = "viewer",
}

export enum Permission {
  // Product Management
  VIEW_PRODUCTS = "view_products",
  CREATE_PRODUCT = "create_product",
  EDIT_PRODUCT = "edit_product",
  DELETE_PRODUCT = "delete_product",

  // Stock Management
  VIEW_STOCK = "view_stock",
  MANAGE_STOCK = "manage_stock",
  CREATE_STOCK_OUT_REQUEST = "create_stock_out_request",
  APPROVE_STOCK_OUT = "approve_stock_out",

  // Supplier Management
  VIEW_SUPPLIERS = "view_suppliers",
  MANAGE_SUPPLIERS = "manage_suppliers",

  // Inbound Operations
  VIEW_INBOUND = "view_inbound",
  MANAGE_INBOUND = "manage_inbound",

  // Outbound Operations
  VIEW_OUTBOUND = "view_outbound",
  MANAGE_OUTBOUND = "manage_outbound",

  // Quality Control
  VIEW_QC = "view_qc",
  MANAGE_QC = "manage_qc",

  // Production
  VIEW_PRODUCTION_CALCULATOR = "view_production_calculator",
  MANAGE_PRODUCTION = "manage_production",

  // Storage
  VIEW_STORAGE_UTILIZATION = "view_storage_utilization",
  MANAGE_STORAGE = "manage_storage",

  // Alerts & Reports
  VIEW_ALERTS = "view_alerts",
  MANAGE_ALERTS = "manage_alerts",
  VIEW_REPORTS = "view_reports",
  GENERATE_REPORTS = "generate_reports",

  // User Management
  VIEW_EMPLOYEES = "view_employees",
  MANAGE_EMPLOYEES = "manage_employees",

  // System Settings
  VIEW_SETTINGS = "view_settings",
  MANAGE_SETTINGS = "manage_settings",
}

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission), // All permissions

  [UserRole.WAREHOUSE_MANAGER]: [
    Permission.VIEW_PRODUCTS,
    Permission.CREATE_PRODUCT,
    Permission.EDIT_PRODUCT,
    Permission.VIEW_STOCK,
    Permission.MANAGE_STOCK,
    Permission.APPROVE_STOCK_OUT,
    Permission.VIEW_SUPPLIERS,
    Permission.MANAGE_SUPPLIERS,
    Permission.VIEW_INBOUND,
    Permission.MANAGE_INBOUND,
    Permission.VIEW_OUTBOUND,
    Permission.MANAGE_OUTBOUND,
    Permission.VIEW_QC,
    Permission.MANAGE_QC,
    Permission.VIEW_PRODUCTION_CALCULATOR,
    Permission.MANAGE_PRODUCTION,
    Permission.VIEW_STORAGE_UTILIZATION,
    Permission.MANAGE_STORAGE,
    Permission.VIEW_ALERTS,
    Permission.MANAGE_ALERTS,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_EMPLOYEES,
    Permission.VIEW_SETTINGS,
  ],

  [UserRole.INVENTORY_MANAGER]: [
    Permission.VIEW_PRODUCTS,
    Permission.CREATE_PRODUCT,
    Permission.EDIT_PRODUCT,
    Permission.VIEW_STOCK,
    Permission.MANAGE_STOCK,
    Permission.CREATE_STOCK_OUT_REQUEST,
    Permission.VIEW_SUPPLIERS,
    Permission.VIEW_INBOUND,
    Permission.MANAGE_INBOUND,
    Permission.VIEW_STORAGE_UTILIZATION,
    Permission.VIEW_ALERTS,
    Permission.MANAGE_ALERTS,
    Permission.VIEW_REPORTS,
  ],

  [UserRole.QUALITY_CONTROLLER]: [
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_STOCK,
    Permission.VIEW_INBOUND,
    Permission.VIEW_QC,
    Permission.MANAGE_QC,
    Permission.VIEW_ALERTS,
    Permission.VIEW_REPORTS,
  ],

  [UserRole.PRODUCTION_SUPERVISOR]: [
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_STOCK,
    Permission.VIEW_PRODUCTION_CALCULATOR,
    Permission.MANAGE_PRODUCTION,
    Permission.VIEW_QC,
    Permission.VIEW_ALERTS,
    Permission.VIEW_REPORTS,
  ],

  [UserRole.LOGISTICS_COORDINATOR]: [
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_STOCK,
    Permission.VIEW_SUPPLIERS,
    Permission.VIEW_INBOUND,
    Permission.VIEW_OUTBOUND,
    Permission.MANAGE_OUTBOUND,
    Permission.VIEW_STORAGE_UTILIZATION,
    Permission.VIEW_ALERTS,
    Permission.VIEW_REPORTS,
  ],

  [UserRole.PURCHASE_MANAGER]: [
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_STOCK,
    Permission.VIEW_SUPPLIERS,
    Permission.MANAGE_SUPPLIERS,
    Permission.VIEW_INBOUND,
    Permission.MANAGE_INBOUND,
    Permission.VIEW_ALERTS,
    Permission.VIEW_REPORTS,
  ],

  [UserRole.STORE_KEEPER]: [
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_STOCK,
    Permission.CREATE_STOCK_OUT_REQUEST,
    Permission.VIEW_INBOUND,
    Permission.VIEW_OUTBOUND,
    Permission.VIEW_STORAGE_UTILIZATION,
    Permission.VIEW_ALERTS,
  ],

  [UserRole.VIEWER]: [
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_STOCK,
    Permission.VIEW_SUPPLIERS,
    Permission.VIEW_INBOUND,
    Permission.VIEW_OUTBOUND,
    Permission.VIEW_QC,
    Permission.VIEW_PRODUCTION_CALCULATOR,
    Permission.VIEW_STORAGE_UTILIZATION,
    Permission.VIEW_ALERTS,
    Permission.VIEW_REPORTS,
  ],
};

// Enhanced User type
interface User extends ApiUser {
  permissions?: Permission[];
}

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          const userWithPermissions = {
            ...userData,
            permissions: ROLE_PERMISSIONS[userData.role as UserRole] || [],
          };
          setUser(userWithPermissions);
        } catch (error) {
          console.error("Auth initialization failed:", error);
          removeAuthToken();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setLoading(true);
      const response = await authApi.login(credentials);
      const userWithPermissions = {
        ...response.user,
        permissions: ROLE_PERMISSIONS[response.user.role as UserRole] || [],
      };
      setUser(userWithPermissions);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      removeAuthToken();
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions?.includes(permission) || false;
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.some((permission) => hasPermission(permission));
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role as UserRole);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    hasPermission,
    hasAnyPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
