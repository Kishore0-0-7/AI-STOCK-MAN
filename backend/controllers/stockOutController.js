const { pool: db } = require("../config/database");

// Get all stock out requests with filtering and pagination
const getStockOutRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "all",
      priority = "all",
      department = "all",
    } = req.query;

    const offset = (page - 1) * limit;

    // Simple query to test first
    const [requests] = await db.execute(
      "SELECT * FROM stock_out_requests ORDER BY created_at DESC LIMIT 10 OFFSET 0"
    );

    const [countResult] = await db.execute(
      "SELECT COUNT(*) as total FROM stock_out_requests"
    );
    const totalRequests = countResult[0].total;

    // Get items for each request
    const requestIds = requests.map((r) => r.id);
    let itemsData = [];

    if (requestIds.length > 0) {
      const placeholders = requestIds.map(() => "?").join(",");
      const [items] = await db.execute(
        `SELECT soi.*, p.sku as item_code FROM stock_out_items soi 
                 LEFT JOIN products p ON soi.product_id = p.id 
                 WHERE soi.request_id IN (${placeholders})`,
        requestIds
      );
      itemsData = items;
    }

    // Format the requests data
    const formattedRequests = requests.map((request) => {
      const requestItems = itemsData.filter(
        (item) => item.request_id === request.id
      );

      const items = requestItems.map((item) => ({
        id: item.id,
        itemCode: item.item_code || "",
        itemName: item.product_name,
        category: item.category,
        quantityRequested: item.quantity_requested,
        quantityAllocated: item.quantity_allocated,
        quantityDispatched: item.quantity_dispatched,
        unit: item.unit,
        status: item.status,
        priority: request.priority,
        requestDate: request.request_date,
        requiredDate: request.required_date,
        dispatchDate: item.dispatch_date,
        destination: request.destination,
        requestedBy: request.requested_by,
        estimatedValue: parseFloat(item.estimated_value || 0),
        trackingNumber: item.tracking_number,
        notes: request.notes,
      }));

      return {
        id: request.id,
        requestNumber: request.request_number,
        requestDate: request.request_date,
        requiredDate: request.required_date,
        requestedBy: request.requested_by,
        department: request.department,
        destination: request.destination,
        status: request.status,
        priority: request.priority,
        totalItems: items.length,
        totalValue: items.reduce((sum, item) => sum + item.estimatedValue, 0),
        items,
        approvedBy: request.approved_by,
        processedBy: request.processed_by,
        notes: request.notes,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
      };
    });

    res.json({
      success: true,
      data: {
        requests: formattedRequests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRequests / limit),
          totalRequests,
          hasNextPage: offset + formattedRequests.length < totalRequests,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching stock out requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock out requests",
      error: error.message,
    });
  }
};

// Get stock out metrics
const getMetrics = async (req, res) => {
  try {
    // Get today's requests count
    const [todayRequests] = await db.execute(`
            SELECT COUNT(*) as count
            FROM stock_out_requests 
            WHERE DATE(created_at) = CURDATE()
        `);

    // Get total items dispatched today
    const [itemsDispatched] = await db.execute(`
            SELECT 
                COALESCE(SUM(soi.quantity_dispatched), 0) as total_items,
                COALESCE(SUM(soi.estimated_value * soi.quantity_dispatched / soi.quantity_requested), 0) as total_value
            FROM stock_out_items soi
            JOIN stock_out_requests so ON soi.request_id = so.id
            WHERE DATE(soi.dispatch_date) = CURDATE() OR (soi.status = 'dispatched' AND DATE(so.updated_at) = CURDATE())
        `);

    // Get pending requests count
    const [pendingRequests] = await db.execute(`
            SELECT COUNT(*) as count
            FROM stock_out_requests 
            WHERE status IN ('submitted', 'approved', 'processing')
        `);

    // Calculate completion rate (completed vs total requests in last 30 days)
    const [completionData] = await db.execute(`
            SELECT 
                COUNT(*) as total_requests,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_requests
            FROM stock_out_requests 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);

    const completionRate =
      completionData[0].total_requests > 0
        ? (completionData[0].completed_requests /
            completionData[0].total_requests) *
          100
        : 0;

    // Calculate average processing time (in days)
    const [processingTime] = await db.execute(`
            SELECT AVG(DATEDIFF(updated_at, created_at)) as avg_days
            FROM stock_out_requests 
            WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);

    const metrics = {
      totalRequestsToday: todayRequests[0].count,
      totalItemsDispatched: itemsDispatched[0].total_items,
      totalValueDispatched: itemsDispatched[0].total_value,
      pendingRequests: pendingRequests[0].count,
      completionRate: Math.round(completionRate * 10) / 10,
      averageProcessingTime:
        Math.round((processingTime[0].avg_days || 0) * 10) / 10,
    };

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Error fetching stock out metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch metrics",
      error: error.message,
    });
  }
};

// Get dashboard analytics data
const getDashboardData = async (req, res) => {
  try {
    // Get category breakdown
    const [categoryBreakdown] = await db.execute(`
            SELECT 
                soi.category as name,
                SUM(soi.estimated_value) as value,
                COUNT(*) as count
            FROM stock_out_items soi
            JOIN stock_out_requests so ON soi.request_id = so.id
            WHERE so.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY soi.category
            ORDER BY value DESC
        `);

    // Get status distribution
    const [statusDistribution] = await db.execute(`
            SELECT 
                status as name,
                COUNT(*) as value,
                CASE status
                    WHEN 'completed' THEN '#10b981'
                    WHEN 'processing' THEN '#3b82f6'
                    WHEN 'approved' THEN '#8b5cf6'
                    WHEN 'submitted' THEN '#f59e0b'
                    WHEN 'cancelled' THEN '#ef4444'
                    ELSE '#6b7280'
                END as color
            FROM stock_out_requests
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY status
        `);

    // Get dispatch trends (last 7 days)
    const [dispatchTrends] = await db.execute(`
            SELECT 
                DATE(so.updated_at) as date,
                COUNT(DISTINCT soi.id) as dispatched,
                COALESCE(SUM(soi.estimated_value), 0) as value
            FROM stock_out_requests so
            LEFT JOIN stock_out_items soi ON so.id = soi.request_id AND soi.status = 'dispatched'
            WHERE so.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(so.updated_at)
            ORDER BY date
        `);

    // Get top destinations
    const [topDestinations] = await db.execute(`
            SELECT 
                destination as name,
                COUNT(*) as count,
                COALESCE(SUM(
                    (SELECT SUM(estimated_value) FROM stock_out_items WHERE request_id = so.id)
                ), 0) as value
            FROM stock_out_requests so
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY destination
            ORDER BY value DESC
            LIMIT 10
        `);

    const dashboardData = {
      categoryBreakdown,
      statusDistribution,
      dispatchTrends,
      topDestinations,
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
};

// Get request by ID
const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const [requests] = await db.execute(
      `
            SELECT 
                so.*,
                GROUP_CONCAT(
                    CONCAT(
                        soi.id, ':', p.sku, ':', soi.product_name, ':', 
                        soi.category, ':', soi.quantity_requested, ':', 
                        soi.quantity_allocated, ':', soi.quantity_dispatched, ':', 
                        soi.unit, ':', soi.status, ':', soi.estimated_value, ':', 
                        COALESCE(soi.tracking_number, ''), ':', 
                        COALESCE(soi.dispatch_date, '')
                    ) SEPARATOR '|'
                ) as items_data
            FROM stock_out_requests so
            LEFT JOIN stock_out_items soi ON so.id = soi.request_id
            LEFT JOIN products p ON soi.product_id = p.id
            WHERE so.id = ?
            GROUP BY so.id
        `,
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stock out request not found",
      });
    }

    const request = requests[0];
    const items = request.items_data
      ? request.items_data.split("|").map((itemData) => {
          const [
            itemId,
            itemCode,
            itemName,
            category,
            quantityRequested,
            quantityAllocated,
            quantityDispatched,
            unit,
            status,
            estimatedValue,
            trackingNumber,
            dispatchDate,
          ] = itemData.split(":");

          return {
            id: itemId,
            itemCode,
            itemName,
            category,
            quantityRequested: parseInt(quantityRequested),
            quantityAllocated: parseInt(quantityAllocated),
            quantityDispatched: parseInt(quantityDispatched),
            unit,
            status,
            priority: request.priority,
            requestDate: request.request_date,
            requiredDate: request.required_date,
            dispatchDate: dispatchDate || null,
            destination: request.destination,
            requestedBy: request.requested_by,
            estimatedValue: parseFloat(estimatedValue),
            trackingNumber: trackingNumber || null,
            notes: request.notes,
          };
        })
      : [];

    const formattedRequest = {
      id: request.id,
      requestNumber: request.request_number,
      requestDate: request.request_date,
      requiredDate: request.required_date,
      requestedBy: request.requested_by,
      department: request.department,
      destination: request.destination,
      status: request.status,
      priority: request.priority,
      totalItems: items.length,
      totalValue: items.reduce((sum, item) => sum + item.estimatedValue, 0),
      items,
      approvedBy: request.approved_by,
      processedBy: request.processed_by,
      notes: request.notes,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
    };

    res.json({
      success: true,
      data: formattedRequest,
    });
  } catch (error) {
    console.error("Error fetching stock out request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock out request",
      error: error.message,
    });
  }
};

// Create new stock out request
const createRequest = async (req, res) => {
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const {
      requestedBy,
      department,
      destination,
      priority = "medium",
      requiredDate,
      notes = "",
      items = [],
    } = req.body;

    // Validate required fields
    if (
      !requestedBy ||
      !department ||
      !destination ||
      !requiredDate ||
      !items.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: requestedBy, department, destination, requiredDate, and items are required",
      });
    }

    // Generate request number
    const [lastRequest] = await connection.execute(`
            SELECT request_number FROM stock_out_requests 
            ORDER BY created_at DESC LIMIT 1
        `);

    let requestNumber = "SOD-2025-001";
    if (lastRequest.length > 0) {
      const lastNumber = parseInt(lastRequest[0].request_number.split("-")[2]);
      requestNumber = `SOD-2025-${String(lastNumber + 1).padStart(3, "0")}`;
    }

    // Calculate total value
    const totalValue = items.reduce(
      (sum, item) => sum + (item.estimatedValue || 0),
      0
    );

    // Insert stock out request
    const [requestResult] = await connection.execute(
      `
            INSERT INTO stock_out_requests (
                request_number, request_date, required_date, requested_by,
                department, destination, status, priority, notes
            ) VALUES (?, CURDATE(), ?, ?, ?, ?, 'draft', ?, ?)
        `,
      [
        requestNumber,
        requiredDate,
        requestedBy,
        department,
        destination,
        priority,
        notes,
      ]
    );

    const requestId = requestResult.insertId;

    // Insert stock out items
    for (const item of items) {
      // Find product by SKU/item code
      const [productResult] = await connection.execute(
        `
                SELECT id FROM products WHERE sku = ? LIMIT 1
            `,
        [item.itemCode]
      );

      if (productResult.length === 0) {
        throw new Error(`Product with SKU ${item.itemCode} not found`);
      }

      await connection.execute(
        `
                INSERT INTO stock_out_items (
                    request_id, product_id, product_name, category, quantity_requested,
                    quantity_allocated, quantity_dispatched, unit, status, estimated_value
                ) VALUES (?, ?, ?, ?, ?, 0, 0, ?, 'pending', ?)
            `,
        [
          requestId,
          productResult[0].id,
          item.itemName,
          item.category,
          item.quantityRequested,
          item.unit,
          item.estimatedValue || 0,
        ]
      );
    }

    await connection.commit();

    // Fetch the created request
    const [createdRequest] = await connection.execute(
      `
            SELECT * FROM stock_out_requests WHERE id = ?
        `,
      [requestId]
    );

    res.status(201).json({
      success: true,
      message: "Stock out request created successfully",
      data: {
        id: requestId,
        requestNumber,
        ...createdRequest[0],
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error creating stock out request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create stock out request",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Update stock out request
const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      requestedBy, 
      department, 
      destination, 
      priority, 
      requiredDate, 
      notes, 
      approvedBy, 
      processedBy, 
      totalValue,
      items 
    } = req.body;

    // Check if request exists
    const [existingRequest] = await db.execute(
      "SELECT * FROM stock_out_requests WHERE id = ?",
      [id]
    );

    if (existingRequest.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stock out request not found",
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (status) {
      updates.push("status = ?");
      params.push(status);
    }
    if (requestedBy) {
      updates.push("requested_by = ?");
      params.push(requestedBy);
    }
    if (department) {
      updates.push("department = ?");
      params.push(department);
    }
    if (destination) {
      updates.push("destination = ?");
      params.push(destination);
    }
    if (priority) {
      updates.push("priority = ?");
      params.push(priority);
    }
    if (requiredDate) {
      updates.push("required_date = ?");
      params.push(requiredDate);
    }
    if (notes !== undefined) {
      updates.push("notes = ?");
      params.push(notes);
    }
    if (approvedBy) {
      updates.push("approved_by = ?");
      params.push(approvedBy);
    }
    if (processedBy) {
      updates.push("processed_by = ?");
      params.push(processedBy);
    }
    if (totalValue !== undefined) {
      updates.push("total_value = ?");
      params.push(totalValue);
    }

    if (updates.length > 0) {
      updates.push("updated_at = NOW()");
      params.push(id);

      await db.execute(
        `UPDATE stock_out_requests SET ${updates.join(", ")} WHERE id = ?`,
        params
      );
    }

    // Update items if provided
    if (items && Array.isArray(items)) {
      // First, delete existing items
      await db.execute("DELETE FROM stock_out_items WHERE request_id = ?", [id]);
      
      // Insert new/updated items
      for (const item of items) {
        await db.execute(
          `INSERT INTO stock_out_items 
           (id, request_id, product_id, item_name, category, quantity_requested, unit, estimated_value, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [
            item.id || require('crypto').randomUUID(),
            id,
            item.itemCode || null,
            item.itemName || '',
            item.category || '',
            item.quantityRequested || 0,
            item.unit || 'pcs',
            item.estimatedValue || 0
          ]
        );
      }
      
      // Update total items and value in main request
      const totalItems = items.reduce((sum, item) => sum + (item.quantityRequested || 0), 0);
      const totalValue = items.reduce((sum, item) => sum + (item.estimatedValue || 0), 0);
      
      await db.execute(
        "UPDATE stock_out_requests SET total_items = ?, total_value = ? WHERE id = ?",
        [totalItems, totalValue, id]
      );
    }

    res.json({
      success: true,
      message: "Stock out request updated successfully",
    });
  } catch (error) {
    console.error("Error updating stock out request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update stock out request",
      error: error.message,
    });
  }
};

module.exports = {
  getStockOutRequests,
  getMetrics,
  getDashboardData,
  getRequestById,
  createRequest,
  updateRequest,
};
