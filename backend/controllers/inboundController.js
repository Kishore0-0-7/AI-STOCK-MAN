const { pool: db } = require("../config/database");

// Get inbound metrics (today and month totals with growth)
const getInboundMetrics = async (req, res) => {
  try {
    // Get today's received items
    const todayQuery = `
            SELECT 
                COUNT(poi.id) as total_items_today,
                SUM(poi.received_quantity) as total_quantity_today,
                SUM(poi.received_quantity * poi.unit_price) as total_value_today
            FROM purchase_order_items poi
            JOIN purchase_orders po ON poi.purchase_order_id = po.id
            WHERE DATE(po.actual_delivery_date) = CURDATE()
            AND po.status = 'received'
        `;

    const [todayResult] = await db.execute(todayQuery);

    // Get this month's received items
    const monthQuery = `
            SELECT 
                COUNT(poi.id) as total_items_month,
                SUM(poi.received_quantity) as total_quantity_month,
                SUM(poi.received_quantity * poi.unit_price) as total_value_month
            FROM purchase_order_items poi
            JOIN purchase_orders po ON poi.purchase_order_id = po.id
            WHERE MONTH(po.actual_delivery_date) = MONTH(CURDATE())
            AND YEAR(po.actual_delivery_date) = YEAR(CURDATE())
            AND po.status = 'received'
        `;

    const [monthResult] = await db.execute(monthQuery);

    // Get last month's data for growth calculation
    const lastMonthQuery = `
            SELECT 
                COUNT(poi.id) as total_items_last_month,
                SUM(poi.received_quantity) as total_quantity_last_month,
                SUM(poi.received_quantity * poi.unit_price) as total_value_last_month
            FROM purchase_order_items poi
            JOIN purchase_orders po ON poi.purchase_order_id = po.id
            WHERE MONTH(po.actual_delivery_date) = MONTH(CURDATE() - INTERVAL 1 MONTH)
            AND YEAR(po.actual_delivery_date) = YEAR(CURDATE() - INTERVAL 1 MONTH)
            AND po.status = 'received'
        `;

    const [lastMonthResult] = await db.execute(lastMonthQuery);

    // Get yesterday's data for today growth calculation
    const yesterdayQuery = `
            SELECT 
                COUNT(poi.id) as total_items_yesterday,
                SUM(poi.received_quantity) as total_quantity_yesterday,
                SUM(poi.received_quantity * poi.unit_price) as total_value_yesterday
            FROM purchase_order_items poi
            JOIN purchase_orders po ON poi.purchase_order_id = po.id
            WHERE DATE(po.actual_delivery_date) = DATE(CURDATE() - INTERVAL 1 DAY)
            AND po.status = 'received'
        `;

    const [yesterdayResult] = await db.execute(yesterdayQuery);

    // Calculate metrics
    const todayReceived = parseInt(todayResult[0].total_quantity_today) || 0;
    const monthReceived = parseInt(monthResult[0].total_quantity_month) || 0;
    const yesterdayReceived =
      parseInt(yesterdayResult[0].total_quantity_yesterday) || 0;
    const lastMonthReceived =
      parseInt(lastMonthResult[0].total_quantity_last_month) || 0;

    // Calculate growth percentages
    const todayGrowth =
      yesterdayReceived > 0
        ? ((todayReceived - yesterdayReceived) / yesterdayReceived) * 100
        : 0;
    const monthGrowth =
      lastMonthReceived > 0
        ? ((monthReceived - lastMonthReceived) / lastMonthReceived) * 100
        : 0;

    const metrics = {
      totalReceivedToday: todayReceived,
      totalReceivedMonth: monthReceived,
      todayGrowth: parseFloat(todayGrowth.toFixed(1)),
      monthGrowth: parseFloat(monthGrowth.toFixed(1)),
    };

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Error fetching inbound metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inbound metrics",
      error: error.message,
    });
  }
};

// Get supplier data (top suppliers by quantity and value)
const getSupplierData = async (req, res) => {
  try {
    const supplierQuery = `
            SELECT 
                s.name as supplier_name,
                COUNT(poi.id) as total_orders,
                SUM(poi.received_quantity) as total_quantity,
                SUM(poi.received_quantity * poi.unit_price) as total_value,
                AVG(poi.received_quantity * poi.unit_price) as avg_order_value
            FROM suppliers s
            JOIN purchase_orders po ON s.id = po.supplier_id
            JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
            WHERE po.status IN ('received', 'completed')
            AND po.actual_delivery_date >= DATE(CURDATE() - INTERVAL 30 DAY)
            GROUP BY s.id, s.name
            ORDER BY total_value DESC
            LIMIT 6
        `;

    const [suppliers] = await db.execute(supplierQuery);

    // Colors for charts
    const colors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
    ];

    const supplierData = suppliers.map((supplier, index) => ({
      name: supplier.supplier_name,
      quantity: parseInt(supplier.total_quantity) || 0,
      value: parseFloat(supplier.total_value) || 0,
      orders: parseInt(supplier.total_orders) || 0,
      avgOrderValue: parseFloat(supplier.avg_order_value) || 0,
      color: colors[index] || colors[colors.length - 1],
    }));

    res.json({
      success: true,
      data: supplierData,
    });
  } catch (error) {
    console.error("Error fetching supplier data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch supplier data",
      error: error.message,
    });
  }
};

// Get pending shipments
const getPendingShipments = async (req, res) => {
  try {
    const shipmentsQuery = `
            SELECT 
                po.id,
                po.order_number as po_number,
                s.name as supplier_name,
                po.expected_delivery_date,
                po.status,
                po.priority,
                COUNT(poi.id) as item_count,
                SUM(poi.quantity) as total_quantity,
                SUM(poi.quantity * poi.unit_price) as total_value
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
            WHERE po.status IN ('pending', 'approved', 'shipped')
            GROUP BY po.id, po.order_number, s.name, po.expected_delivery_date, po.status, po.priority
            ORDER BY 
                CASE po.priority
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                    ELSE 5
                END,
                po.expected_delivery_date ASC
            LIMIT 10
        `;

    const [shipments] = await db.execute(shipmentsQuery);

    const pendingShipments = shipments.map((shipment) => {
      // Determine status display
      let displayStatus;
      const expectedDate = new Date(shipment.expected_delivery_date);
      const today = new Date();

      if (shipment.status === "shipped") {
        displayStatus = "In Transit";
      } else if (expectedDate < today && shipment.status !== "received") {
        displayStatus = "Delayed";
      } else if (shipment.status === "approved") {
        displayStatus = "Confirmed";
      } else {
        displayStatus = "Processing";
      }

      return {
        id: shipment.id,
        poNumber: shipment.po_number,
        supplier: shipment.supplier_name,
        expectedDate: shipment.expected_delivery_date
          ? shipment.expected_delivery_date.toISOString().split("T")[0]
          : "",
        quantity: parseInt(shipment.total_quantity) || 0,
        status: displayStatus,
        priority: shipment.priority
          ? shipment.priority.charAt(0).toUpperCase() +
            shipment.priority.slice(1)
          : "Medium",
        itemCount: parseInt(shipment.item_count) || 0,
        totalValue: parseFloat(shipment.total_value) || 0,
      };
    });

    res.json({
      success: true,
      data: pendingShipments,
    });
  } catch (error) {
    console.error("Error fetching pending shipments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending shipments",
      error: error.message,
    });
  }
};

// Get quality status for received items
const getQualityStatus = async (req, res) => {
  try {
    const qualityQuery = `
            SELECT 
                poi.quality_status,
                COUNT(*) as item_count,
                SUM(poi.received_quantity) as total_quantity
            FROM purchase_order_items poi
            JOIN purchase_orders po ON poi.purchase_order_id = po.id
            WHERE po.status = 'received'
            AND po.actual_delivery_date >= DATE(CURDATE() - INTERVAL 30 DAY)
            AND poi.quality_status IS NOT NULL
            GROUP BY poi.quality_status
        `;

    const [qualityData] = await db.execute(qualityQuery);

    // Calculate totals for percentages
    const totalQuantity = qualityData.reduce(
      (sum, item) => sum + (parseInt(item.total_quantity) || 0),
      0
    );

    // Status color mapping
    const statusColors = {
      approved: "#10b981", // Green
      pending: "#6b7280", // Gray
      rejected: "#ef4444", // Red
      hold: "#f59e0b", // Orange/Yellow
    };

    // Status display mapping
    const statusDisplay = {
      approved: "Pass",
      pending: "Pending",
      rejected: "Fail",
      hold: "Hold",
    };

    const qualityStatus = qualityData.map((item) => {
      const quantity = parseInt(item.total_quantity) || 0;
      const percentage =
        totalQuantity > 0 ? (quantity / totalQuantity) * 100 : 0;

      return {
        status: statusDisplay[item.quality_status] || item.quality_status,
        quantity: quantity,
        percentage: parseFloat(percentage.toFixed(1)),
        color: statusColors[item.quality_status] || "#6b7280",
      };
    });

    // Ensure we have all status types (add missing ones with 0 values)
    const allStatuses = ["Pass", "Hold", "Fail", "Pending"];
    const existingStatuses = qualityStatus.map((item) => item.status);

    allStatuses.forEach((status) => {
      if (!existingStatuses.includes(status)) {
        qualityStatus.push({
          status: status,
          quantity: 0,
          percentage: 0,
          color: statusColors[status.toLowerCase()] || "#6b7280",
        });
      }
    });

    res.json({
      success: true,
      data: qualityStatus,
    });
  } catch (error) {
    console.error("Error fetching quality status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quality status",
      error: error.message,
    });
  }
};

// Get recent activities/transactions
const getRecentActivities = async (req, res) => {
  try {
    const activitiesQuery = `
            SELECT 
                po.id,
                po.order_number,
                s.name as supplier_name,
                po.status,
                po.actual_delivery_date as activity_date,
                COUNT(poi.id) as item_count,
                SUM(poi.received_quantity * poi.unit_price) as total_value,
                'delivery' as activity_type
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
            WHERE po.status = 'received'
            AND po.actual_delivery_date >= DATE(CURDATE() - INTERVAL 7 DAY)
            GROUP BY po.id, po.order_number, s.name, po.status, po.actual_delivery_date
            ORDER BY po.actual_delivery_date DESC
            LIMIT 10
        `;

    const [activities] = await db.execute(activitiesQuery);

    const recentActivities = activities.map((activity) => ({
      id: activity.id,
      orderNumber: activity.order_number,
      supplier: activity.supplier_name,
      status: activity.status,
      date: activity.activity_date
        ? activity.activity_date.toISOString().split("T")[0]
        : "",
      itemCount: parseInt(activity.item_count) || 0,
      totalValue: parseFloat(activity.total_value) || 0,
      type: activity.activity_type,
    }));

    res.json({
      success: true,
      data: recentActivities,
    });
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activities",
      error: error.message,
    });
  }
};

// Get inbound analytics summary
const getInboundSummary = async (req, res) => {
  try {
    // Get summary statistics
    const summaryQuery = `
            SELECT 
                COUNT(DISTINCT po.id) as total_pos,
                COUNT(DISTINCT po.supplier_id) as active_suppliers,
                SUM(CASE WHEN po.status IN ('pending', 'approved', 'shipped') THEN 1 ELSE 0 END) as pending_pos,
                SUM(CASE WHEN po.status = 'received' THEN 1 ELSE 0 END) as completed_pos,
                AVG(DATEDIFF(po.actual_delivery_date, po.expected_delivery_date)) as avg_delivery_delay,
                SUM(CASE WHEN po.actual_delivery_date > po.expected_delivery_date THEN 1 ELSE 0 END) as delayed_deliveries,
                COUNT(po.id) as total_delivered_pos
            FROM purchase_orders po
            WHERE po.created_at >= DATE(CURDATE() - INTERVAL 30 DAY)
        `;

    const [summary] = await db.execute(summaryQuery);

    const summaryData = {
      totalPurchaseOrders: parseInt(summary[0].total_pos) || 0,
      activeSuppliers: parseInt(summary[0].active_suppliers) || 0,
      pendingOrders: parseInt(summary[0].pending_pos) || 0,
      completedOrders: parseInt(summary[0].completed_pos) || 0,
      averageDeliveryDelay: parseFloat(summary[0].avg_delivery_delay) || 0,
      onTimeDeliveryRate:
        summary[0].total_delivered_pos > 0
          ? parseFloat(
              (
                ((summary[0].total_delivered_pos -
                  summary[0].delayed_deliveries) /
                  summary[0].total_delivered_pos) *
                100
              ).toFixed(1)
            )
          : 0,
    };

    res.json({
      success: true,
      data: summaryData,
    });
  } catch (error) {
    console.error("Error fetching inbound summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inbound summary",
      error: error.message,
    });
  }
};

module.exports = {
  getInboundMetrics,
  getSupplierData,
  getPendingShipments,
  getQualityStatus,
  getRecentActivities,
  getInboundSummary,
};
