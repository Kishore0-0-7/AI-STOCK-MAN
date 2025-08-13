const bcrypt = require("bcryptjs");
const { pool: db } = require("../config/database");

// Get all employees (admin only)
const getAllEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "",
      department = "",
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = "WHERE 1=1";
    const params = [];

    if (search) {
      whereClause += " AND (full_name LIKE ? OR email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += " AND role = ?";
      params.push(role);
    }

    if (department) {
      whereClause += " AND department = ?";
      params.push(department);
    }

    // Get total count
    const [countResult] = await db.execute(
      `
      SELECT COUNT(*) as total FROM users ${whereClause}
    `,
      params
    );

    const total = countResult[0].total;

    // Get employees with pagination
    const limitInt = parseInt(limit);
    const offsetInt = parseInt(offset);

    // Use string interpolation for LIMIT and OFFSET to avoid parameter issues
    const [employees] = await db.execute(
      `
      SELECT 
        id, email, full_name, role, department, phone, avatar, 
        status, created_at, updated_at, last_login
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limitInt} OFFSET ${offsetInt}
    `,
      params
    );

    res.json({
      success: true,
      data: {
        employees: employees.map((emp) => ({
          id: emp.id,
          email: emp.email,
          fullName: emp.full_name,
          role: emp.role,
          department: emp.department,
          phone: emp.phone,
          avatar: emp.avatar,
          status: emp.status,
          createdAt: emp.created_at,
          updatedAt: emp.updated_at,
          lastLogin: emp.last_login,
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get employee by ID
const getEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const [employees] = await db.execute(
      `
      SELECT 
        id, email, full_name, role, department, phone, avatar, 
        status, created_at, updated_at, last_login
      FROM users 
      WHERE id = ?
    `,
      [id]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const employee = employees[0];

    res.json({
      success: true,
      data: {
        id: employee.id,
        email: employee.email,
        fullName: employee.full_name,
        role: employee.role,
        department: employee.department,
        phone: employee.phone,
        avatar: employee.avatar,
        status: employee.status,
        createdAt: employee.created_at,
        updatedAt: employee.updated_at,
        lastLogin: employee.last_login,
      },
    });
  } catch (error) {
    console.error("Get employee error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Create new employee
const createEmployee = async (req, res) => {
  try {
    const {
      email,
      fullName,
      role,
      department,
      phone,
      password = "password123",
    } = req.body;

    // Validate required fields
    if (!email || !fullName || !role || !department) {
      return res.status(400).json({
        success: false,
        message: "Email, full name, role, and department are required",
      });
    }

    // Check if email already exists
    const [existingUsers] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create employee
    const [result] = await db.execute(
      `
      INSERT INTO users (email, password, full_name, role, department, phone, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
    `,
      [email, hashedPassword, fullName, role, department, phone]
    );

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: {
        id: result.insertId,
        email,
        fullName,
        role,
        department,
        phone,
        status: "active",
      },
    });
  } catch (error) {
    console.error("Create employee error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, fullName, role, department, phone, status } = req.body;

    // Check if employee exists
    const [employees] = await db.execute("SELECT id FROM users WHERE id = ?", [
      id,
    ]);

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check if email already exists (excluding current employee)
    if (email) {
      const [existingUsers] = await db.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, id]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (email) {
      updates.push("email = ?");
      params.push(email);
    }
    if (fullName) {
      updates.push("full_name = ?");
      params.push(fullName);
    }
    if (role) {
      updates.push("role = ?");
      params.push(role);
    }
    if (department) {
      updates.push("department = ?");
      params.push(department);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      params.push(phone);
    }
    if (status) {
      updates.push("status = ?");
      params.push(status);
    }

    updates.push("updated_at = NOW()");
    params.push(id);

    await db.execute(
      `
      UPDATE users SET ${updates.join(", ")} WHERE id = ?
    `,
      params
    );

    res.json({
      success: true,
      message: "Employee updated successfully",
    });
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete/Deactivate employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    const [employees] = await db.execute("SELECT id FROM users WHERE id = ?", [
      id,
    ]);

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Soft delete by setting status to inactive
    await db.execute(
      `
      UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id = ?
    `,
      [id]
    );

    res.json({
      success: true,
      message: "Employee deactivated successfully",
    });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Reset employee password
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword = "password123" } = req.body;

    // Check if employee exists
    const [employees] = await db.execute("SELECT id FROM users WHERE id = ?", [
      id,
    ]);

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.execute(
      `
      UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?
    `,
      [hashedPassword, id]
    );

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get employee statistics
const getEmployeeStats = async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        COUNT(DISTINCT role) as roles,
        COUNT(DISTINCT department) as departments
      FROM users
    `);

    const [roleStats] = await db.execute(`
      SELECT role, COUNT(*) as count
      FROM users 
      WHERE status = 'active'
      GROUP BY role
    `);

    const [departmentStats] = await db.execute(`
      SELECT department, COUNT(*) as count
      FROM users 
      WHERE status = 'active'
      GROUP BY department
    `);

    res.json({
      success: true,
      data: {
        overview: stats[0],
        roleDistribution: roleStats,
        departmentDistribution: departmentStats,
      },
    });
  } catch (error) {
    console.error("Get employee stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  resetPassword,
  getEmployeeStats,
};
