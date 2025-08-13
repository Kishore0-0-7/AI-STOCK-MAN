const jwt = require("jsonwebtoken");
const { pool: db } = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if user still exists and is active
    const [users] = await db.execute(
      'SELECT id, email, full_name, role, department, status FROM users WHERE id = ? AND status = "active"',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    req.user = {
      id: users[0].id,
      email: users[0].email,
      fullName: users[0].full_name,
      role: users[0].role,
      department: users[0].department,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Role-based authorization middleware
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

// Permission-based authorization middleware
const authorizePermissions = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Define role permissions (same as frontend)
    const rolePermissions = {
      super_admin: ["*"], // Super admin has all permissions
      warehouse_manager: [
        "view_dashboard",
        "view_stock",
        "manage_stock",
        "view_inbound",
        "manage_inbound",
        "view_outbound",
        "manage_outbound",
        "view_products",
        "manage_products",
        "view_suppliers",
        "manage_suppliers",
        "view_alerts",
        "view_qc",
        "manage_qc",
        "view_production_calculator",
        "manage_production",
        "view_storage_utilization",
        "manage_storage",
        "create_stock_out_request",
        "approve_stock_out_request",
        "manage_settings",
        "manage_employees",
      ],
      inventory_manager: [
        "view_dashboard",
        "view_stock",
        "manage_stock",
        "view_inbound",
        "manage_inbound",
        "view_products",
        "manage_products",
        "view_suppliers",
        "view_alerts",
        "view_storage_utilization",
        "create_stock_out_request",
      ],
      quality_controller: [
        "view_dashboard",
        "view_stock",
        "view_qc",
        "manage_qc",
        "view_products",
        "view_alerts",
      ],
      production_supervisor: [
        "view_dashboard",
        "view_stock",
        "view_production_calculator",
        "manage_production",
        "view_products",
        "view_alerts",
      ],
      logistics_coordinator: [
        "view_dashboard",
        "view_stock",
        "view_inbound",
        "view_outbound",
        "manage_outbound",
        "view_suppliers",
        "view_alerts",
        "view_storage_utilization",
      ],
      purchase_manager: [
        "view_dashboard",
        "view_stock",
        "view_inbound",
        "manage_inbound",
        "view_suppliers",
        "manage_suppliers",
        "view_alerts",
      ],
      store_keeper: [
        "view_dashboard",
        "view_stock",
        "view_products",
        "view_storage_utilization",
        "create_stock_out_request",
      ],
      viewer: ["view_dashboard", "view_stock", "view_products"],
    };

    const userPermissions = rolePermissions[req.user.role] || [];

    // Super admin has access to everything
    if (userPermissions.includes("*")) {
      return next();
    }

    // Check if user has required permissions
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizePermissions,
};
