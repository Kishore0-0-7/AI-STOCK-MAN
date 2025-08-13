# AI Stock Management System - Backend API

A comprehensive Express.js backend API for the AI Stock Management System with MySQL database integration.

## 🚀 Features

- **Dashboard Analytics**: Complete dashboard metrics and KPIs
- **Real-time Data**: Live stock movements and alerts
- **Modular Architecture**: Clean separation of concerns
- **Error Handling**: Comprehensive error handling and validation
- **Security**: Rate limiting, CORS, helmet security headers
- **Database**: MySQL with connection pooling
- **Logging**: Request logging and error tracking

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone and navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   NODE_ENV=development
   PORT=5000

   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=ai_stock_management
   DB_PORT=3306

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d

   # CORS Configuration
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Database Setup**

   Make sure your MySQL database is running and execute the schema:

   ```bash
   mysql -u root -p ai_stock_management < ../database/ai_stock_management_schema.sql
   ```

5. **Start the server**

   Development mode:

   ```bash
   npm run dev
   ```

   Production mode:

   ```bash
   npm start
   ```

## 🌐 API Endpoints

### Dashboard Endpoints

| Method | Endpoint                              | Description                |
| ------ | ------------------------------------- | -------------------------- |
| GET    | `/api/v1/dashboard/overview`          | Dashboard overview metrics |
| GET    | `/api/v1/dashboard/activity`          | Recent user activities     |
| GET    | `/api/v1/dashboard/trends`            | Trends data for charts     |
| GET    | `/api/v1/dashboard/stock-summary`     | Stock summary by category  |
| GET    | `/api/v1/dashboard/alerts`            | Active alerts              |
| GET    | `/api/v1/dashboard/stock-movements`   | Recent stock movements     |
| GET    | `/api/v1/dashboard/sales-metrics`     | Sales analytics            |
| GET    | `/api/v1/dashboard/purchase-metrics`  | Purchase analytics         |
| GET    | `/api/v1/dashboard/warehouse-metrics` | Warehouse utilization      |
| GET    | `/api/v1/dashboard/quality-metrics`   | Quality control metrics    |
| POST   | `/api/v1/dashboard/activity`          | Log user activity          |

### Products Endpoints

| Method | Endpoint                      | Description                  |
| ------ | ----------------------------- | ---------------------------- |
| GET    | `/api/v1/products`            | Get all products             |
| GET    | `/api/v1/products/low-stock`  | Get low stock products       |
| GET    | `/api/v1/products/categories` | Get product categories       |
| GET    | `/api/v1/products/:id`        | Get product by ID            |
| POST   | `/api/v1/products`            | Create new product           |
| PUT    | `/api/v1/products/:id`        | Update product               |
| DELETE | `/api/v1/products/:id`        | Delete product (soft delete) |

### Alerts Endpoints

| Method | Endpoint                            | Description                         |
| ------ | ----------------------------------- | ----------------------------------- |
| GET    | `/api/v1/alerts`                    | Get all alerts                      |
| GET    | `/api/v1/alerts/stats`              | Get alert statistics                |
| GET    | `/api/v1/alerts/:id`                | Get alert by ID                     |
| POST   | `/api/v1/alerts`                    | Create new alert                    |
| POST   | `/api/v1/alerts/generate-low-stock` | Auto-generate low stock alerts      |
| PUT    | `/api/v1/alerts/:id`                | Update alert (acknowledge, resolve) |
| DELETE | `/api/v1/alerts/:id`                | Delete/dismiss alert                |

### Query Parameters

Most GET endpoints support these query parameters:

- `limit` (number): Maximum number of results (1-100, default: 10)
- `period` (number): Time period in days (1-365, default: 30)
- `type` (string): Filter by type
- `priority` (string): Filter by priority (low, medium, high, critical)
- `status` (string): Filter by status
- `category` (string): Filter by category

### Example Requests

**Get Dashboard Overview:**

```bash
curl http://localhost:5000/api/v1/dashboard/overview
```

**Get Active Alerts with Filters:**

```bash
curl "http://localhost:5000/api/v1/dashboard/alerts?limit=20&priority=high&type=low_stock"
```

**Get Sales Metrics for Last 7 Days:**

```bash
curl "http://localhost:5000/api/v1/dashboard/sales-metrics?period=7"
```

**Log User Activity:**

```bash
curl -X POST http://localhost:5000/api/v1/dashboard/activity \
  -H "Content-Type: application/json" \
  -d '{
    "activity_type": "create",
    "table_name": "products",
    "description": "Created new product",
    "user_name": "John Doe",
    "user_role": "admin"
  }'
```

## 📊 Response Format

All API responses follow this format:

**Success Response:**

```json
{
  "success": true,
  "data": {...},
  "timestamp": "2024-01-13T10:30:00.000Z"
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2024-01-13T10:30:00.000Z",
  "path": "/api/v1/dashboard/overview",
  "method": "GET"
}
```

**Validation Error:**

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "user_name",
      "message": "user_name is required",
      "type": "any.required"
    }
  ],
  "timestamp": "2024-01-13T10:30:00.000Z"
}
```

## 🏗️ Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   └── dashboardController.js # Dashboard business logic
├── middleware/
│   ├── errorHandler.js       # Error handling middleware
│   └── validation.js         # Input validation
├── routes/
│   └── dashboard.js          # Dashboard routes
├── .env.example             # Environment template
├── package.json            # Dependencies
├── server.js              # Main application file
└── README.md             # This file
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Parameterized queries
- **Error Handling**: No sensitive data in error responses

## 📈 Health Check

Check if the server is running:

```bash
curl http://localhost:5000/health
```

Response:

```json
{
  "status": "OK",
  "timestamp": "2024-01-13T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

## 🧪 Testing

Run tests (when available):

```bash
npm test
```

## 📝 Logging

The application uses Morgan for HTTP request logging:

- Development: Detailed colored logs
- Production: Common log format

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a process manager like PM2
3. Set up reverse proxy with Nginx
4. Use environment variables for sensitive data
5. Enable SSL/HTTPS

## 🤝 Contributing

1. Follow the existing code structure
2. Add validation for new endpoints
3. Handle errors appropriately
4. Add documentation for new endpoints
5. Test your changes

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support or questions:

- Check the database connection
- Verify environment variables
- Check server logs for errors
- Ensure MySQL service is running

## 🔮 Future Enhancements

- Authentication and authorization
- File upload endpoints
- WebSocket for real-time updates
- API versioning
- Caching layer
- Automated tests
- API documentation with Swagger
- Docker containerization
