import React from "react";
import { useAuth, Permission, UserRole } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, LogOut } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredPermissions = [],
  requiredRole,
  requiredRoles = [],
  fallback,
  showAccessDenied = true,
}) => {
  const { user, hasPermission, hasAnyPermission, hasRole } = useAuth();

  if (!user) {
    return null; // This will be handled by the main app routing
  }

  // Check single permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return showAccessDenied ? (
      <AccessDeniedFallback
        message={`You need the "${requiredPermission}" permission to access this feature.`}
        userRole={user.role as UserRole}
      />
    ) : (
      fallback || null
    );
  }

  // Check multiple permissions (user needs ANY of these permissions)
  if (
    requiredPermissions.length > 0 &&
    !hasAnyPermission(requiredPermissions)
  ) {
    return showAccessDenied ? (
      <AccessDeniedFallback
        message="You don't have the required permissions to access this feature."
        userRole={user.role as UserRole}
      />
    ) : (
      fallback || null
    );
  }

  // Check single role
  if (requiredRole && !hasRole([requiredRole])) {
    return showAccessDenied ? (
      <AccessDeniedFallback
        message={`This feature requires "${requiredRole}" role.`}
        userRole={user.role as UserRole}
      />
    ) : (
      fallback || null
    );
  }

  // Check multiple roles (user needs ANY of these roles)
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return showAccessDenied ? (
      <AccessDeniedFallback
        message="Your role doesn't have access to this feature."
        userRole={user.role as UserRole}
      />
    ) : (
      fallback || null
    );
  }

  return <>{children}</>;
};

interface AccessDeniedFallbackProps {
  message: string;
  userRole: UserRole;
}

const AccessDeniedFallback: React.FC<AccessDeniedFallbackProps> = ({
  message,
  userRole,
}) => {
  const { logout } = useAuth();

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <Alert className="border-amber-200 bg-amber-50">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Access Restricted</h3>
                <p className="text-sm">{message}</p>
              </div>

              <div className="text-xs bg-white p-3 rounded border">
                <div className="font-medium mb-1">Your Current Role:</div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {userRole.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="text-xs"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Switch Account
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

// Utility component for conditional rendering based on permissions
interface ConditionalRenderProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  requiredPermission,
  requiredPermissions = [],
  requiredRole,
  requiredRoles = [],
  fallback = null,
}) => {
  const { hasPermission, hasAnyPermission, hasRole } = useAuth();

  // Check single permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (
    requiredPermissions.length > 0 &&
    !hasAnyPermission(requiredPermissions)
  ) {
    return <>{fallback}</>;
  }

  // Check single role
  if (requiredRole && !hasRole([requiredRole])) {
    return <>{fallback}</>;
  }

  // Check multiple roles
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
