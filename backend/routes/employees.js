const express = require("express");
const router = express.Router();
const employeesController = require("../controllers/employeesController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const {
  validateEmployee,
  validatePasswordReset,
} = require("../middleware/validation");

// All employee management routes require authentication and admin/manager role
router.use(authenticateToken);
router.use(authorizeRoles("super_admin", "warehouse_manager"));

// @route   GET /api/v1/employees/stats
// @desc    Get employee statistics
// @access  Private (Admin/Manager only)
router.get("/stats", employeesController.getEmployeeStats);

// @route   GET /api/v1/employees
// @desc    Get all employees with pagination and filters
// @access  Private (Admin/Manager only)
router.get("/", employeesController.getAllEmployees);

// @route   GET /api/v1/employees/:id
// @desc    Get employee by ID
// @access  Private (Admin/Manager only)
router.get("/:id", employeesController.getEmployee);

// @route   POST /api/v1/employees
// @desc    Create new employee
// @access  Private (Admin/Manager only)
router.post("/", validateEmployee, employeesController.createEmployee);

// @route   PUT /api/v1/employees/:id
// @desc    Update employee
// @access  Private (Admin/Manager only)
router.put("/:id", employeesController.updateEmployee);

// @route   PUT /api/v1/employees/:id/reset-password
// @desc    Reset employee password
// @access  Private (Admin/Manager only)
router.put(
  "/:id/reset-password",
  validatePasswordReset,
  employeesController.resetPassword
);

// @route   DELETE /api/v1/employees/:id
// @desc    Delete/Deactivate employee
// @access  Private (Admin/Manager only)
router.delete("/:id", employeesController.deleteEmployee);

module.exports = router;
