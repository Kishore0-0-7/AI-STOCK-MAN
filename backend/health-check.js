#!/usr/bin/env node

const { testConnection } = require("./config/database");

console.log("🔍 Running Backend Health Check...");
console.log("==================================");

// Test database connection
testConnection()
  .then((isConnected) => {
    if (isConnected) {
      console.log("✅ Database connection: OK");
    } else {
      console.log("❌ Database connection: FAILED");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.log("❌ Database connection: ERROR");
    console.error("Error:", error.message);
    process.exit(1);
  });

// Test required files
const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "server.js",
  "config/database.js",
  "routes/api.js",
  "controllers/dashboardController.js",
  "controllers/productsController.js",
  "controllers/suppliersController.js",
  "controllers/customersController.js",
  "controllers/billsController.js",
  "controllers/reportsController.js",
  "controllers/purchaseOrdersController.js",
  "controllers/alertsController.js",
];

console.log("\n📁 Checking required files...");
let allFilesExist = true;

requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log("\n❌ Some required files are missing!");
  process.exit(1);
}

// Test uploads directory
const uploadsDir = path.join(__dirname, "uploads");
const billsDir = path.join(uploadsDir, "bills");

console.log("\n📂 Checking upload directories...");
if (fs.existsSync(uploadsDir)) {
  console.log("✅ uploads/ directory exists");
} else {
  console.log("❌ uploads/ directory missing");
  allFilesExist = false;
}

if (fs.existsSync(billsDir)) {
  console.log("✅ uploads/bills/ directory exists");
} else {
  console.log("❌ uploads/bills/ directory missing");
  allFilesExist = false;
}

setTimeout(() => {
  if (allFilesExist) {
    console.log("\n🎉 Health Check Complete: All systems are ready!");
    console.log("✅ Database connection working");
    console.log("✅ All required files present");
    console.log("✅ Upload directories configured");
    console.log("\n🚀 Ready to start server with: npm start");
  } else {
    console.log("\n❌ Health Check Failed: Please fix the issues above");
    process.exit(1);
  }
}, 1000);
