const express = require("express");
const router = express.Router();
const db = require("../config/db.cjs");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads (bills/receipts)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/bills/");
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

// Create bills table if it doesn't exist
const createBillsTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS bills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_number VARCHAR(100) NOT NULL,
      supplier_name VARCHAR(255) NOT NULL,
      supplier_id INT NULL,
      bill_date DATE NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      status ENUM('unprocessed', 'processed', 'pending_review', 'approved') DEFAULT 'unprocessed',
      file_name VARCHAR(255),
      file_path VARCHAR(500),
      ocr_confidence DECIMAL(3,2) DEFAULT 0.00,
      extracted_data JSON,
      processed_by VARCHAR(255) DEFAULT 'System',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
      INDEX idx_bill_number (bill_number),
      INDEX idx_supplier (supplier_id),
      INDEX idx_status (status),
      INDEX idx_date (bill_date)
    )
  `;

  const createBillItemsTable = `
    CREATE TABLE IF NOT EXISTS bill_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_id INT NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      product_id INT NULL,
      quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      line_total DECIMAL(10,2) NOT NULL,
      ocr_confidence DECIMAL(3,2) DEFAULT 0.00,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
      INDEX idx_bill (bill_id),
      INDEX idx_product (product_id)
    )
  `;

  db.query(createTableQuery, (err) => {
    if (err) console.error("Error creating bills table:", err);
  });

  db.query(createBillItemsTable, (err) => {
    if (err) console.error("Error creating bill_items table:", err);
  });
};

createBillsTable();

// Get all bills with pagination
router.get("/", (req, res) => {
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

  const countQuery = `SELECT COUNT(*) as total FROM bills b WHERE ${whereClause}`;
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

  // Get total count
  db.query(countQuery, queryParams, (err, countResult) => {
    if (err) {
      console.error("Error counting bills:", err);
      return res.status(500).json({ error: "Failed to count bills" });
    }

    const total = countResult[0].total;

    // Get bills data
    db.query(dataQuery, [...queryParams, limit, offset], (err, results) => {
      if (err) {
        console.error("Error fetching bills:", err);
        return res.status(500).json({ error: "Failed to fetch bills" });
      }

      res.json({
        bills: results.map((bill) => ({
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
    });
  });
});

// Get bill details with items
router.get("/:id", (req, res) => {
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

  db.query(billQuery, [billId], (err, billResult) => {
    if (err) {
      console.error("Error fetching bill:", err);
      return res.status(500).json({ error: "Failed to fetch bill" });
    }

    if (billResult.length === 0) {
      return res.status(404).json({ error: "Bill not found" });
    }

    const bill = billResult[0];

    db.query(itemsQuery, [billId], (err, itemsResult) => {
      if (err) {
        console.error("Error fetching bill items:", err);
        return res.status(500).json({ error: "Failed to fetch bill items" });
      }

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
        items: itemsResult.map((item) => ({
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
    });
  });
});

// Upload and process bill (OCR simulation)
router.post("/upload", upload.single("bill"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Simulate OCR processing - in real implementation, you'd use OCR library like Tesseract
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

  // Store the OCR result temporarily (you might want to use Redis or session storage)
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

// Process OCR-extracted data and save to database
router.post("/process-extracted", (req, res) => {
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

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).json({ error: "Database transaction failed" });
    }

    // Check if supplier exists or create new one
    const findSupplierQuery = `SELECT id FROM suppliers WHERE name = ? OR LOWER(name) LIKE LOWER(?)`;
    db.query(
      findSupplierQuery,
      [supplierName, `%${supplierName}%`],
      (err, supplierResults) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error finding supplier:", err);
            res.status(500).json({ error: "Failed to process bill" });
          });
        }

        let supplierId = null;
        if (supplierResults.length > 0) {
          supplierId = supplierResults[0].id;
        }

        // Insert bill
        const insertBillQuery = `
        INSERT INTO bills (
          bill_number, supplier_name, supplier_id, bill_date, total_amount,
          status, file_name, file_path, ocr_confidence, extracted_data, processed_by
        ) VALUES (?, ?, ?, ?, ?, 'processed', ?, ?, ?, ?, 'OCR System')
      `;

        db.query(
          insertBillQuery,
          [
            billNumber,
            supplierName,
            supplierId,
            date,
            totalAmount,
            fileName,
            filePath,
            confidence,
            JSON.stringify({ items, confidence }),
          ],
          (err, billResult) => {
            if (err) {
              return db.rollback(() => {
                console.error("Error inserting bill:", err);
                res.status(500).json({ error: "Failed to save bill" });
              });
            }

            const billId = billResult.insertId;

            // Insert bill items
            const insertItemsPromises = items.map((item) => {
              return new Promise((resolve, reject) => {
                // Try to find matching product
                const findProductQuery = `SELECT id FROM products WHERE LOWER(name) LIKE LOWER(?)`;
                db.query(
                  findProductQuery,
                  [`%${item.name}%`],
                  (err, productResults) => {
                    if (err) return reject(err);

                    const productId =
                      productResults.length > 0 ? productResults[0].id : null;
                    const lineTotal = parseFloat(item.price) * item.quantity;

                    const insertItemQuery = `
                INSERT INTO bill_items (
                  bill_id, product_name, product_id, quantity, unit_price, line_total, ocr_confidence
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
              `;

                    db.query(
                      insertItemQuery,
                      [
                        billId,
                        item.name,
                        productId,
                        item.quantity,
                        item.price,
                        lineTotal,
                        item.confidence,
                      ],
                      (err) => {
                        if (err) return reject(err);
                        resolve();
                      }
                    );
                  }
                );
              });
            });

            Promise.all(insertItemsPromises)
              .then(() => {
                db.commit((err) => {
                  if (err) {
                    return db.rollback(() => {
                      console.error("Error committing transaction:", err);
                      res.status(500).json({ error: "Failed to save bill" });
                    });
                  }

                  res.json({
                    success: true,
                    message: "Bill processed and saved successfully",
                    billId: billId,
                    billNumber: billNumber,
                  });
                });
              })
              .catch((err) => {
                db.rollback(() => {
                  console.error("Error inserting bill items:", err);
                  res.status(500).json({ error: "Failed to save bill items" });
                });
              });
          }
        );
      }
    );
  });
});

// Update bill status
router.patch("/:id/status", (req, res) => {
  const billId = req.params.id;
  const { status, notes } = req.body;

  if (
    !["unprocessed", "processed", "pending_review", "approved"].includes(status)
  ) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const query = `
    UPDATE bills 
    SET status = ?, notes = ?, updated_at = NOW()
    WHERE id = ?
  `;

  db.query(query, [status, notes || "", billId], (err, result) => {
    if (err) {
      console.error("Error updating bill status:", err);
      return res.status(500).json({ error: "Failed to update bill status" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Bill not found" });
    }

    res.json({
      success: true,
      message: "Bill status updated successfully",
    });
  });
});

// Delete bill
router.delete("/:id", (req, res) => {
  const billId = req.params.id;

  const query = `DELETE FROM bills WHERE id = ?`;

  db.query(query, [billId], (err, result) => {
    if (err) {
      console.error("Error deleting bill:", err);
      return res.status(500).json({ error: "Failed to delete bill" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Bill not found" });
    }

    res.json({
      success: true,
      message: "Bill deleted successfully",
    });
  });
});

// Get bills statistics
router.get("/stats/summary", (req, res) => {
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

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching bills stats:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch bills statistics" });
    }

    const stats = results[0];
    res.json({
      totalBills: stats.total_bills || 0,
      processedBills: stats.processed_bills || 0,
      pendingReviewBills: stats.pending_review_bills || 0,
      unprocessedBills: stats.unprocessed_bills || 0,
      totalValue: parseFloat(stats.total_value) || 0,
      avgConfidence: parseFloat(stats.avg_confidence) || 0,
    });
  });
});

module.exports = router;
