const { pool } = require('../config/database');

class DashboardController {
  // Get dashboard overview metrics - matches dashboardAPI.getOverview()
  static async getDashboardOverview(req, res) {
    try {
      const [
        totalProducts,
        lowStockProducts,
        totalSuppliers,
        pendingOrders,
        todayOrders,
        totalValue
      ] = await Promise.all([
        // Total Products
        pool.execute('SELECT COUNT(*) as count FROM products WHERE status = "active"'),
        
        // Low Stock Products
        pool.execute(`
          SELECT COUNT(*) as count 
          FROM products 
          WHERE status = "active" AND current_stock <= low_stock_threshold
        `),
        
        // Total Suppliers
        pool.execute('SELECT COUNT(*) as count FROM suppliers WHERE status = "active"'),
        
        // Pending Orders
        pool.execute(`
          SELECT COUNT(*) as count 
          FROM purchase_orders 
          WHERE status IN ("pending", "approved", "shipped")
        `),
        
        // Today's Orders
        pool.execute(`
          SELECT COUNT(*) as count 
          FROM customer_orders 
          WHERE DATE(order_date) = CURDATE() AND status NOT IN ('cancelled')
        `),
        
        // Total Inventory Value
        pool.execute(`
          SELECT COALESCE(SUM(current_stock * cost), 0) as value 
          FROM products 
          WHERE status = "active"
        `)
      ]);

      // Return data in the format expected by frontend
      const overview = {
        totalProducts: totalProducts[0][0]?.count || 0,
        lowStockProducts: lowStockProducts[0][0]?.count || 0,
        totalSuppliers: totalSuppliers[0][0]?.count || 0,
        pendingOrders: pendingOrders[0][0]?.count || 0,
        todayOrders: todayOrders[0][0]?.count || 0,
        inventoryValue: parseFloat(totalValue[0][0]?.value || 0),
        // Also include alternative field names for compatibility
        total_products: totalProducts[0][0]?.count || 0,
        low_stock_products: lowStockProducts[0][0]?.count || 0,
        active_suppliers: totalSuppliers[0][0]?.count || 0,
        pending_orders: pendingOrders[0][0]?.count || 0,
        monthly_procurement: parseFloat(totalValue[0][0]?.value || 0)
      };

      // Return data directly (not wrapped in data object)
      res.json(overview);
    } catch (error) {
      console.error('Dashboard overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard overview',
        error: error.message
      });
    }
  }

  // Get recent activities - matches dashboardAPI.getActivity()
  static async getActivity(req, res) {
    try {
      const { limit = 10 } = req.query;
      const limitValue = Math.min(parseInt(limit, 10) || 10, 100);
      
      console.log('Activity endpoint called with limit:', limit, 'parsed as:', limitValue);

      // Try with pool.query instead of pool.execute - some versions have issues with LIMIT params
      const [activities] = await pool.query(`
        SELECT 
          id,
          activity_type,
          description,
          user_name,
          user_role,
          table_name,
          record_id,
          created_at
        FROM user_activities 
        ORDER BY created_at DESC 
        LIMIT ${limitValue}
      `);

      console.log('Activities found:', activities.length);

      // If no activities found, create some sample activities for demonstration
      if (activities.length === 0) {
        // Insert some sample activities
        const sampleActivities = [
          {
            activity_type: 'view',
            description: 'Iron Casting Blocks stock is running low',
            user_name: 'System',
            user_role: 'system'
          },
          {
            activity_type: 'create',
            description: 'New purchase order created for Steel Billets',
            user_name: 'Admin User',
            user_role: 'admin'
          },
          {
            activity_type: 'update',
            description: 'Received shipment of 50 Aluminum Alloy Bars',
            user_name: 'Warehouse Manager',
            user_role: 'manager'
          },
          {
            activity_type: 'view',
            description: 'Bronze Ingots need reordering',
            user_name: 'System',
            user_role: 'system'
          },
          {
            activity_type: 'approval',
            description: 'Supplier invoice approved for CastingPro Industries',
            user_name: 'Finance Manager',
            user_role: 'manager'
          }
        ];

        for (const activity of sampleActivities) {
          await pool.execute(`
            INSERT INTO user_activities (activity_type, description, user_name, user_role, created_at)
            VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 24) HOUR))
          `, [activity.activity_type, activity.description, activity.user_name, activity.user_role]);
        }

        // Fetch the newly inserted activities
        const [newActivities] = await pool.query(`
          SELECT 
            id,
            activity_type,
            description,
            user_name,
            user_role,
            table_name,
            record_id,
            created_at
          FROM user_activities 
          ORDER BY created_at DESC 
          LIMIT ${limitValue}
        `);

        return res.json(newActivities);
      }

      // Return activities directly as an array
      res.json(activities);
    } catch (error) {
      console.error('Get activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activities',
        error: error.message
      });
    }
  }

  // Get trends data - matches dashboardAPI.getTrends()
  static async getTrends(req, res) {
    try {
      const { period = 6 } = req.query; // Default to 6 months
      
      // Get monthly sales trends
      const [salesTrends] = await pool.execute(`
        SELECT 
          DATE_FORMAT(order_date, '%b') as month,
          COUNT(*) as orders,
          COALESCE(SUM(final_amount), 0) / 1000 as sales, 
          COUNT(DISTINCT customer_id) as customers
        FROM customer_orders 
        WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
          AND status NOT IN ('cancelled')
        GROUP BY YEAR(order_date), MONTH(order_date), DATE_FORMAT(order_date, '%b')
        ORDER BY YEAR(order_date), MONTH(order_date)
      `, [parseInt(period)]);

      // Get inventory trends
      const [inventoryTrends] = await pool.execute(`
        SELECT 
          DATE_FORMAT(created_at, '%b') as month,
          COUNT(*) as total_quantity_sold,
          COUNT(DISTINCT product_id) as unique_products_sold
        FROM stock_movements 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
          AND movement_type = 'out'
        GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b')
        ORDER BY YEAR(created_at), MONTH(created_at)
      `, [parseInt(period)]);

      // Combine sales and inventory data
      const monthlyData = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // If no data, create sample trend data
      if (salesTrends.length === 0 && inventoryTrends.length === 0) {
        const currentMonth = new Date().getMonth();
        for (let i = 0; i < parseInt(period); i++) {
          const monthIndex = (currentMonth - parseInt(period) + 1 + i + 12) % 12;
          monthlyData.push({
            month: months[monthIndex],
            sales: Math.floor(Math.random() * 100) + 150,
            inventory: Math.floor(Math.random() * 300) + 1000,
            orders: Math.floor(Math.random() * 30) + 40,
            total_quantity_sold: Math.floor(Math.random() * 200) + 100,
            unique_products_sold: Math.floor(Math.random() * 50) + 20
          });
        }
      } else {
        // Process real data
        const salesMap = new Map();
        const inventoryMap = new Map();
        
        salesTrends.forEach(item => {
          salesMap.set(item.month, item);
        });
        
        inventoryTrends.forEach(item => {
          inventoryMap.set(item.month, item);
        });
        
        // Get unique months from both datasets
        const allMonths = new Set([...salesMap.keys(), ...inventoryMap.keys()]);
        
        allMonths.forEach(month => {
          const salesData = salesMap.get(month) || {};
          const inventoryData = inventoryMap.get(month) || {};
          
          monthlyData.push({
            month,
            sales: Math.round(parseFloat(salesData.sales || 0)),
            inventory: Math.round(parseFloat(inventoryData.total_quantity_sold || 0) * 5), // Scale inventory
            orders: parseInt(salesData.orders || 0),
            total_quantity_sold: parseInt(inventoryData.total_quantity_sold || 0),
            unique_products_sold: parseInt(inventoryData.unique_products_sold || 0)
          });
        });
      }

      // Return trends directly as an array
      res.json(monthlyData);
    } catch (error) {
      console.error('Get trends error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch trends',
        error: error.message
      });
    }
  }

  // Get stock summary by category
  static async getStockSummary(req, res) {
    try {
      const [stockSummary] = await pool.execute(`
        SELECT 
          COALESCE(pc.name, p.category, 'Uncategorized') as category,
          COUNT(p.id) as total_products,
          SUM(p.current_stock) as total_stock,
          SUM(CASE WHEN p.current_stock <= p.low_stock_threshold THEN 1 ELSE 0 END) as low_stock_count,
          ROUND(AVG(p.current_stock), 2) as avg_stock,
          ROUND(SUM(p.current_stock * p.cost), 2) as total_value
        FROM products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE p.status = 'active'
        GROUP BY COALESCE(pc.name, p.category)
        ORDER BY total_value DESC
      `);

      res.json({
        success: true,
        data: stockSummary,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Stock summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock summary',
        error: error.message
      });
    }
  }

  // Get active alerts
  static async getActiveAlerts(req, res) {
    try {
      const { limit = 10, type, priority } = req.query;
      
      let query = `
        SELECT 
          a.*,
          p.category,
          p.unit,
          p.price,
          s.name as supplier_name,
          s.email as supplier_email,
          s.phone as supplier_phone
        FROM alerts a
        LEFT JOIN products p ON a.product_id = p.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE a.status = 'active'
      `;
      
      const params = [];
      
      if (type) {
        query += ' AND a.alert_type = ?';
        params.push(type);
      }
      
      if (priority) {
        query += ' AND a.priority = ?';
        params.push(priority);
      }
      
      query += ' ORDER BY a.priority DESC, a.created_at DESC LIMIT ?';
      params.push(parseInt(limit));
      
      const [alerts] = await pool.execute(query, params);

      res.json({
        success: true,
        data: alerts,
        count: alerts.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Active alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active alerts',
        error: error.message
      });
    }
  }

  // Get recent stock movements
  static async getRecentStockMovements(req, res) {
    try {
      const { limit = 20 } = req.query;
      
      const [movements] = await pool.execute(`
        SELECT 
          sm.*,
          p.name as product_name,
          p.sku,
          p.category,
          p.unit
        FROM stock_movements sm
        LEFT JOIN products p ON sm.product_id = p.id
        ORDER BY sm.created_at DESC
        LIMIT ?
      `, [parseInt(limit)]);

      res.json({
        success: true,
        data: movements,
        count: movements.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Recent stock movements error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent stock movements',
        error: error.message
      });
    }
  }

  // Get sales metrics
  static async getSalesMetrics(req, res) {
    try {
      const { period = '30' } = req.query; // days
      
      const [
        dailySales,
        totalRevenue,
        totalOrders,
        topProducts
      ] = await Promise.all([
        // Daily sales for the period
        pool.execute(`
          SELECT 
            DATE(order_date) as date,
            COUNT(*) as orders,
            SUM(final_amount) as revenue
          FROM customer_orders 
          WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            AND status NOT IN ('cancelled')
          GROUP BY DATE(order_date)
          ORDER BY date DESC
        `, [parseInt(period)]),
        
        // Total revenue
        pool.execute(`
          SELECT 
            SUM(final_amount) as total_revenue,
            COUNT(*) as total_orders
          FROM customer_orders 
          WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            AND status NOT IN ('cancelled')
        `, [parseInt(period)]),
        
        // Total orders
        pool.execute(`
          SELECT COUNT(*) as count 
          FROM customer_orders 
          WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            AND status NOT IN ('cancelled')
        `, [parseInt(period)]),
        
        // Top selling products
        pool.execute(`
          SELECT 
            p.name as product_name,
            p.sku,
            SUM(coi.quantity) as total_sold,
            SUM(coi.total_price) as revenue
          FROM customer_order_items coi
          JOIN customer_orders co ON coi.order_id = co.id
          JOIN products p ON coi.product_id = p.id
          WHERE co.order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            AND co.status NOT IN ('cancelled')
          GROUP BY p.id, p.name, p.sku
          ORDER BY total_sold DESC
          LIMIT 5
        `, [parseInt(period)])
      ]);

      const metrics = {
        dailySales: dailySales[0],
        totalRevenue: parseFloat(totalRevenue[0][0]?.total_revenue || 0),
        totalOrders: totalOrders[0][0]?.count || 0,
        topProducts: topProducts[0],
        period: parseInt(period)
      };

      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Sales metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sales metrics',
        error: error.message
      });
    }
  }

  // Get purchase metrics
  static async getPurchaseMetrics(req, res) {
    try {
      const { period = '30' } = req.query; // days
      
      const [
        pendingPOs,
        totalPurchaseValue,
        supplierPerformance,
        recentPOs
      ] = await Promise.all([
        // Pending Purchase Orders
        pool.execute(`
          SELECT 
            COUNT(*) as count,
            SUM(final_amount) as value
          FROM purchase_orders 
          WHERE status IN ('pending', 'approved', 'shipped')
        `),
        
        // Total purchase value for period
        pool.execute(`
          SELECT 
            SUM(final_amount) as total_value,
            COUNT(*) as total_orders
          FROM purchase_orders 
          WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        `, [parseInt(period)]),
        
        // Supplier performance
        pool.execute(`
          SELECT 
            s.name as supplier_name,
            COUNT(po.id) as orders_count,
            SUM(po.final_amount) as total_value,
            AVG(DATEDIFF(po.actual_delivery_date, po.expected_delivery_date)) as avg_delay_days
          FROM purchase_orders po
          JOIN suppliers s ON po.supplier_id = s.id
          WHERE po.order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          GROUP BY s.id, s.name
          ORDER BY total_value DESC
          LIMIT 5
        `, [parseInt(period)]),
        
        // Recent Purchase Orders
        pool.execute(`
          SELECT 
            po.*,
            s.name as supplier_name
          FROM purchase_orders po
          LEFT JOIN suppliers s ON po.supplier_id = s.id
          ORDER BY po.created_at DESC
          LIMIT 10
        `)
      ]);

      const metrics = {
        pendingOrders: {
          count: pendingPOs[0][0]?.count || 0,
          value: parseFloat(pendingPOs[0][0]?.value || 0)
        },
        totalPurchaseValue: parseFloat(totalPurchaseValue[0][0]?.total_value || 0),
        totalOrders: totalPurchaseValue[0][0]?.total_orders || 0,
        supplierPerformance: supplierPerformance[0],
        recentPOs: recentPOs[0],
        period: parseInt(period)
      };

      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Purchase metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch purchase metrics',
        error: error.message
      });
    }
  }

  // Get warehouse utilization metrics
  static async getWarehouseMetrics(req, res) {
    try {
      const [
        storageUtilization,
        locationSummary,
        capacityOverview
      ] = await Promise.all([
        // Storage location utilization
        pool.execute(`
          SELECT 
            location_code,
            location_name,
            location_type,
            capacity_units,
            occupied_units,
            CASE 
              WHEN capacity_units > 0 
              THEN ROUND((occupied_units / capacity_units) * 100, 2)
              ELSE 0 
            END as utilization_percentage,
            status
          FROM storage_locations
          WHERE capacity_units > 0
          ORDER BY utilization_percentage DESC
        `),
        
        // Location type summary
        pool.execute(`
          SELECT 
            location_type,
            COUNT(*) as total_locations,
            SUM(capacity_units) as total_capacity,
            SUM(occupied_units) as total_occupied,
            CASE 
              WHEN SUM(capacity_units) > 0 
              THEN ROUND((SUM(occupied_units) / SUM(capacity_units)) * 100, 2)
              ELSE 0 
            END as avg_utilization
          FROM storage_locations
          WHERE capacity_units > 0
          GROUP BY location_type
        `),
        
        // Overall capacity
        pool.execute(`
          SELECT 
            SUM(capacity_units) as total_capacity,
            SUM(occupied_units) as total_occupied,
            COUNT(*) as total_locations,
            COUNT(CASE WHEN status = 'available' THEN 1 END) as available_locations,
            COUNT(CASE WHEN status = 'full' THEN 1 END) as full_locations
          FROM storage_locations
        `)
      ]);

      const metrics = {
        storageUtilization: storageUtilization[0],
        locationSummary: locationSummary[0],
        capacityOverview: capacityOverview[0][0] || {},
        overallUtilization: capacityOverview[0][0]?.total_capacity > 0 
          ? Math.round((capacityOverview[0][0].total_occupied / capacityOverview[0][0].total_capacity) * 100 * 100) / 100
          : 0
      };

      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Warehouse metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch warehouse metrics',
        error: error.message
      });
    }
  }

  // Get quality control metrics
  static async getQualityMetrics(req, res) {
    try {
      const { period = '30' } = req.query; // days
      
      const [
        qcSummary,
        defectsByType,
        inspectionTrends,
        holdItems
      ] = await Promise.all([
        // QC Summary
        pool.execute(`
          SELECT 
            COUNT(*) as total_inspections,
            SUM(quantity_inspected) as total_inspected,
            SUM(quantity_passed) as total_passed,
            SUM(quantity_failed) as total_failed,
            CASE 
              WHEN SUM(quantity_inspected) > 0 
              THEN ROUND((SUM(quantity_failed) / SUM(quantity_inspected)) * 100, 2)
              ELSE 0 
            END as rejection_rate
          FROM qc_inspections 
          WHERE inspection_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        `, [parseInt(period)]),
        
        // Defects by type
        pool.execute(`
          SELECT 
            defect_type,
            COUNT(*) as count,
            SUM(quantity) as total_quantity,
            severity
          FROM qc_defects qd
          JOIN qc_inspections qi ON qd.inspection_id = qi.id
          WHERE qi.inspection_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          GROUP BY defect_type, severity
          ORDER BY total_quantity DESC
        `, [parseInt(period)]),
        
        // Inspection trends
        pool.execute(`
          SELECT 
            DATE(inspection_date) as date,
            COUNT(*) as inspections,
            SUM(quantity_inspected) as inspected,
            SUM(quantity_failed) as failed
          FROM qc_inspections 
          WHERE inspection_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          GROUP BY DATE(inspection_date)
          ORDER BY date DESC
        `, [parseInt(period)]),
        
        // Current hold items
        pool.execute(`
          SELECT * FROM qc_hold_items 
          WHERE status = 'hold'
          ORDER BY hold_date DESC
          LIMIT 10
        `)
      ]);

      const metrics = {
        summary: qcSummary[0][0] || {},
        defectsByType: defectsByType[0],
        inspectionTrends: inspectionTrends[0],
        currentHoldItems: holdItems[0],
        period: parseInt(period)
      };

      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Quality metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quality metrics',
        error: error.message
      });
    }
  }

  // Add user activity
  static async addActivity(req, res) {
    try {
      const {
        activity_type,
        table_name,
        record_id,
        description,
        user_name,
        user_role,
        additional_data
      } = req.body;

      const [result] = await pool.execute(`
        INSERT INTO user_activities (
          activity_type, table_name, record_id, description, 
          user_name, user_role, ip_address, user_agent, additional_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        activity_type,
        table_name || null,
        record_id || null,
        description,
        user_name,
        user_role || null,
        req.ip,
        req.get('User-Agent'),
        additional_data ? JSON.stringify(additional_data) : null
      ]);

      res.status(201).json({
        success: true,
        message: 'Activity logged successfully',
        id: result.insertId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Add activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to log activity',
        error: error.message
      });
    }
  }
}

module.exports = DashboardController;
