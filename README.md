# AI Stock Management System

A comprehensive warehouse management system built with React, Node.js, Express, and MySQL featuring role-based authentication and real-time inventory management.

## 🚀 Features

### Core Functionality

- **Dashboard**: Real-time warehouse overview with analytics
- **Inventory Management**: Stock tracking, low stock alerts, stock adjustments
- **Product Management**: Complete CRUD operations for products
- **Supplier Management**: Vendor information and purchase orders
- **Quality Control**: QC processes and inspection workflows
- **Production Planning**: Production calculator and scheduling
- **Inbound/Outbound Operations**: Receiving and shipping management
- **Storage Utilization**: Warehouse space optimization
- **Employee Management**: User account and role management (Admin only)

### Authentication & Security

- **JWT-based Authentication**: Secure token-based login system
- **Role-based Access Control**: 9 different user roles with specific permissions
- **Protected Routes**: Component-level access control
- **Password Encryption**: bcrypt hashing for secure password storage

## 🏗️ Architecture

### Frontend (React + TypeScript)

- **Framework**: React 18 with TypeScript
- **UI Library**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context for authentication
- **Routing**: React Router v6 with protected routes
- **HTTP Client**: Fetch API with JWT token handling

### Backend (Node.js + Express)

- **Runtime**: Node.js with Express.js
- **Database**: MySQL with connection pooling
- **Authentication**: JWT tokens with bcrypt password hashing
- **Middleware**: Request validation, error handling, CORS
- **API Design**: RESTful endpoints with proper HTTP status codes

### Database (MySQL)

- **Users Table**: Employee accounts with roles and permissions
- **Products Table**: Inventory items and stock levels
- **Suppliers Table**: Vendor information
- **Activity Logs**: Audit trail for user actions
- **Sessions Table**: JWT token management (optional)

## 📋 Prerequisites

Before running the application, ensure you have:

- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **npm** or **yarn** package manager

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Kishore0-0-7/AI-STOCK-MAN.git
cd AI-STOCK-MAN
```

### 2. Database Setup

1. Create a MySQL database:

```sql
CREATE DATABASE ai_stock_management;
```

2. Run the database migrations:

```bash
cd database
mysql -u your_username -p ai_stock_management < users_migration.sql
```

3. Update database configuration in `backend/config/database.js`:

```javascript
const dbConfig = {
  host: "localhost",
  user: "your_mysql_username",
  password: "your_mysql_password",
  database: "ai_stock_management",
};
```

### 3. Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend server will start on `http://localhost:3001`

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## 👥 User Roles & Test Accounts

The system includes 9 different user roles, each with specific permissions and access levels:

### 🔴 Super Admin

- **Email**: `admin@warehouse.com`
- **Password**: `admin123`
- **Department**: Administration
- **Permissions**: Complete system access, user management, all operations

### 🔵 Warehouse Manager

- **Email**: `manager@warehouse.com`
- **Password**: `admin123`
- **Department**: Management
- **Permissions**: Full warehouse operations, staff oversight, reporting

### 🟢 Inventory Manager

- **Email**: `inventory@warehouse.com`
- **Password**: `admin123`
- **Department**: Inventory
- **Permissions**: Stock management, product operations, inbound/outbound

### 🟣 Quality Controller

- **Email**: `qc@warehouse.com`
- **Password**: `admin123`
- **Department**: Quality Control
- **Permissions**: QC processes, inspection workflows, quality reports

### 🟠 Production Supervisor

- **Email**: `production@warehouse.com`
- **Password**: `admin123`
- **Department**: Production
- **Permissions**: Production planning, calculator access, manufacturing oversight

### 🔵 Logistics Coordinator

- **Email**: `logistics@warehouse.com`
- **Password**: `admin123`
- **Department**: Logistics
- **Permissions**: Shipping, receiving, transportation management

### 🟡 Purchase Manager

- **Email**: `purchase@warehouse.com`
- **Password**: `admin123`
- **Department**: Procurement
- **Permissions**: Supplier management, purchase orders, procurement

### 🟤 Store Keeper

- **Email**: `keeper@warehouse.com`
- **Password**: `admin123`
- **Department**: Storage
- **Permissions**: Basic stock operations, storage management

### ⚫ Viewer

- **Email**: `viewer@warehouse.com`
- **Password**: `admin123`
- **Department**: General
- **Permissions**: Read-only access to warehouse data

## 🔐 Permission Matrix

| Feature               | Super Admin | Warehouse Mgr | Inventory Mgr | QC  | Production | Logistics | Purchase | Store Keeper | Viewer |
| --------------------- | ----------- | ------------- | ------------- | --- | ---------: | --------: | -------- | ------------ | ------ |
| Dashboard             | ✅          | ✅            | ✅            | ✅  |         ✅ |        ✅ | ✅       | ✅           | ✅     |
| Product Management    | ✅          | ✅            | ✅            | 👁️  |         👁️ |        👁️ | 👁️       | 👁️           | 👁️     |
| Stock Management      | ✅          | ✅            | ✅            | 👁️  |         👁️ |        👁️ | 👁️       | ✅           | 👁️     |
| Supplier Management   | ✅          | ✅            | 👁️            | ❌  |         ❌ |        👁️ | ✅       | ❌           | 👁️     |
| Inbound Operations    | ✅          | ✅            | ✅            | 👁️  |         👁️ |        👁️ | ✅       | 👁️           | 👁️     |
| Outbound Operations   | ✅          | ✅            | ✅            | ❌  |         👁️ |        ✅ | ❌       | 👁️           | 👁️     |
| Quality Control       | ✅          | ✅            | ❌            | ✅  |         👁️ |        ❌ | ❌       | ❌           | 👁️     |
| Production Calculator | ✅          | ✅            | ❌            | ❌  |         ✅ |        ❌ | ❌       | ❌           | 👁️     |
| Storage Utilization   | ✅          | ✅            | ✅            | ❌  |         ❌ |        ✅ | ❌       | ✅           | 👁️     |
| Employee Management   | ✅          | 👁️            | ❌            | ❌  |         ❌ |        ❌ | ❌       | ❌           | ❌     |
| Settings              | ✅          | 👁️            | ❌            | ❌  |         ❌ |        ❌ | ❌       | ❌           | ❌     |

**Legend**: ✅ Full Access | 👁️ View Only | ❌ No Access

## 🌐 API Endpoints

### Authentication

```
POST /api/auth/login          # User login
POST /api/auth/logout         # User logout
GET  /api/auth/me            # Get current user info
POST /api/auth/change-password # Change password
```

### Employee Management

```
GET    /api/employees         # Get all employees (Admin only)
POST   /api/employees         # Create new employee (Admin only)
PUT    /api/employees/:id     # Update employee (Admin only)
DELETE /api/employees/:id     # Delete employee (Admin only)
PATCH  /api/employees/:id/toggle-status # Toggle employee status
```

### Products

```
GET    /api/products          # Get all products
POST   /api/products          # Create new product
PUT    /api/products/:id      # Update product
DELETE /api/products/:id      # Delete product
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3001
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
MYSQL_HOST=localhost
MYSQL_USER=your_mysql_username
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=ai_stock_management
```

### Frontend Configuration

Update `frontend/src/services/authApi.ts` if needed:

```javascript
const API_BASE_URL = "http://localhost:3001/api";
```

## 🚀 Usage

1. **Start the Backend**: Run `npm run dev` in the backend directory
2. **Start the Frontend**: Run `npm run dev` in the frontend directory
3. **Access the Application**: Open `http://localhost:5173`
4. **Login**: Use any of the test accounts listed above
5. **Explore**: Navigate through different modules based on your role permissions

## 🧪 Testing Different Roles

To test the role-based system:

1. **Admin Testing**: Login as `admin@warehouse.com` to access employee management
2. **Manager Testing**: Login as `manager@warehouse.com` to see management features
3. **Specialist Testing**: Login with role-specific accounts to see limited access
4. **Viewer Testing**: Login as `viewer@warehouse.com` to see read-only interface

## 📱 Responsive Design

The application is fully responsive and works on:

- **Desktop**: Full feature access with sidebar navigation
- **Tablet**: Adaptive layout with touch-friendly controls
- **Mobile**: Mobile-first design with drawer navigation

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 12 rounds for password security
- **Route Protection**: Frontend and backend route guards
- **Role Validation**: Server-side permission checking
- **CORS Protection**: Configured for development and production
- **Input Validation**: Request validation middleware

## 📊 Database Schema

### Users Table

```sql
- id (Primary Key)
- email (Unique)
- password (Hashed)
- full_name
- role (Enum: 9 roles)
- department
- phone
- avatar
- status (active/inactive)
- last_login
- created_at
- updated_at
```

## 🛠️ Development

### Adding New Features

1. Backend: Add routes in `/backend/routes/`
2. Frontend: Add pages in `/frontend/src/pages/`
3. Update permissions in `AuthContext.tsx` if needed
4. Add navigation items in `Layout.tsx`

### Code Structure

```
AI-STOCK-MAN/
├── backend/                 # Node.js/Express backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Authentication & validation
│   ├── routes/            # API routes
│   └── server.js          # Main server file
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── hooks/         # Custom hooks
│   └── public/            # Static assets
└── database/              # SQL migrations
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Contact: [Your Email]
- Documentation: Check the code comments and this README

---

**Note**: This is a development version. For production deployment, ensure to:

- Use environment variables for all sensitive data
- Enable HTTPS
- Configure proper CORS settings
- Set up proper database backup procedures
- Implement proper logging and monitoring
