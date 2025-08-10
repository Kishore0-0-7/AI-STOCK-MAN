const { executeQuery } = require("../config/db");

const billsController = {
  // Get all bills
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = (page - 1) * limit;
      const status = req.query.status || "";

      let whereClause = "WHERE 1=1";
      let params = [];

      if (status) {
        whereClause += " AND b.status = ?";
        params.push(status);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM bills b ${whereClause}`;
      const countResult = await executeQuery(countQuery, params);
      const total = countResult[0].total;

      // Get bills with supplier info
      const billsQuery = `
        SELECT 
          b.*,
          s.name as supplier_name,
          s.email as supplier_email,
          COUNT(bi.id) as item_count
        FROM bills b
        LEFT JOIN suppliers s ON b.supplier_id = s.id
        LEFT JOIN bill_items bi ON b.id = bi.bill_id
        ${whereClause}
        GROUP BY b.id
        ORDER BY b.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const bills = await executeQuery(billsQuery, [...params, limit, offset]);

      res.json({
        bills: bills.map((bill) => ({
          id: bill.id,
          billNumber: `BILL-${String(bill.id).padStart(6, "0")}`,
          supplier: {
            id: bill.supplier_id,
            name: bill.supplier_name,
            email: bill.supplier_email,
          },
          status: bill.status,
          subtotal: parseFloat(bill.subtotal || 0),
          taxAmount: parseFloat(bill.tax_amount || 0),
          totalAmount: parseFloat(bill.total_amount || 0),
          itemCount: bill.item_count,
          paymentMethod: bill.payment_method,
          notes: bill.notes,
          createdAt: bill.created_at,
          updatedAt: bill.updated_at,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching bills:", error);
      res.status(500).json({ error: "Failed to fetch bills" });
    }
  },

  // Get single bill with items
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      // Get bill details
      const billQuery = `
        SELECT 
          b.*,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          c.address as customer_address
        FROM bills b
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE b.id = ?
      `;

      const billResult = await executeQuery(billQuery, [id]);

      if (billResult.length === 0) {
        return res.status(404).json({ error: "Bill not found" });
      }

      const bill = billResult[0];

      // Get bill items
      const itemsQuery = `
        SELECT 
          bi.*,
          p.name as product_name,
          p.sku as product_sku,
          p.category as product_category
        FROM bill_items bi
        LEFT JOIN products p ON bi.product_id = p.id
        WHERE bi.bill_id = ?
        ORDER BY p.name ASC
      `;

      const items = await executeQuery(itemsQuery, [id]);

      res.json({
        id: bill.id,
        billNumber: `BILL-${String(bill.id).padStart(6, "0")}`,
        customer: {
          id: bill.customer_id,
          name: bill.customer_name,
          email: bill.customer_email,
          phone: bill.customer_phone,
          address: bill.customer_address,
        },
        status: bill.status,
        subtotal: parseFloat(bill.subtotal || 0),
        taxAmount: parseFloat(bill.tax_amount || 0),
        totalAmount: parseFloat(bill.total_amount || 0),
        paymentMethod: bill.payment_method,
        notes: bill.notes,
        items: items.map((item) => ({
          id: item.id,
          product: {
            id: item.product_id,
            name: item.product_name,
            sku: item.product_sku,
            category: item.product_category,
          },
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price || 0),
          totalPrice: parseFloat(item.total_price || 0),
          discount: parseFloat(item.discount || 0),
        })),
        createdAt: bill.created_at,
        updatedAt: bill.updated_at,
      });
    } catch (error) {
      console.error("Error fetching bill:", error);
      res.status(500).json({ error: "Failed to fetch bill" });
    }
  },

  // Create new bill
  create: async (req, res) => {
    try {
      const { customerId, items, paymentMethod, notes, taxRate = 0 } = req.body;

      // Validate required fields
      if (
        !customerId ||
        !items ||
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res
          .status(400)
          .json({ error: "Customer ID and items are required" });
      }

      // Validate customer exists
      const customer = await executeQuery(
        "SELECT id, name FROM customers WHERE id = ?",
        [customerId]
      );
      if (customer.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Calculate totals
      let subtotal = 0;
      const validatedItems = [];

      for (const item of items) {
        if (!item.productId || !item.quantity || !item.unitPrice) {
          return res
            .status(400)
            .json({
              error: "Each item must have productId, quantity, and unitPrice",
            });
        }

        // Validate product exists and has sufficient stock
        const product = await executeQuery(
          "SELECT id, name, stock_quantity FROM products WHERE id = ?",
          [item.productId]
        );
        if (product.length === 0) {
          return res
            .status(400)
            .json({ error: `Product with ID ${item.productId} not found` });
        }

        const quantity = parseInt(item.quantity);
        const unitPrice = parseFloat(item.unitPrice);
        const discount = parseFloat(item.discount || 0);
        const itemTotal = quantity * unitPrice - discount;

        // Check stock availability
        if (product[0].stock_quantity < quantity) {
          return res.status(400).json({
            error: `Insufficient stock for ${product[0].name}. Available: ${product[0].stock_quantity}, Requested: ${quantity}`,
          });
        }

        subtotal += itemTotal;

        validatedItems.push({
          productId: item.productId,
          quantity,
          unitPrice,
          discount,
          totalPrice: itemTotal,
        });
      }

      const taxAmount = subtotal * (parseFloat(taxRate) / 100);
      const totalAmount = subtotal + taxAmount;

      // Create bill
      const billQuery = `
        INSERT INTO bills (customer_id, subtotal, tax_amount, total_amount, payment_method, status, notes)
        VALUES (?, ?, ?, ?, ?, 'paid', ?)
      `;

      const billResult = await executeQuery(billQuery, [
        customerId,
        subtotal,
        taxAmount,
        totalAmount,
        paymentMethod,
        notes,
      ]);
      const billId = billResult.insertId;

      // Create bill items and update stock
      for (const item of validatedItems) {
        // Create bill item
        await executeQuery(
          `
          INSERT INTO bill_items (bill_id, product_id, quantity, unit_price, discount, total_price)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
          [
            billId,
            item.productId,
            item.quantity,
            item.unitPrice,
            item.discount,
            item.totalPrice,
          ]
        );

        // Update product stock
        await executeQuery(
          `
          UPDATE products 
          SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
          [item.quantity, item.productId]
        );
      }

      res.status(201).json({
        message: "Bill created successfully",
        billId,
        billNumber: `BILL-${String(billId).padStart(6, "0")}`,
        totalAmount,
      });
    } catch (error) {
      console.error("Error creating bill:", error);
      res.status(500).json({ error: "Failed to create bill" });
    }
  },

  // Update bill status
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, paymentMethod, notes } = req.body;

      const validStatuses = ["pending", "paid", "cancelled"];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          error: "Valid status is required",
          validStatuses,
        });
      }

      // Check if bill exists
      const existingBill = await executeQuery(
        "SELECT id, status FROM bills WHERE id = ?",
        [id]
      );
      if (existingBill.length === 0) {
        return res.status(404).json({ error: "Bill not found" });
      }

      let updateQuery =
        "UPDATE bills SET status = ?, updated_at = CURRENT_TIMESTAMP";
      let params = [status];

      if (paymentMethod) {
        updateQuery += ", payment_method = ?";
        params.push(paymentMethod);
      }

      if (notes !== undefined) {
        updateQuery += ", notes = ?";
        params.push(notes);
      }

      updateQuery += " WHERE id = ?";
      params.push(id);

      await executeQuery(updateQuery, params);

      res.json({
        message: "Bill status updated successfully",
        billId: parseInt(id),
        newStatus: status,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating bill status:", error);
      res.status(500).json({ error: "Failed to update bill status" });
    }
  },

  // Get bill statistics
  getStats: async (req, res) => {
    try {
      const period = req.query.period || "30"; // days

      const queries = {
        total: `SELECT COUNT(*) as count FROM bills WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${period} DAY)`,
        paid: `SELECT COUNT(*) as count FROM bills WHERE status = 'paid' AND created_at >= DATE_SUB(NOW(), INTERVAL ${period} DAY)`,
        pending: `SELECT COUNT(*) as count FROM bills WHERE status = 'pending' AND created_at >= DATE_SUB(NOW(), INTERVAL ${period} DAY)`,
        totalRevenue: `SELECT COALESCE(SUM(total_amount), 0) as value FROM bills WHERE status = 'paid' AND created_at >= DATE_SUB(NOW(), INTERVAL ${period} DAY)`,
        averageBill: `SELECT COALESCE(AVG(total_amount), 0) as value FROM bills WHERE status = 'paid' AND created_at >= DATE_SUB(NOW(), INTERVAL ${period} DAY)`,
      };

      const [total, paid, pending, totalRevenue, averageBill] =
        await Promise.all([
          executeQuery(queries.total),
          executeQuery(queries.paid),
          executeQuery(queries.pending),
          executeQuery(queries.totalRevenue),
          executeQuery(queries.averageBill),
        ]);

      // Get daily sales
      const dailySales = await executeQuery(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as bill_count,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM bills 
        WHERE status = 'paid' AND created_at >= DATE_SUB(NOW(), INTERVAL ${period} DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `);

      // Get top selling products
      const topProducts = await executeQuery(`
        SELECT 
          p.name,
          p.sku,
          SUM(bi.quantity) as total_sold,
          SUM(bi.total_price) as total_revenue
        FROM bill_items bi
        JOIN products p ON bi.product_id = p.id
        JOIN bills b ON bi.bill_id = b.id
        WHERE b.status = 'paid' AND b.created_at >= DATE_SUB(NOW(), INTERVAL ${period} DAY)
        GROUP BY p.id, p.name, p.sku
        ORDER BY total_sold DESC
        LIMIT 10
      `);

      res.json({
        period: `${period} days`,
        summary: {
          totalBills: total[0].count,
          paidBills: paid[0].count,
          pendingBills: pending[0].count,
          totalRevenue: parseFloat(totalRevenue[0].value || 0),
          averageBill: parseFloat(averageBill[0].value || 0),
        },
        dailySales: dailySales.map((day) => ({
          date: day.date,
          billCount: day.bill_count,
          revenue: parseFloat(day.revenue || 0),
        })),
        topProducts: topProducts.map((product) => ({
          name: product.name,
          sku: product.sku,
          totalSold: product.total_sold,
          totalRevenue: parseFloat(product.total_revenue || 0),
        })),
      });
    } catch (error) {
      console.error("Error fetching bill stats:", error);
      res.status(500).json({ error: "Failed to fetch bill statistics" });
    }
  },

  // Delete bill (only if pending)
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if bill exists and status
      const bill = await executeQuery(
        "SELECT id, status FROM bills WHERE id = ?",
        [id]
      );
      if (bill.length === 0) {
        return res.status(404).json({ error: "Bill not found" });
      }

      if (bill[0].status === "paid") {
        return res.status(400).json({
          error: "Cannot delete paid bills",
          currentStatus: bill[0].status,
        });
      }

      // If bill is being cancelled, restore stock quantities
      if (bill[0].status !== "cancelled") {
        const billItems = await executeQuery(
          "SELECT product_id, quantity FROM bill_items WHERE bill_id = ?",
          [id]
        );

        for (const item of billItems) {
          await executeQuery(
            `
            UPDATE products 
            SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
            [item.quantity, item.product_id]
          );
        }
      }

      // Delete bill items first (foreign key constraint)
      await executeQuery("DELETE FROM bill_items WHERE bill_id = ?", [id]);

      // Delete bill
      await executeQuery("DELETE FROM bills WHERE id = ?", [id]);

      res.json({ message: "Bill deleted successfully" });
    } catch (error) {
      console.error("Error deleting bill:", error);
      res.status(500).json({ error: "Failed to delete bill" });
    }
  },
};

module.exports = billsController;
