# 🚀 Quick Start Guide

## Getting Started in 3 Steps

### Step 1: Setup

```bash
cd backend/
./setup.sh
```

### Step 2: Configure Database

Edit `config/database.js` and update your MySQL password:

```javascript
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "YOUR_MYSQL_PASSWORD_HERE", // <-- Change this
  database: "ai_stock_management",
  // ... rest of config
};
```

### Step 3: Start Server

```bash
npm start
```

## 🔍 Health Check

Before starting, run a health check:

```bash
npm run health
```

## 📡 Access Your API

- **API Documentation**: http://localhost:4000/
- **Health Check**: http://localhost:4000/api/health
- **Dashboard Data**: http://localhost:4000/api/dashboard/overview

## 🛠️ Development Commands

| Command          | Description             |
| ---------------- | ----------------------- |
| `npm start`      | Start production server |
| `npm run dev`    | Start with auto-restart |
| `npm run health` | Run health check        |
| `npm run setup`  | Run setup script        |

## ⚡ Quick Test

Test your API with curl:

```bash
# Health check
curl http://localhost:4000/api/health

# Get dashboard overview
curl http://localhost:4000/api/dashboard/overview

# List products
curl http://localhost:4000/api/products
```

## 🎯 What's Included

✅ **8 Controllers** - Complete business logic  
✅ **Database Auto-Setup** - Tables created automatically  
✅ **File Upload Support** - Ready for bill processing  
✅ **Comprehensive APIs** - Full CRUD operations  
✅ **Health Monitoring** - Built-in health checks  
✅ **Documentation** - Interactive API docs

## 🆘 Troubleshooting

**Database Connection Failed?**

- Check MySQL is running: `sudo service mysql status`
- Verify credentials in `config/database.js`
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

**Port Already in Use?**

- Change port in `server.js`: `const PORT = 5000;`
- Or kill process: `sudo lsof -ti:4000 | xargs kill -9`

**Dependencies Issues?**

- Clear cache: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`

---

**Happy Coding! 🎉**
