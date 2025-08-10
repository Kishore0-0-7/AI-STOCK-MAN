CREATE DATABASE  IF NOT EXISTS `ai_stock_management` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `ai_stock_management`;
-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: ai_stock_management
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alerts`
--

DROP TABLE IF EXISTS `alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alerts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('low_stock','out_of_stock','expired_product','overdue_payment') NOT NULL,
  `priority` enum('low','medium','high','critical') DEFAULT 'medium',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `related_id` int DEFAULT NULL,
  `status` enum('active','acknowledged','resolved') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_priority` (`priority`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alerts`
--

LOCK TABLES `alerts` WRITE;
/*!40000 ALTER TABLE `alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bill_items`
--

DROP TABLE IF EXISTS `bill_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bill_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bill_id` int NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `line_total` decimal(10,2) NOT NULL,
  `ocr_confidence` decimal(3,2) DEFAULT '0.00',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bill` (`bill_id`),
  KEY `idx_product` (`product_id`),
  CONSTRAINT `bill_items_ibfk_1` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bill_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill_items`
--

LOCK TABLES `bill_items` WRITE;
/*!40000 ALTER TABLE `bill_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `bill_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bills`
--

DROP TABLE IF EXISTS `bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bill_number` varchar(100) NOT NULL,
  `supplier_name` varchar(255) NOT NULL,
  `supplier_id` int DEFAULT NULL,
  `bill_date` date NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('unprocessed','processed','pending_review','approved') DEFAULT 'unprocessed',
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `ocr_confidence` decimal(3,2) DEFAULT '0.00',
  `extracted_data` json DEFAULT NULL,
  `processed_by` varchar(255) DEFAULT 'System',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bill_number` (`bill_number`),
  KEY `idx_supplier` (`supplier_id`),
  KEY `idx_status` (`status`),
  KEY `idx_date` (`bill_date`),
  CONSTRAINT `bills_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bills`
--

LOCK TABLES `bills` WRITE;
/*!40000 ALTER TABLE `bills` DISABLE KEYS */;
INSERT INTO `bills` VALUES (1,'INV-TS-001','Tech Supply C',1,'2024-08-01',2879.85,'processed','tech_supply_invoice_001.pdf',NULL,0.95,'{\"items\": [{\"name\": \"Wireless Mouse\", \"price\": 18.5, \"quantity\": 50}, {\"name\": \"Bluetooth Keyboard\", \"price\": 55.0, \"quantity\": 30}]}','System','Monthly electronics order invoice','2025-08-09 21:54:56','2025-08-10 10:06:06'),(2,'INV-OD-002','Office Depot Plus',2,'2024-08-03',1456.75,'processed','office_depot_invoice_002.pdf',NULL,0.92,'{\"items\": [{\"name\": \"A4 Paper\", \"price\": 5.5, \"quantity\": 40}, {\"name\": \"Pens\", \"price\": 8.0, \"quantity\": 25}]}','System','Office supplies invoice','2025-08-09 21:54:56','2025-08-09 21:54:56'),(3,'INV-IM-003','Industrial Materials Inc',3,'2024-08-05',3245.60,'pending_review','industrial_materials_003.pdf',NULL,0.88,'{\"items\": [{\"name\": \"Safety Helmet\", \"price\": 28.0, \"quantity\": 25}]}','System','Industrial equipment invoice - needs review','2025-08-09 21:54:56','2025-08-09 21:54:56'),(4,'INV-GE-004','Global Electronics',4,'2024-08-07',1890.45,'unprocessed','global_electronics_004.pdf',NULL,0.94,'{\"items\": [{\"name\": \"USB-C Hub\", \"price\": 32.0, \"quantity\": 20}]}','System','Electronic components invoice','2025-08-09 21:54:56','2025-08-09 21:54:56'),(5,'INV-QP-005','Quick Parts LLC',5,'2024-08-08',987.30,'approved','quick_parts_005.pdf',NULL,0.97,'{\"items\": [{\"name\": \"Resistor Pack\", \"price\": 9.5, \"quantity\": 30}]}','System','Quick parts order invoice','2025-08-09 21:54:56','2025-08-09 21:54:56');
/*!40000 ALTER TABLE `bills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text,
  `company` varchar(255) DEFAULT NULL,
  `customer_type` enum('individual','business') DEFAULT 'individual',
  `status` enum('active','inactive') DEFAULT 'active',
  `credit_limit` decimal(10,2) DEFAULT '0.00',
  `payment_terms` varchar(100) DEFAULT 'Net 30',
  `tax_id` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_email` (`email`),
  KEY `idx_name` (`name`),
  KEY `idx_status` (`status`),
  KEY `idx_customer_type` (`customer_type`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'Acme Corporation','purchasing@acme.com','+1-555-1001','100 Business Plaza, Corporate City, CA 90210','Acme Corporation','business','active',50000.00,'Net 30','TAX123456789','Large corporate client with monthly orders','2025-08-09 21:54:56','2025-08-09 21:54:56'),(2,'TechStart Inc','orders@techstart.com','+1-555-1002','200 Startup Ave, Innovation District, NY 10001','TechStart Inc','business','active',25000.00,'Net 15','TAX987654321','Growing tech startup, frequent small orders','2025-08-09 21:54:56','2025-08-09 21:54:56'),(3,'John Martinez','j.martinez@email.com','+1-555-1003','789 Residential St, Hometown, TX 75001',NULL,'individual','active',5000.00,'Net 15',NULL,'Regular individual customer, DIY projects','2025-08-09 21:54:56','2025-08-09 21:54:56'),(4,'Educational Systems LLC','procurement@edusys.com','+1-555-1004','456 Learning Blvd, Education City, FL 33001','Educational Systems LLC','business','active',35000.00,'Net 45','TAX456789123','Educational institution, bulk orders','2025-08-09 21:54:56','2025-08-09 21:54:56'),(5,'Sarah Chen','s.chen@email.com','+1-555-1005','321 Maker Lane, Creative Town, WA 98001',NULL,'individual','active',3000.00,'Net 15',NULL,'Electronics hobbyist, regular component orders','2025-08-09 21:54:56','2025-08-09 21:54:56'),(6,'Manufacturing Plus','supplies@mfgplus.com','+1-555-1006','654 Factory Road, Industrial Park, OH 44001','Manufacturing Plus','business','active',75000.00,'Net 60','TAX789123456','Large manufacturer, high volume orders','2025-08-09 21:54:56','2025-08-09 21:54:56'),(7,'Mike Rodriguez','m.rodriguez@email.com','+1-555-1007','987 Workshop Dr, Tool Town, CO 80001',NULL,'individual','active',2500.00,'Net 15',NULL,'Professional contractor, tool and equipment buyer','2025-08-09 21:54:56','2025-08-09 21:54:56'),(8,'Innovation Labs','purchasing@innovationlabs.com','+1-555-1008','111 Research Park, Science City, MA 02101','Innovation Labs','business','active',40000.00,'Net 30','TAX321654987','R&D company, specialized component needs','2025-08-09 21:54:56','2025-08-09 21:54:56'),(9,'test','123@gmail.com','09361070032','28/A,Vinayagar Kovil Street-2,Karungalpalayam',NULL,'individual','active',0.00,'Net 30',NULL,NULL,'2025-08-10 14:35:42','2025-08-10 14:35:42');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sku` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `category` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `stock_quantity` int DEFAULT '0',
  `min_stock_level` int DEFAULT '10',
  `supplier_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_sku` (`sku`),
  KEY `idx_category` (`category`),
  KEY `idx_stock` (`stock_quantity`),
  KEY `idx_supplier` (`supplier_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'TECH-001','Wireless Mouse','Ergonomic wireless mouse with USB receiver','Electronics',29.99,18.50,150,25,1,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(2,'TECH-002','Bluetooth Keyboard','Compact Bluetooth keyboard for tablets and phones','Electronics',79.99,55.00,85,20,1,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(3,'TECH-003','USB-C Hub','7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader','Electronics',49.99,32.00,120,15,4,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(4,'TECH-004','LED Monitor 24\"','24-inch Full HD LED monitor with adjustable stand','Electronics',199.99,140.00,45,10,4,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(5,'TECH-005','Webcam HD','1080p HD webcam with built-in microphone','Electronics',89.99,62.00,75,15,4,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(6,'OFF-001','A4 Paper Ream','500 sheets of premium A4 printing paper','Office Supplies',8.99,5.50,10,50,2,'2025-08-09 21:54:56','2025-08-10 14:16:07'),(7,'OFF-002','Blue Ballpoint Pens','Pack of 12 blue ballpoint pens','Office Supplies',12.99,8.00,180,30,2,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(8,'OFF-003','Sticky Notes Set','Multicolor sticky notes pack (6 colors)','Office Supplies',15.99,10.50,160,25,2,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(9,'OFF-004','File Folders','Manila file folders pack of 25','Office Supplies',18.99,12.00,95,20,2,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(10,'OFF-005','Stapler Heavy Duty','Heavy duty stapler for thick documents','Office Supplies',34.99,22.00,65,12,2,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(11,'IND-001','Safety Helmet','ANSI approved safety helmet with chin strap','Industrial',45.99,28.00,80,15,3,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(12,'IND-002','Work Gloves','Cut-resistant work gloves size L','Industrial',24.99,15.50,120,25,3,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(13,'IND-003','Tool Box','Professional tool box with multiple compartments','Industrial',129.99,85.00,35,8,3,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(14,'IND-004','Measuring Tape','25ft measuring tape with magnetic tip','Industrial',19.99,12.50,90,18,3,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(15,'IND-005','LED Work Light','Rechargeable LED work light 2000 lumens','Industrial',79.99,52.00,55,12,3,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(16,'COMP-001','Resistor Pack','Assorted resistor pack 1/4W (100 pieces)','Components',15.99,9.50,200,30,5,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(17,'COMP-002','Capacitor Set','Electrolytic capacitor set various values','Components',25.99,16.00,150,25,5,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(18,'COMP-003','Arduino Uno R3','Arduino Uno R3 microcontroller board','Components',34.99,22.50,85,15,1,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(19,'COMP-004','Breadboard','Half-size solderless breadboard','Components',12.99,8.00,110,20,5,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(20,'COMP-005','Jumper Wires','Male-to-male jumper wires pack of 40','Components',8.99,5.50,140,25,5,'2025-08-09 21:54:56','2025-08-09 21:54:56'),(24,'123456','test','test - elec','elec',1000.00,700.00,100,10,2,'2025-08-10 10:55:05','2025-08-10 10:55:05'),(25,'SKU-1754825253092-4ds0h','A4 Paper Ream','A4 Paper Ream - Office Supplies','Office Supplies',8.99,6.29,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(26,'SKU-1754825253096-tpq47','Arduino Uno R3','Arduino Uno R3 - Components','Components',34.99,24.49,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(27,'SKU-1754825253098-mj14z','Blue Ballpoint Pens','Blue Ballpoint Pens - Office Supplies','Office Supplies',12.99,9.09,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(28,'SKU-1754825253100-txllw','Bluetooth Keyboard','Bluetooth Keyboard - Electronics','Electronics',79.99,55.99,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(29,'SKU-1754825253101-ps3xe','Breadboard','Breadboard - Components','Components',12.99,9.09,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(30,'SKU-1754825253102-4p6hc','Capacitor Set','Capacitor Set - Components','Components',25.99,18.19,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(31,'SKU-1754825253103-k4i2g','File Folders','File Folders - Office Supplies','Office Supplies',18.99,13.29,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(32,'SKU-1754825253105-xnqih','Jumper Wires','Jumper Wires - Components','Components',8.99,6.29,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(33,'SKU-1754825253106-536im','LED Monitor 24','LED Monitor 24 - Electronics','Electronics',199.99,139.99,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(34,'SKU-1754825253107-xxgja','LED Work Light','LED Work Light - Industrial','Industrial',79.99,55.99,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(35,'SKU-1754825253108-qyydr','Measuring Tape','Measuring Tape - Industrial','Industrial',19.99,13.99,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(36,'SKU-1754825253109-keos3','Resistor Pack','Resistor Pack - Components','Components',15.99,11.19,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(37,'SKU-1754825253110-i6fsy','Safety Helmet','Safety Helmet - Industrial','Industrial',45.99,32.19,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(38,'SKU-1754825253111-zjga7','Stapler Heavy Duty','Stapler Heavy Duty - Office Supplies','Office Supplies',34.99,24.49,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(39,'SKU-1754825253112-tuhyc','Sticky Notes Set','Sticky Notes Set - Office Supplies','Office Supplies',15.99,11.19,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(40,'SKU-1754825253113-q7mcf','test','test - elec','elec',1000.00,700.00,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(41,'SKU-1754825253115-n5v0u','Tool Box','Tool Box - Industrial','Industrial',129.99,90.99,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(42,'SKU-1754825253116-95l08','USB-C Hub','USB-C Hub - Electronics','Electronics',49.99,34.99,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(43,'SKU-1754825253117-ryia2','Webcam HD','Webcam HD - Electronics','Electronics',89.99,62.99,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(44,'SKU-1754825253118-2ja35','Wireless Mouse','Wireless Mouse - Electronics','Electronics',29.99,20.99,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33'),(45,'SKU-1754825253119-clgd4','Work Gloves','Work Gloves - Industrial','Industrial',24.99,17.49,0,10,NULL,'2025-08-10 11:27:33','2025-08-10 11:27:33');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_items`
--

DROP TABLE IF EXISTS `purchase_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchase_order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_purchase_order` (`purchase_order_id`),
  KEY `idx_product` (`product_id`),
  CONSTRAINT `purchase_order_items_ibfk_1` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_items`
--

LOCK TABLES `purchase_order_items` WRITE;
/*!40000 ALTER TABLE `purchase_order_items` DISABLE KEYS */;
INSERT INTO `purchase_order_items` VALUES (1,1,1,50,18.50,925.00,'2025-08-09 21:54:56'),(2,1,2,30,55.00,1650.00,'2025-08-09 21:54:56'),(3,1,18,15,22.50,337.50,'2025-08-09 21:54:56'),(4,2,6,40,5.50,220.00,'2025-08-09 21:54:56'),(5,2,7,25,8.00,200.00,'2025-08-09 21:54:56'),(6,2,8,30,10.50,315.00,'2025-08-09 21:54:56'),(7,2,9,15,12.00,180.00,'2025-08-09 21:54:56'),(8,3,11,25,28.00,700.00,'2025-08-09 21:54:56'),(9,3,12,50,15.50,775.00,'2025-08-09 21:54:56'),(10,3,15,10,52.00,520.00,'2025-08-09 21:54:56'),(11,4,3,20,32.00,640.00,'2025-08-09 21:54:56'),(12,4,5,15,62.00,930.00,'2025-08-09 21:54:56'),(13,5,16,30,9.50,285.00,'2025-08-09 21:54:56'),(14,5,19,25,8.00,200.00,'2025-08-09 21:54:56'),(15,5,20,40,5.50,220.00,'2025-08-09 21:54:56'),(16,13,19,10,250.00,2500.00,'2025-08-10 12:37:41');
/*!40000 ALTER TABLE `purchase_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(100) NOT NULL,
  `supplier_id` int NOT NULL,
  `order_date` date NOT NULL,
  `delivery_date` date DEFAULT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `status` enum('draft','pending','approved','shipped','received','completed','cancelled') DEFAULT 'draft',
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_order_number` (`order_number`),
  KEY `idx_supplier` (`supplier_id`),
  KEY `idx_status` (`status`),
  KEY `idx_order_date` (`order_date`),
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES (1,'PO-2024-001',1,'2024-08-01',NULL,'2024-08-15','completed',2879.85,'Monthly electronics restocking','2025-08-09 21:54:56','2025-08-09 21:54:56'),(2,'PO-2024-002',2,'2024-08-03',NULL,'2024-08-10','completed',1456.75,'Office supplies replenishment','2025-08-09 21:54:56','2025-08-09 21:54:56'),(3,'PO-2024-003',3,'2024-08-05',NULL,'2024-08-20','shipped',3245.60,'Industrial safety equipment order','2025-08-09 21:54:56','2025-08-10 14:14:04'),(4,'PO-2024-004',4,'2024-08-07',NULL,'2024-08-14','approved',1890.45,'Electronic components for new project','2025-08-09 21:54:56','2025-08-10 12:59:46'),(5,'PO-2024-005',5,'2024-08-08',NULL,'2024-08-12','completed',987.30,'Quick parts emergency order','2025-08-09 21:54:56','2025-08-10 13:22:36'),(6,'PO-2024-006',1,'2024-08-09',NULL,'2024-08-25','pending',4567.80,'Upcoming technology upgrade','2025-08-09 21:54:56','2025-08-10 13:09:46'),(7,'PO-2024-007',2,'2024-08-10',NULL,'2024-08-17','approved',756.25,'Weekly office supply order','2025-08-09 21:54:56','2025-08-10 13:00:50'),(12,'PO-1754829314793-148',6,'2025-08-10',NULL,NULL,'approved',5000.00,NULL,'2025-08-10 12:35:14','2025-08-10 13:00:58'),(13,'PO-1754829461305-829',6,'2025-08-10',NULL,NULL,'shipped',2500.00,NULL,'2025-08-10 12:37:41','2025-08-10 13:39:24');
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `movement_type` enum('in','out') NOT NULL,
  `quantity` int NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product` (`product_id`),
  KEY `idx_movement_type` (`movement_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES (1,1,'in',50,'PO-2024-001','Received from Tech Supply Co','2025-08-09 21:54:56'),(2,2,'in',30,'PO-2024-001','Received from Tech Supply Co','2025-08-09 21:54:56'),(3,6,'in',40,'PO-2024-002','Received from Office Depot Plus','2025-08-09 21:54:56'),(4,7,'in',25,'PO-2024-002','Received from Office Depot Plus','2025-08-09 21:54:56'),(5,1,'out',15,'SALE-001','Sold to Acme Corporation','2025-08-09 21:54:56'),(6,6,'out',25,'SALE-002','Sold to Educational Systems LLC','2025-08-09 21:54:56'),(7,18,'out',8,'SALE-003','Sold to TechStart Inc','2025-08-09 21:54:56'),(8,2,'out',12,'SALE-004','Sold to Innovation Labs','2025-08-09 21:54:56'),(9,3,'out',5,'ADJ-001','Damaged units removed from inventory','2025-08-09 21:54:56'),(10,11,'in',10,'ADJ-002','Found additional units in warehouse','2025-08-09 21:54:56');
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text,
  `contact_person` varchar(255) DEFAULT NULL,
  `payment_terms` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_name` (`name`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Tech Supply C','orders@techsupply.com','+1-555-0101','123 Tech Street, Silicon Valley, CA 94000','John Smith','Net 30','active','Primary technology supplier','2025-08-09 21:54:56','2025-08-10 10:07:08'),(2,'Office Depot Plus','procurement@officedepot.com','+1-555-0102','456 Office Ave, Business Park, NY 10001','Sarah Johnson','Net 15','active','Office supplies and equipment','2025-08-09 21:54:56','2025-08-09 21:54:56'),(3,'Industrial Materials Inc','sales@industrial.com','+1-555-0103','789 Industrial Blvd, Factory District, TX 75001','Mike Wilson','Net 45','active','Raw materials and components','2025-08-09 21:54:56','2025-08-09 21:54:56'),(4,'Global Electronics','info@globalelectronics.com','+1-555-0104','321 Electronic Way, Tech City, WA 98001','Lisa Chen','Net 30','active','Electronic components supplier','2025-08-09 21:54:56','2025-08-09 21:54:56'),(5,'Quick Parts LLC','support@quickparts.com','+1-555-0105','654 Parts Lane, Supply Town, FL 33001','David Brown','Net 20','active','Fast delivery parts supplier','2025-08-09 21:54:56','2025-08-09 21:54:56'),(6,'test','test#example.com','+919361070035','test','test','net 20','active','test','2025-08-09 21:54:56','2025-08-09 21:54:56'),(9,'test1','123@gmail.com','09361070032','28/A,Vinayagar Kovil Street-2,Karungalpalayam',NULL,NULL,'active',NULL,'2025-08-10 14:35:19','2025-08-10 14:35:19');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'ai_stock_management'
--

--
-- Dumping routines for database 'ai_stock_management'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-10 20:43:15
