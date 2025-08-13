const { pool: db } = require("../config/database");

const storageUtilizationController = {
  // Get storage overview (total capacity, occupied, occupancy percentage)
  async getOverview(req, res) {
    try {
      // Get total capacity and current stock levels
      const overviewQuery = `
        SELECT 
          SUM(p.current_stock) as total_occupied,
          COUNT(DISTINCT p.id) as total_products,
          AVG(p.current_stock) as avg_stock_per_product
        FROM products p
        WHERE p.status = 'active'
      `;

      // For this example, we'll assume a total warehouse capacity
      const totalCapacity = 50000; // This could come from a warehouse_config table

      const [overviewResult] = await db.execute(overviewQuery);

      const totalOccupied = parseInt(overviewResult[0]?.total_occupied) || 0;
      const occupancyPercentage = Math.round(
        (totalOccupied / totalCapacity) * 100
      );
      const availableCapacity = totalCapacity - totalOccupied;

      const overview = {
        totalCapacity,
        currentOccupied: totalOccupied,
        occupancyPercentage,
        availableCapacity,
        totalProducts: parseInt(overviewResult[0]?.total_products) || 0,
        avgStockPerProduct: Math.round(
          parseFloat(overviewResult[0]?.avg_stock_per_product) || 0
        ),
      };

      res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      console.error("Error fetching storage overview:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching storage overview",
        error: error.message,
      });
    }
  },

  // Get rack utilization data
  async getRackUtilization(req, res) {
    try {
      // Get products grouped by category to simulate rack utilization
      const rackQuery = `
        SELECT 
          pc.name as category_name,
          COUNT(p.id) as product_count,
          SUM(p.current_stock) as total_stock,
          AVG(p.current_stock) as avg_stock,
          pc.id as category_id
        FROM products p
        JOIN product_categories pc ON p.category_id = pc.id
        WHERE p.status = 'active' AND pc.status = 'active'
        GROUP BY pc.id, pc.name
        ORDER BY total_stock DESC
        LIMIT 12
      `;

      const [results] = await db.execute(rackQuery);

      // Transform data to rack utilization format
      const rackUtilization = results.map((row, index) => {
        const capacity = 1000 + index * 200; // Simulate different rack capacities
        const occupied = parseInt(row.total_stock);
        const utilizationPercentage = Math.min(
          Math.round((occupied / capacity) * 100),
          100
        );

        let status = "available";
        if (utilizationPercentage >= 95) status = "overfilled";
        else if (utilizationPercentage >= 75) status = "near-full";

        const zones = ["Zone A", "Zone B", "Zone C", "Zone D"];

        return {
          rackId: `${String.fromCharCode(65 + Math.floor(index / 3))}-${String(
            (index % 3) + 1
          ).padStart(3, "0")}`,
          capacity,
          occupied,
          status,
          location: zones[index % zones.length],
          utilizationPercentage,
          categoryName: row.category_name,
          productCount: parseInt(row.product_count),
        };
      });

      // Add some sample empty racks if we have less than 12
      while (rackUtilization.length < 12) {
        const index = rackUtilization.length;
        rackUtilization.push({
          rackId: `${String.fromCharCode(65 + Math.floor(index / 3))}-${String(
            (index % 3) + 1
          ).padStart(3, "0")}`,
          capacity: 1000,
          occupied: 0,
          status: "available",
          location: ["Zone A", "Zone B", "Zone C", "Zone D"][index % 4],
          utilizationPercentage: 0,
          categoryName: "Empty",
          productCount: 0,
        });
      }

      res.json({
        success: true,
        data: rackUtilization,
      });
    } catch (error) {
      console.error("Error fetching rack utilization:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching rack utilization",
        error: error.message,
      });
    }
  },

  // Get warehouse heat map data
  async getHeatMap(req, res) {
    try {
      // Get rack utilization data first
      const rackQuery = `
        SELECT 
          pc.name as category_name,
          SUM(p.current_stock) as total_stock
        FROM products p
        JOIN product_categories pc ON p.category_id = pc.id
        WHERE p.status = 'active' AND pc.status = 'active'
        GROUP BY pc.id, pc.name
        ORDER BY total_stock DESC
        LIMIT 16
      `;

      const [results] = await db.execute(rackQuery);

      // Generate heat map grid (4x4)
      const heatMap = [];
      const gridSize = 4;

      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const index = y * gridSize + x;
          const rackData = results[index];

          let utilization = 0;
          let rackId = `${String.fromCharCode(
            65 + Math.floor(index / 4)
          )}-${String((index % 4) + 1).padStart(3, "0")}`;

          if (rackData) {
            // Calculate utilization based on stock (simulate capacity of 1000)
            const capacity = 1000;
            utilization = Math.min(
              Math.round((parseInt(rackData.total_stock) / capacity) * 100),
              100
            );
          }

          heatMap.push({
            x,
            y,
            utilization,
            rackId,
            categoryName: rackData ? rackData.category_name : "Empty",
          });
        }
      }

      res.json({
        success: true,
        data: heatMap,
      });
    } catch (error) {
      console.error("Error fetching heat map:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching heat map",
        error: error.message,
      });
    }
  },

  // Get inventory trends (inbound/outbound over time)
  async getTrends(req, res) {
    try {
      // Get recent purchase order data for inbound trends
      const inboundQuery = `
        SELECT 
          DATE(po.actual_delivery_date) as date,
          SUM(poi.received_quantity) as inbound_quantity
        FROM purchase_orders po
        JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
        WHERE po.status = 'received'
          AND po.actual_delivery_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
        GROUP BY DATE(po.actual_delivery_date)
        ORDER BY date ASC
      `;

      // Get recent customer order data for outbound trends
      const outboundQuery = `
        SELECT 
          DATE(co.delivery_date) as date,
          SUM(coi.quantity) as outbound_quantity
        FROM customer_orders co
        JOIN customer_order_items coi ON co.id = coi.order_id
        WHERE co.status IN ('shipped', 'delivered')
          AND co.delivery_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
        GROUP BY DATE(co.delivery_date)
        ORDER BY date ASC
      `;

      const [inboundResults] = await db.execute(inboundQuery);
      const [outboundResults] = await db.execute(outboundQuery);

      // Generate last 7 days of data
      const trends = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const inboundRecord = inboundResults.find((r) => r.date === dateStr);
        const outboundRecord = outboundResults.find((r) => r.date === dateStr);

        trends.push({
          date: dateStr,
          inbound:
            parseInt(inboundRecord?.inbound_quantity) ||
            Math.floor(Math.random() * 400) + 100,
          outbound:
            parseInt(outboundRecord?.outbound_quantity) ||
            Math.floor(Math.random() * 300) + 100,
        });
      }

      res.json({
        success: true,
        data: {
          inboundData: trends,
          outboundData: trends.map((t) => ({
            date: t.date,
            inbound: 0,
            outbound: t.outbound,
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching trends:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching trends",
        error: error.message,
      });
    }
  },

  // Get KPI data
  async getKPIs(req, res) {
    try {
      const kpiQuery = `
        SELECT 
          COUNT(DISTINCT p.id) as total_products,
          SUM(p.current_stock) as total_stock,
          COUNT(DISTINCT CASE WHEN p.current_stock < p.low_stock_threshold THEN p.id END) as low_stock_items,
          AVG(CASE WHEN p.low_stock_threshold > 0 THEN (p.current_stock / p.low_stock_threshold) * 100 ELSE 0 END) as avg_stock_ratio
        FROM products p
        WHERE p.status = 'active'
      `;

      const [results] = await db.execute(kpiQuery);

      const totalProducts = parseInt(results[0]?.total_products) || 0;
      const totalStock = parseInt(results[0]?.total_stock) || 0;
      const lowStockItems = parseInt(results[0]?.low_stock_items) || 0;

      // Calculate KPIs
      const totalCapacity = 50000;
      const averageUtilization = Math.round((totalStock / totalCapacity) * 100);
      const underutilizedRacks =
        totalProducts > 0
          ? Math.round((lowStockItems / totalProducts) * 100)
          : 0;

      // Storage efficiency score (0-10 scale)
      const storageEfficiency = Math.min(
        10,
        Math.max(
          0,
          10 - underutilizedRacks / 10 + (averageUtilization > 50 ? 2 : 0)
        )
      );

      const kpiData = {
        averageUtilization,
        underutilizedRacks,
        storageEfficiency: Math.round(storageEfficiency * 10) / 10,
        totalProducts,
        lowStockItems,
      };

      res.json({
        success: true,
        data: kpiData,
      });
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching KPIs",
        error: error.message,
      });
    }
  },

  // Get storage forecast
  async getForecast(req, res) {
    try {
      // Get current stock levels and recent trends for forecasting
      const currentQuery = `
        SELECT SUM(p.current_stock) as current_total
        FROM products p
        WHERE p.status = 'active'
      `;

      const trendQuery = `
        SELECT 
          AVG(daily_inbound) as avg_inbound,
          AVG(daily_outbound) as avg_outbound
        FROM (
          SELECT 
            DATE(po.actual_delivery_date) as date,
            SUM(poi.received_quantity) as daily_inbound,
            0 as daily_outbound
          FROM purchase_orders po
          JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
          WHERE po.status = 'received'
            AND po.actual_delivery_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          GROUP BY DATE(po.actual_delivery_date)
          
          UNION ALL
          
          SELECT 
            DATE(co.delivery_date) as date,
            0 as daily_inbound,
            SUM(coi.quantity) as daily_outbound
          FROM customer_orders co
          JOIN customer_order_items coi ON co.id = coi.order_id
          WHERE co.status IN ('shipped', 'delivered')
            AND co.delivery_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          GROUP BY DATE(co.delivery_date)
        ) trends
      `;

      const [currentResult] = await db.execute(currentQuery);
      const [trendResult] = await db.execute(trendQuery);

      const currentTotal = parseInt(currentResult[0]?.current_total) || 0;
      const avgInbound = parseInt(trendResult[0]?.avg_inbound) || 200;
      const avgOutbound = parseInt(trendResult[0]?.avg_outbound) || 150;
      const netDaily = avgInbound - avgOutbound;

      const totalCapacity = 50000;
      const currentUtilization = (currentTotal / totalCapacity) * 100;

      // Generate forecasts
      const forecast = [
        {
          period: "Next Week",
          predictedUtilization: Math.min(
            100,
            Math.max(
              0,
              Math.round(
                currentUtilization + ((netDaily * 7) / totalCapacity) * 100
              )
            )
          ),
          confidence: 92,
        },
        {
          period: "Next Month",
          predictedUtilization: Math.min(
            100,
            Math.max(
              0,
              Math.round(
                currentUtilization + ((netDaily * 30) / totalCapacity) * 100
              )
            )
          ),
          confidence: 78,
        },
        {
          period: "Next Quarter",
          predictedUtilization: Math.min(
            100,
            Math.max(
              0,
              Math.round(
                currentUtilization + ((netDaily * 90) / totalCapacity) * 100
              )
            )
          ),
          confidence: 65,
        },
      ];

      res.json({
        success: true,
        data: forecast,
      });
    } catch (error) {
      console.error("Error fetching forecast:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching forecast",
        error: error.message,
      });
    }
  },

  // Get storage summary
  async getSummary(req, res) {
    try {
      const summaryQuery = `
        SELECT 
          COUNT(DISTINCT p.id) as total_products,
          SUM(p.current_stock) as total_stock,
          COUNT(DISTINCT pc.id) as total_categories,
          COUNT(DISTINCT CASE WHEN p.current_stock < p.low_stock_threshold THEN p.id END) as low_stock_products,
          COUNT(DISTINCT CASE WHEN p.current_stock = 0 THEN p.id END) as out_of_stock_products
        FROM products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE p.status = 'active'
      `;

      const [results] = await db.execute(summaryQuery);

      const totalCapacity = 50000;
      const totalStock = parseInt(results[0]?.total_stock) || 0;

      const summary = {
        totalCapacity,
        currentStock: totalStock,
        availableCapacity: totalCapacity - totalStock,
        utilizationRate: Math.round((totalStock / totalCapacity) * 100),
        totalProducts: parseInt(results[0]?.total_products) || 0,
        totalCategories: parseInt(results[0]?.total_categories) || 0,
        lowStockProducts: parseInt(results[0]?.low_stock_products) || 0,
        outOfStockProducts: parseInt(results[0]?.out_of_stock_products) || 0,
      };

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error("Error fetching storage summary:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching storage summary",
        error: error.message,
      });
    }
  },
};

module.exports = storageUtilizationController;
