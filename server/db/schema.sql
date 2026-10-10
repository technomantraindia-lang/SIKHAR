-- ==========================================================
-- SIKHAR FLEET ENTERPRISE DATABASE SCHEMA (MySQL 8.0+)
-- Database: u253609925_T5Cexn3e2_sikhar
-- ==========================================================

-- 1. Administrative Users Table
CREATE TABLE IF NOT EXISTS `admins` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(100) DEFAULT 'Administrator',
  `designation` VARCHAR(150) DEFAULT 'Fleet Operations',
  `initials` VARCHAR(10) DEFAULT 'FA',
  `branch` VARCHAR(150) DEFAULT 'Delhi NCR Central Hub',
  `tenant` VARCHAR(150) DEFAULT 'SIKHAR-FLEET-PRIVATE-LIMITED',
  `permissions` JSON,
  `last_login` VARCHAR(100),
  `session_token` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Commercial Drivers Table
CREATE TABLE IF NOT EXISTS `drivers` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `alt_phone` VARCHAR(50),
  `city` VARCHAR(150) DEFAULT 'Gurgaon Operations Hub',
  `photo` VARCHAR(255),
  `mobile_verified` BOOLEAN DEFAULT TRUE,
  `status` VARCHAR(50) DEFAULT 'Ready',
  `rating` DECIMAL(3, 1) DEFAULT 5.0,
  `shift` VARCHAR(150),
  `shift_type` VARCHAR(100) DEFAULT '24-Hour Dedicated',
  `co_driver` VARCHAR(150),
  `location` VARCHAR(150),
  `vehicle_reg` VARCHAR(50),
  `vehicle_model` VARCHAR(100),
  `vehicle_type` VARCHAR(50),
  `vehicle_status` VARCHAR(50),
  `today_gross` VARCHAR(50) DEFAULT '₹0',
  `today_trips` INT DEFAULT 0,
  `wallet` JSON,
  `kyc` JSON,
  `deal` JSON,
  `attendance` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_driver_phone` (`phone`),
  INDEX `idx_driver_status` (`status`),
  INDEX `idx_driver_vehicle` (`vehicle_reg`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Vehicle Master Table
CREATE TABLE IF NOT EXISTS `vehicles` (
  `registration` VARCHAR(50) NOT NULL PRIMARY KEY,
  `model` VARCHAR(150) NOT NULL,
  `type` VARCHAR(50) DEFAULT 'EV',
  `status` VARCHAR(50) DEFAULT 'Available',
  `fuel_level` VARCHAR(50),
  `battery_percentage` INT,
  `range_km` INT,
  `odometer_km` INT,
  `assigned_driver_id` VARCHAR(50),
  `assigned_driver_name` VARCHAR(150),
  `hub_location` VARCHAR(150),
  `telematics` JSON,
  `compliance` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_vehicle_status` (`status`),
  INDEX `idx_vehicle_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Driver Wallet Transactions Ledger
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `driver_id` VARCHAR(50) NOT NULL,
  `date` VARCHAR(100) NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `amount` VARCHAR(50) NOT NULL,
  `method` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'Success',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tx_driver` (`driver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
