# AI Stock Management System - Backend API

# AI Stock Management System - Backend API

A comprehensive Node.js/Express backend API for the AI Stock Management System featuring MVC architecture, separate controllers, centralized database management, and complete REST API coverage.

## 🏗️ Architecture

```
backend/
├── server.js                 # Main server file
├── package.json             # Dependencies and scripts
├── README.md                # Documentation
├── .gitignore               # Git ignore rules
├── config/
│   └── database.js         # Centralized database connection & table management
├── routes/
│   └── api.js             # Central API route definitions
├── controllers/           # Business logic controllers
│   ├── dashboardController.js    # Dashboard analytics & overview
│   ├── productsController.js     # Product & inventory management
│   ├── suppliersController.js    # Supplier management & performance
│   ├── customersController.js    # Customer relationship management
│   ├── billsController.js        # Bill processing & OCR simulation
│   ├── reportsController.js      # Comprehensive reporting & exports
│   ├── purchaseOrdersController.js # Purchase order workflows
│   └── alertsController.js       # Alert management & generation
└── uploads/               # File storage directory
    └── bills/            # Bill upload storage
```

## 🚀 Features

### Core APIs

- **Dashboard API** - Real-time analytics, trends, and KPIs
- **Products API** - Complete inventory management with stock tracking
- **Suppliers API** - Supplier management with performance metrics
- **Customers API** - Customer relationship management
- **Purchase Orders API** - Order processing and management
- **Bills API** - Bill upload, OCR processing, and management
- **Reports API** - Comprehensive reporting and data export
- **Alerts API** - Real-time stock alerts and notifications

### Advanced Features

- **File Upload Support** - Multer integration for bill/receipt uploads
- **OCR Simulation** - Mock OCR processing for bill data extraction
- **Stock Movement Tracking** - Complete audit trail for inventory changes
- **Performance Analytics** - Supplier and customer performance metrics
- **Export Functionality** - CSV export for reports and data
- **Real-time Statistics** - Dynamic dashboard with live data
- **Pagination Support** - Efficient data handling for large datasets
- **Search & Filtering** - Advanced querying capabilities

## 📁 Project Structure

```
backend/
├── server_final.cjs          # Main server file with all routes
├── package.json              # Dependencies and scripts
├── config/
│   └── db.cjs               # MySQL database configuration
├── routes/
│   ├── dashboard.cjs        # Dashboard analytics endpoints
│   ├── reports.cjs          # Reporting and export endpoints
│   ├── products_enhanced.cjs # Product management with inventory
│   ├── suppliers_enhanced.cjs # Supplier management and performance
│   ├── customers_enhanced.cjs # Customer relationship management
│   ├── purchase_orders.cjs  # Purchase order processing
│   ├── bills_enhanced.cjs   # Bill processing with OCR simulation
│   └── alerts.cjs          # Alert management system
├── uploads/
│   └── bills/              # Uploaded bill files storage
└── schema/
    └── *.sql               # Database schema files
```

### Automated Setup (Recommended)

1. **Run the setup script**

   ```bash
   cd backend/
   ./setup.sh
   ```

   This will automatically:

   - Install all dependencies
   - Create the MySQL database
   - Verify your environment

### Manual Installation

1. **Clone and navigate to backend directory**

   ```bash
   cd backend/
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Database Setup**

   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE ai_stock_management;
   exit
   ```

4. **Configure Database Connection**

   - Open `config/database.js`
   - Update the database credentials:

   ```javascript
   const dbConfig = {
     host: "localhost",
     user: "root",
     password: "your_password_here", // Update this
     database: "ai_stock_management",
     // ... other settings
   };
   ```

5. **Start the server**

   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

## 🔌 API Endpoints

### Dashboard API (`/api/dashboard`)

- `GET /overview` - Dashboard overview statistics
- `GET /activity` - Recent activity feed
- `GET /trends` - Stock trends and analytics
- `GET /alerts` - Active alerts and notifications
- `GET /forecast` - Demand forecasting data

### Products API (`/api/products`)

- `GET /` - List all products with pagination
- `GET /:id` - Get product details with stock history
- `POST /` - Create new product
- `PUT /:id` - Update product information
- `DELETE /:id` - Delete product
- `POST /:id/stock-movement` - Add stock movement
- `GET /stats/summary` - Product statistics
- `GET /stats/by-category` - Category-wise analysis
- `GET /low-stock` - Low stock products

### Suppliers API (`/api/suppliers`)

- `GET /` - List all suppliers with statistics
- `GET /:id` - Get supplier details with products/orders
- `POST /` - Create new supplier
- `PUT /:id` - Update supplier information
- `DELETE /:id` - Delete/deactivate supplier
- `GET /:id/performance` - Supplier performance metrics
- `GET /stats/summary` - Supplier statistics
- `GET /stats/top-performers` - Top performing suppliers

### Customers API (`/api/customers`)

- `GET /` - List all customers with statistics
- `GET /:id` - Get customer details with order history
- `POST /` - Create new customer
- `PUT /:id` - Update customer information
- `DELETE /:id` - Delete/deactivate customer
- `GET /search` - Search customers (for forms)
- `GET /stats/summary` - Customer statistics
- `GET /stats/top-customers` - Top customers by spending

### Bills API (`/api/bills`)

- `GET /` - List all bills with pagination
- `GET /:id` - Get bill details with items
- `POST /upload` - Upload bill for OCR processing
- `POST /process-extracted` - Process OCR extracted data
- `PATCH /:id/status` - Update bill status
- `DELETE /:id` - Delete bill
- `GET /stats/summary` - Bills processing statistics

### Reports API (`/api/reports`)

- `GET /sales` - Sales reports with filtering
- `GET /trends` - Sales trends analysis
- `GET /categories` - Category-wise sales analysis
- `GET /suppliers` - Supplier performance reports
- `GET /export` - Export reports as CSV

### Purchase Orders API (`/api/purchase-orders`)

- `GET /` - List all purchase orders
- `GET /:id` - Get purchase order details
- `POST /` - Create new purchase order
- `PUT /:id` - Update purchase order
- `DELETE /:id` - Delete purchase order
- `PATCH /:id/status` - Update order status

### Alerts API (`/api/alerts`)

- `GET /` - List all alerts
- `POST /` - Create new alert
- `PUT /:id` - Update alert
- `DELETE /:id` - Delete alert
- `PATCH /:id/status` - Update alert status

## 🗄 Database Schema

The system uses MySQL with the following main tables:

### Core Tables

- **products** - Product catalog with inventory tracking
- **suppliers** - Supplier information and contact details
- **customers** - Customer relationship management
- **purchase_orders** - Purchase order management
- **purchase_order_items** - Line items for orders
- **bills** - Bill/invoice management with OCR data
- **bill_items** - Line items from processed bills
- **stock_movements** - Complete inventory movement audit trail
- **alerts** - Alert management system

### Features

- **Auto-incrementing IDs** for all primary keys
- **Foreign key constraints** for data integrity
- **Indexes** for optimized query performance
- **JSON columns** for flexible data storage (OCR results)
- **Timestamps** for audit tracking
- **Status enums** for workflow management

## 🔧 Configuration Options

### Query Parameters

Most list endpoints support:

- `page` - Page number for pagination (default: 1)
- `limit` - Items per page (default: 50)
- `search` - Search across relevant fields
- `status` - Filter by status
- `category` - Filter by category
- `sortBy` - Sort field
- `sortOrder` - Sort direction (asc/desc)

### File Upload

Bills API supports file uploads:

- **Supported formats**: Images (JPG, PNG, PDF)
- **Maximum size**: 10MB
- **Storage**: Local filesystem (`uploads/bills/`)
- **OCR processing**: Simulated extraction with confidence scores

## 📊 Response Formats

### Standard List Response

```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

### Standard Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {...}
}
```

### Error Response

```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": {...}
}
```

## 🔍 Testing

### Health Check

```bash
curl http://localhost:4000/health
```

### API Documentation

Visit http://localhost:4000/ for interactive API documentation with all available endpoints and examples.

## 🚦 Error Handling

The API includes comprehensive error handling:

- **Validation errors** (400) - Invalid request data
- **Authentication errors** (401) - Unauthorized access
- **Authorization errors** (403) - Insufficient permissions
- **Not found errors** (404) - Resource not found
- **Server errors** (500) - Internal server errors

## 📈 Performance Features

- **Connection pooling** for database efficiency
- **Query optimization** with proper indexing
- **Pagination** for large datasets
- **Compression middleware** for reduced bandwidth
- **Rate limiting** for API protection
- **Caching strategies** for frequently accessed data

## 🔒 Security Features

- **CORS configuration** for cross-origin requests
- **Input validation** and sanitization
- **SQL injection protection** via parameterized queries
- **File upload validation** for security
- **Error message sanitization** to prevent information leakage

## 🔄 Development Workflow

### Development Mode

```bash
npm run dev  # Auto-restart on file changes
```

### Production Mode

```bash
npm start    # Standard production server
```

### Code Quality

```bash
npm run lint     # ESLint checking
npm run format   # Prettier formatting
npm test         # Run test suite
```

## 🤝 Integration with Frontend

This backend is designed to work seamlessly with the React frontend:

- **CORS enabled** for localhost:3000 and localhost:5173
- **RESTful API design** following standard conventions
- **JSON responses** compatible with frontend data structures
- **File upload support** for bill scanning features
- **Real-time data** for dashboard updates
- **Export functionality** for reporting features

## 📝 Development Notes

### Adding New Endpoints

1. Create route file in `routes/` directory
2. Implement CRUD operations with proper error handling
3. Add route to `server_final.cjs`
4. Update API documentation
5. Test endpoints with sample data

### Database Changes

1. Create migration scripts for schema changes
2. Update existing route handlers if needed
3. Test data integrity and relationships
4. Update API documentation for new fields

### File Upload Features

1. Configure multer for specific file types
2. Implement file validation and security checks
3. Add cleanup routines for old files
4. Consider cloud storage for production

This backend provides a solid foundation for the AI Stock Management System with room for future enhancements like authentication, real-time notifications, advanced analytics, and third-party integrations.
