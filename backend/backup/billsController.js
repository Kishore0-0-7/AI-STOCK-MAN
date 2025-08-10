const { executeQuery } = require("../config/database");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/bills/");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "bill-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images and PDFs are allowed"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const billsController = {
  // Get all bills with pagination
  getAllBills: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      const status = req.query.status;
      const search = req.query.search;

      let whereClause = "1=1";
      let queryParams = [];

      if (status && status !== "all") {
        whereClause += " AND b.status = ?";
        queryParams.push(status);
      }

      if (search) {
        whereClause += " AND (b.bill_number LIKE ? OR b.supplier_name LIKE ?)";
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      // Count query
      const countQuery = `SELECT COUNT(*) as total FROM bills b WHERE ${whereClause}`;
      const [countResult] = await executeQuery(countQuery, queryParams);
      const total = countResult.total;

      // Data query
      const dataQuery = `
        SELECT 
          b.*,
          s.name as supplier_full_name,
          COUNT(bi.id) as item_count
        FROM bills b
        LEFT JOIN suppliers s ON b.supplier_id = s.id
        LEFT JOIN bill_items bi ON b.id = bi.bill_id
        WHERE ${whereClause}
        GROUP BY b.id, b.bill_number, b.supplier_name, b.bill_date, b.total_amount, b.status, 
                 b.file_name, b.file_path, b.ocr_confidence, b.created_at, b.updated_at, s.name
        ORDER BY b.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const bills = await executeQuery(dataQuery, [
        ...queryParams,
        limit,
        offset,
      ]);

      res.json({
        bills: bills.map((bill) => ({
          id: bill.id,
          billNumber: bill.bill_number,
          supplier: bill.supplier_full_name || bill.supplier_name,
          date: bill.bill_date,
          totalAmount: parseFloat(bill.total_amount),
          status: bill.status,
          fileName: bill.file_name,
          itemCount: bill.item_count,
          ocrConfidence: parseFloat(bill.ocr_confidence),
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

  // Get bill by ID with items
  getBillById: async (req, res) => {
    try {
      const billId = req.params.id;

      const billQuery = `
        SELECT 
          b.*,
          s.name as supplier_full_name,
          s.email as supplier_email
        FROM bills b
        LEFT JOIN suppliers s ON b.supplier_id = s.id
        WHERE b.id = ?
      `;

      const [bill] = await executeQuery(billQuery, [billId]);

      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }

      const itemsQuery = `
        SELECT 
          bi.*,
          p.name as product_full_name,
          p.category as product_category
        FROM bill_items bi
        LEFT JOIN products p ON bi.product_id = p.id
        WHERE bi.bill_id = ?
        ORDER BY bi.id
      `;

      const items = await executeQuery(itemsQuery, [billId]);

      res.json({
        id: bill.id,
        billNumber: bill.bill_number,
        supplier: {
          id: bill.supplier_id,
          name: bill.supplier_full_name || bill.supplier_name,
          email: bill.supplier_email,
        },
        date: bill.bill_date,
        totalAmount: parseFloat(bill.total_amount),
        status: bill.status,
        fileName: bill.file_name,
        filePath: bill.file_path,
        ocrConfidence: parseFloat(bill.ocr_confidence),
        extractedData: bill.extracted_data,
        processedBy: bill.processed_by,
        notes: bill.notes,
        items: items.map((item) => ({
          id: item.id,
          productName: item.product_full_name || item.product_name,
          productId: item.product_id,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          lineTotal: parseFloat(item.line_total),
          ocrConfidence: parseFloat(item.ocr_confidence),
          notes: item.notes,
        })),
        createdAt: bill.created_at,
        updatedAt: bill.updated_at,
      });
    } catch (error) {
      console.error("Error fetching bill:", error);
      res.status(500).json({ error: "Failed to fetch bill" });
    }
  },

  // Upload and process bill (OCR simulation)
  uploadBill: (req, res) => {
    upload.single("bill")(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res
              .status(400)
              .json({ error: "File size too large. Maximum size is 10MB." });
          }
        }
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Simulate OCR processing
      const mockOCRData = {
        billNumber: `INV-${Date.now()}`,
        supplierName: "Auto-detected Supplier",
        date: new Date().toISOString().split("T")[0],
        items: [
          {
            name: "Sample Product 1",
            quantity: Math.floor(Math.random() * 10) + 1,
            price: (Math.random() * 100 + 10).toFixed(2),
            confidence: (Math.random() * 0.3 + 0.7).toFixed(2),
          },
          {
            name: "Sample Product 2",
            quantity: Math.floor(Math.random() * 5) + 1,
            price: (Math.random() * 200 + 20).toFixed(2),
            confidence: (Math.random() * 0.3 + 0.7).toFixed(2),
          },
        ],
        confidence: (Math.random() * 0.2 + 0.8).toFixed(2),
      };

      const totalAmount = mockOCRData.items.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0
      );

      res.json({
        success: true,
        message: "Bill processed successfully",
        extractedData: {
          ...mockOCRData,
          totalAmount: totalAmount.toFixed(2),
          fileName: req.file.filename,
          filePath: req.file.path,
        },
      });
    });
  },

  // Process OCR-extracted data and save to database
  processExtractedData: async (req, res) => {
    try {
      const {
        billNumber,
        supplierName,
        date,
        items,
        totalAmount,
        fileName,
        filePath,
        confidence,
      } = req.body;

      if (!billNumber || !supplierName || !date || !items || !totalAmount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if supplier exists
      let supplierId = null;
      const [existingSupplier] = await executeQuery(
        "SELECT id FROM suppliers WHERE name = ? OR LOWER(name) LIKE LOWER(?)",
        [supplierName, `%${supplierName}%`]
      );

      if (existingSupplier) {
        supplierId = existingSupplier.id;
      }

      // Insert bill
      const insertBillQuery = `
        INSERT INTO bills (
          bill_number, supplier_name, supplier_id, bill_date, total_amount,
          status, file_name, file_path, ocr_confidence, extracted_data, processed_by
        ) VALUES (?, ?, ?, ?, ?, 'processed', ?, ?, ?, ?, 'OCR System')
      `;

      const billResult = await executeQuery(insertBillQuery, [
        billNumber,
        supplierName,
        supplierId,
        date,
        totalAmount,
        fileName,
        filePath,
        confidence,
        JSON.stringify({ items, confidence }),
      ]);

      const billId = billResult.insertId;

      // Insert bill items
      for (const item of items) {
        // Try to find matching product
        let productId = null;
        const [existingProduct] = await executeQuery(
          "SELECT id FROM products WHERE LOWER(name) LIKE LOWER(?)",
          [`%${item.name}%`]
        );

        if (existingProduct) {
          productId = existingProduct.id;
        }

        const lineTotal = parseFloat(item.price) * item.quantity;

        const insertItemQuery = `
          INSERT INTO bill_items (
            bill_id, product_name, product_id, quantity, unit_price, line_total, ocr_confidence
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await executeQuery(insertItemQuery, [
          billId,
          item.name,
          productId,
          item.quantity,
          item.price,
          lineTotal,
          item.confidence,
        ]);
      }

      res.json({
        success: true,
        message: "Bill processed and saved successfully",
        billId: billId,
        billNumber: billNumber,
      });
    } catch (error) {
      console.error("Error processing extracted data:", error);
      res.status(500).json({ error: "Failed to process bill data" });
    }
  },

  // Update bill status
  updateBillStatus: async (req, res) => {
    try {
      const billId = req.params.id;
      const { status, notes } = req.body;

      if (
        !["unprocessed", "processed", "pending_review", "approved"].includes(
          status
        )
      ) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const result = await executeQuery(
        "UPDATE bills SET status = ?, notes = ?, updated_at = NOW() WHERE id = ?",
        [status, notes || "", billId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Bill not found" });
      }

      res.json({
        success: true,
        message: "Bill status updated successfully",
      });
    } catch (error) {
      console.error("Error updating bill status:", error);
      res.status(500).json({ error: "Failed to update bill status" });
    }
  },

  // Delete bill
  deleteBill: async (req, res) => {
    try {
      const billId = req.params.id;

      // Get file path before deletion
      const [bill] = await executeQuery(
        "SELECT file_path FROM bills WHERE id = ?",
        [billId]
      );

      const result = await executeQuery("DELETE FROM bills WHERE id = ?", [
        billId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Bill not found" });
      }

      // Delete file if exists
      if (bill && bill.file_path && fs.existsSync(bill.file_path)) {
        fs.unlinkSync(bill.file_path);
      }

      res.json({
        success: true,
        message: "Bill deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting bill:", error);
      res.status(500).json({ error: "Failed to delete bill" });
    }
  },

  // Get bills statistics
  getBillStats: async (req, res) => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_bills,
          COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed_bills,
          COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_review_bills,
          COUNT(CASE WHEN status = 'unprocessed' THEN 1 END) as unprocessed_bills,
          SUM(total_amount) as total_value,
          AVG(ocr_confidence) as avg_confidence
        FROM bills
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `;

      const [stats] = await executeQuery(query);

      res.json({
        totalBills: stats.total_bills || 0,
        processedBills: stats.processed_bills || 0,
        pendingReviewBills: stats.pending_review_bills || 0,
        unprocessedBills: stats.unprocessed_bills || 0,
        totalValue: parseFloat(stats.total_value) || 0,
        avgConfidence: parseFloat(stats.avg_confidence) || 0,
      });
    } catch (error) {
      console.error("Error fetching bills stats:", error);
      res.status(500).json({ error: "Failed to fetch bills statistics" });
    }
  },
};

module.exports = billsController;
