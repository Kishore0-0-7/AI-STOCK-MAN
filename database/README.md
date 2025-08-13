# Database Configuration

# AI Stock Management System Database Setup

## Database Information

- **Database Name:** ai_stock_management
- **Charset:** utf8mb4
- **Collation:** utf8mb4_unicode_ci
- **Engine:** InnoDB (default)

## Connection Parameters

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ai_stock_management
DB_USER=your_username
DB_PASSWORD=your_password
DB_CHARSET=utf8mb4
DB_COLLATE=utf8mb4_unicode_ci
```

## Tables Overview

### Core Business Entities (19 Tables)

1. **suppliers** - Vendor/supplier management
2. **categories** - Product categorization with hierarchy
3. **products** - Main product catalog
4. **customers** - Customer information
5. **warehouses** - Storage facility management
6. **storage_racks** - Detailed storage location tracking
7. **stock_movements** - All inventory transactions
8. **purchase_orders** - Procurement management
9. **purchase_order_items** - PO line items
10. **customer_orders** - Sales order management
11. **customer_order_items** - Sales order line items
12. **raw_materials** - Production materials
13. **bill_of_materials** - Product recipes/compositions
14. **production_orders** - Manufacturing orders
15. **quality_checks** - QC inspection records
16. **qc_hold_items** - Items under quality hold
17. **alerts** - System notifications and alerts
18. **activity_log** - Audit trail and activity tracking
19. **system_settings** - Configuration management

### Views (4 Analytical Views)

1. **dashboard_overview** - Key metrics for dashboard
2. **low_stock_products** - Products below threshold
3. **sales_analytics** - Daily sales performance
4. **storage_utilization** - Warehouse utilization metrics

### Stored Procedures (2 Business Logic)

1. **GetReorderSuggestions()** - Smart reorder recommendations
2. **GetStockMovementTrends(days)** - Movement analysis

## Key Features

### 🔄 Automated Stock Management

- **Real-time Stock Updates:** Triggers automatically update product stock levels
- **Low Stock Alerts:** Automatic alert generation when stock hits threshold
- **Movement Tracking:** Complete audit trail of all stock movements

### 📊 Advanced Analytics

- **Dashboard Metrics:** Pre-calculated KPIs for instant dashboard loading
- **Sales Trends:** Historical sales data with profit calculations
- **Storage Optimization:** Rack-level utilization tracking with heat maps

### 🏭 Production Management

- **Bill of Materials:** Recipe management with wastage calculations
- **Production Orders:** Full production lifecycle tracking
- **Raw Material Planning:** Consumption-based material requirements

### 🔍 Quality Control

- **Multi-stage QC:** Incoming, in-process, and final inspections
- **Hold Management:** Items under quality review
- **Defect Tracking:** Categorized defect management

### 🚨 Smart Alerting

- **Multi-type Alerts:** Stock, quality, expiry, and system alerts
- **Priority Management:** Critical, high, medium, low priorities
- **Auto-resolution:** Configurable auto-resolution conditions

### 📈 Business Intelligence

- **Activity Logging:** Complete user action audit trail
- **Trend Analysis:** Historical performance tracking
- **Predictive Analytics:** Ready for ML integration

## Performance Optimizations

### Indexing Strategy

- **Primary Indexes:** All foreign keys and status fields
- **Composite Indexes:** Multi-column queries (product+date, supplier+status)
- **Full-text Search:** Product names, descriptions, and supplier details
- **Partial Indexes:** Conditional indexes for active records

### Database Design Patterns

- **Generated Columns:** Calculated fields (pending quantities, utilizations)
- **JSON Support:** Flexible data storage for configurations and arrays
- **Soft Deletes:** Status-based record management
- **Audit Trails:** Comprehensive change tracking

## Frontend Integration Points

### Dashboard.tsx Integration

```sql
-- Overview metrics
SELECT * FROM dashboard_overview;

-- Recent activity
SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10;

-- Sales trends
SELECT * FROM sales_analytics WHERE order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY);
```

### Products.tsx Integration

```sql
-- Product listing with supplier info
SELECT p.*, c.name as category_name, s.name as supplier_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id;

-- Low stock products
SELECT * FROM low_stock_products;
```

### PurchaseOrders.tsx Integration

```sql
-- Purchase orders with supplier details
SELECT po.*, s.name as supplier_name, s.email as supplier_email
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.id;

-- PO items with product details
SELECT poi.*, p.name as product_name, p.sku
FROM purchase_order_items poi
JOIN products p ON poi.product_id = p.id
WHERE poi.purchase_order_id = ?;
```

### QcDashboard.tsx Integration

```sql
-- QC metrics
SELECT
    COUNT(*) as total_inspections,
    AVG(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) * 100 as rejection_rate,
    SUM(CASE WHEN status = 'fail' THEN quantity_inspected ELSE 0 END) as scrap_quantity
FROM quality_checks
WHERE inspection_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY);

-- Hold items
SELECT * FROM qc_hold_items WHERE status = 'hold';
```

### StorageUtilizationDashboard.tsx Integration

```sql
-- Storage utilization overview
SELECT * FROM storage_utilization;

-- Rack heat map data
SELECT position_x, position_y,
       (occupied_units / capacity_units * 100) as utilization_percentage,
       rack_code
FROM storage_racks
WHERE warehouse_id = ?;
```

## Security Considerations

### Data Protection

- **UUID Primary Keys:** Non-sequential, non-predictable identifiers
- **Input Validation:** Proper data types and constraints
- **Audit Logging:** Complete change tracking with user attribution

### Access Control

- **Role-based Security:** User roles in activity logging
- **Data Isolation:** Proper foreign key constraints
- **Soft Deletes:** Status-based record management instead of hard deletes

## Backup and Maintenance

### Regular Maintenance Tasks

```sql
-- Clean old activity logs (keep 1 year)
DELETE FROM activity_log WHERE created_at < DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR);

-- Clean resolved alerts (keep 3 months)
DELETE FROM alerts WHERE status = 'resolved' AND resolved_at < DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH);

-- Update storage rack utilization
UPDATE storage_racks sr
SET occupied_units = (
    SELECT COALESCE(SUM(current_stock), 0)
    FROM products p
    WHERE p.location = sr.rack_code
);
```

### Backup Strategy

- **Daily Full Backup:** Complete database backup
- **Hourly Transaction Log:** Point-in-time recovery
- **Weekly Schema Backup:** Structure-only backup

## Migration and Scaling

### Horizontal Scaling

- **Read Replicas:** For reporting and analytics
- **Partitioning:** Time-based partitioning for stock_movements and activity_log
- **Caching:** Redis integration for dashboard metrics

### Data Archiving

- **Historical Data:** Move old transactions to archive tables
- **Compression:** Use MySQL compression for archived data
- **Purging:** Automated cleanup of temporary data

This database schema is production-ready and optimized for your AI Stock Management system's requirements.
