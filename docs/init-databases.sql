-- =============================================================================
-- HỆ THỐNG WMS MICROSERVICES & STOREFRONT VELVETY
-- Script khởi tạo 4 Database độc lập (Database-per-Service Architecture)
-- 1. auth_db      (auth-service      - Port 8081)
-- 2. product_db   (product-service   - Port 8082)
-- 3. warehouse_db (warehouse-service - Port 8083)
-- 4. customer_db  (customer-service  - Port 8084)
-- =============================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- =============================================================================
-- 1. DATABASE: auth_db (Dành cho auth-service)
-- =============================================================================
CREATE DATABASE IF NOT EXISTS `auth_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `auth_db`;

DROP TABLE IF EXISTS `student`;
DROP TABLE IF EXISTS `app_user`;

CREATE TABLE `app_user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) DEFAULT NULL,
    `phone` VARCHAR(20) DEFAULT NULL,
    `role` VARCHAR(20) NOT NULL COMMENT 'ADMIN, MANAGER, STAFF',
    `active` BIT(1) NOT NULL DEFAULT b'1',
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_app_user_username` (`username`),
    UNIQUE KEY `uk_app_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed tài khoản mặc định:
-- admin   / admin123   (ADMIN)
-- manager / manager123 (MANAGER)
-- staff   / staff123   (STAFF)
INSERT INTO `app_user` (`id`, `username`, `password`, `full_name`, `email`, `phone`, `role`, `active`, `created_at`) VALUES
(1, 'admin',   '$2a$10$U6cVr7XL0zE5KBgi/esTVu5zNthzQ7IAwY3wT0F3ZxFc0plZ/YMzK', 'Quản trị viên Hệ thống', 'admin@wms.com',   '0901234567', 'ADMIN',   b'1', NOW()),
(2, 'manager', '$2a$10$Lu7NnaFecn.FKSpQCxMH4.DCTC2maYF5Rwzfw/hiwcsfKRvAHHvCe', 'Quản lý kho Nguyễn Văn B', 'manager@wms.com', '0912345678', 'MANAGER', b'1', NOW()),
(3, 'staff',   '$2a$10$SBFrhQcVTz7SdCFqHsaw2OL4EssUWh5sWXfROY8rNS/NKX7ON8TB2', 'Nhân viên kho Lê Thị C',   'staff@wms.com',   '0923456789', 'STAFF',   b'1', NOW());


-- =============================================================================
-- 2. DATABASE: product_db (Dành cho product-service)
-- =============================================================================
CREATE DATABASE IF NOT EXISTS `product_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `product_db`;

DROP TABLE IF EXISTS `product`;
DROP TABLE IF EXISTS `supplier`;
DROP TABLE IF EXISTS `category`;

CREATE TABLE `category` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_category_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `supplier` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `address` VARCHAR(255) DEFAULT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(150) DEFAULT NULL,
    `contact_person` VARCHAR(150) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_supplier_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `category_id` BIGINT NOT NULL,
    `supplier_id` BIGINT DEFAULT NULL,
    `unit` VARCHAR(50) NOT NULL,
    `import_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `export_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `stock_quantity` INT NOT NULL DEFAULT 0,
    `min_stock_level` INT NOT NULL DEFAULT 10,
    `image_url` VARCHAR(500) DEFAULT NULL,
    `description` TEXT,
    `status` VARCHAR(30) DEFAULT 'ACTIVE',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_product_code` (`code`),
    KEY `fk_product_category` (`category_id`),
    KEY `fk_product_supplier` (`supplier_id`),
    CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`),
    CONSTRAINT `fk_product_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Danh mục (Categories)
INSERT INTO `category` (`id`, `code`, `name`, `description`) VALUES
(1, 'DIENTU',      'Thiết bị điện tử',              'Các loại linh kiện, máy tính, thiết bị điện tử'),
(2, 'GIA-DUNG',    'Đồ gia dụng',                   'Thiết bị gia dụng và đồ dùng nhà bếp'),
(3, 'VAN-PHONG',   'Văn phòng phẩm',                'Giấy in, bút, dụng cụ văn phòng'),
(4, 'NOI-THAT',    'Nội thất kho',                  'Kệ kho, bàn ghế làm việc, pallet'),
(5, 'CHAM-SOC-DA', 'Mỹ phẩm & Chăm sóc da VELVETY', 'Các sản phẩm chăm sóc da thảo mộc, tự nhiên');

-- Seed Nhà cung cấp (Suppliers)
INSERT INTO `supplier` (`id`, `code`, `name`, `address`, `phone`, `email`, `contact_person`) VALUES
(1, 'NCC001', 'Công ty TNHH Công nghệ FPT',         'Hà Nội',                                '02473007300', 'contact@fpt.com.vn', 'Nguyễn Văn Tuấn'),
(2, 'NCC002', 'Tập đoàn Điện máy Sunhouse',         'KCN Ngọc Hồi, Hà Nội',                  '02437366677', 'info@sunhouse.com.vn', 'Lê Hồng Sơn'),
(3, 'NCC003', 'Công ty CP Văn phòng phẩm Hồng Hà', '25 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',  '02438562111', 'vpp@hongha.vn',      'Trần Thị Mai');

-- Seed Sản phẩm (Products)
INSERT INTO `product` (`id`, `code`, `name`, `category_id`, `supplier_id`, `unit`, `import_price`, `export_price`, `stock_quantity`, `min_stock_level`, `image_url`, `description`, `status`) VALUES
(1,  'SP001',   'Laptop Dell Inspiron 15',            1, 1, 'Chiếc', 12500000.00, 15000000.00, 45,  10, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500', 'Laptop văn phòng core i5, RAM 16GB, SSD 512GB', 'ACTIVE'),
(2,  'SP002',   'Màn hình Asus 24 inch IPS',          1, 1, 'Chiếc',  2200000.00,  2850000.00, 80,  15, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500', 'Màn hình 75Hz, độ phân giải Full HD', 'ACTIVE'),
(3,  'SP003',   'Bàn phím cơ Logitech G213',          1, 1, 'Cái',     750000.00,  1100000.00, 120, 20, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500', 'Bàn phím giả cơ RGB chống nước', 'ACTIVE'),
(4,  'SP004',   'Nồi chiên không dầu Sunhouse 6L',    2, 2, 'Cái',     950000.00,  1450000.00, 6,   10, 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500', 'Công nghệ Rapid Air, dung tích lớn 6 lít', 'ACTIVE'),
(5,  'SP005',   'Máy xay sinh tố đa năng 1.5L',       2, 2, 'Bộ',      420000.00,   650000.00, 35,  10, 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=500', 'Cối thủy tinh chịu lực, lưỡi dao inox 304', 'ACTIVE'),
(6,  'SP006',   'Giấy in Double A A4 70gsm',          3, 3, 'Thùng',   310000.00,   380000.00, 4,   15, 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500', 'Quy cách 5 ram/thùng, độ trắng 148 CIE', 'ACTIVE'),
(7,  'SP007',   'Kệ kho để hàng 4 tầng sắt v lỗ',     4, 3, 'Bộ',      850000.00,  1200000.00, 25,  5,  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500', 'Kích thước D1m x R0.4m x C2m, tải trọng 100kg/tầng', 'ACTIVE'),
(8,  'VEL-001', 'CHICORI - Protective Essence 50ml',  5, 1, 'Chai',    280000.00,   490000.00, 27,  5,  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600', 'Tinh chất bảo vệ da tự nhiên, bổ sung độ ẩm chuyên sâu và chống oxy hóa từ chiết xuất thực vật hữu cơ.', 'ACTIVE'),
(9,  'VEL-002', 'BOTANIC - Regenerating Serum 30ml',  5, 1, 'Chai',    380000.00,   650000.00, 35,  5,  'https://images.unsplash.com/photo-1608248597359-3a3359d997cf?w=600', 'Serum tái tạo phục hồi tế bào da, làm mờ thâm nám và tăng sinh collagen tự nhiên.', 'ACTIVE'),
(10, 'VEL-003', 'REVITALIZE - Eye Elixir 15ml',       5, 1, 'Lọ',      310000.00,   520000.00, 18,  5,  'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600', 'Kem dưỡng đánh thức vùng mắt, giảm quầng thâm và bọng mắt với chiết xuất trà xanh và hoa cúc.', 'ACTIVE'),
(11, 'VEL-004', 'FEEDS - Nourishing Balm 50ml',       5, 1, 'Hũ',      250000.00,   420000.00, 42,  8,  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600', 'Sáp dưỡng ẩm sâu giàu bơ hạt mỡ và dầu jojoba giúp nuôi dưỡng làn da khô ráp mịn màng.', 'ACTIVE'),
(12, 'VEL-005', 'REGULATE - Balancing Toner 150ml',   5, 1, 'Chai',    210000.00,   380000.00, 50,  10, 'https://images.unsplash.com/photo-1617897903246-719242758050?w=600', 'Nước hoa hồng cân bằng độ pH, se khít lỗ chân lông và kiểm soát dầu thừa hiệu quả.', 'ACTIVE'),
(13, 'VEL-006', 'PURIFYING - Clay Cleanser 100ml',    5, 1, 'Tuýp',    190000.00,   350000.00, 60,  10, 'https://images.unsplash.com/photo-1556228722-d0b5de70b774?w=600', 'Sữa rửa mặt đất sét làm sạch sâu bụi bẩn, bã nhờn mà không làm khô căng làn da.', 'ACTIVE'),
(14, 'VEL-007', 'HYDRA MIST - Rose Water Spray 120ml',5, 1, 'Chai',    160000.00,   290000.00, 45,  10, 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=600', 'Xịt khoáng tinh chất hoa hồng hữu cơ cấp ẩm tức thì và làm dịu da nhạy cảm.', 'ACTIVE'),
(15, 'VEL-008', 'RENEWAL - Night Repair Cream 50ml',  5, 1, 'Hũ',      450000.00,   750000.00, 22,  5,  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600', 'Kem dưỡng đêm phục hồi chuyên sâu, bổ sung dưỡng chất chống lão hóa vượt trội.', 'ACTIVE');


-- =============================================================================
-- 3. DATABASE: warehouse_db (Dành cho warehouse-service)
-- =============================================================================
CREATE DATABASE IF NOT EXISTS `warehouse_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `warehouse_db`;

DROP TABLE IF EXISTS `export_receipt_detail`;
DROP TABLE IF EXISTS `export_receipt`;
DROP TABLE IF EXISTS `import_receipt_detail`;
DROP TABLE IF EXISTS `import_receipt`;
DROP TABLE IF EXISTS `customer`;

CREATE TABLE `customer` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `address` VARCHAR(255) DEFAULT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(150) DEFAULT NULL,
    `customer_type` VARCHAR(50) DEFAULT 'CA_NHAN' COMMENT 'CA_NHAN, DOANH_NGHIEP, DAI_LY',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_customer_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `import_receipt` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `import_date` DATETIME(6) NOT NULL,
    `supplier_id` BIGINT NOT NULL,
    `supplier_code` VARCHAR(50) DEFAULT NULL,
    `supplier_name` VARCHAR(200) DEFAULT NULL,
    `supplier_phone` VARCHAR(20) DEFAULT NULL,
    `supplier_address` VARCHAR(255) DEFAULT NULL,
    `user_id` BIGINT NOT NULL,
    `creator_name` VARCHAR(150) NOT NULL,
    `total_amount` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `notes` TEXT,
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, APPROVED, COMPLETED, CANCELLED, REJECTED',
    `approved_by_id` BIGINT DEFAULT NULL,
    `approver_name` VARCHAR(150) DEFAULT NULL,
    `approved_at` DATETIME(6) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_import_receipt_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `import_receipt_detail` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `receipt_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    `product_code` VARCHAR(50) DEFAULT NULL,
    `product_name` VARCHAR(255) DEFAULT NULL,
    `unit` VARCHAR(50) DEFAULT NULL,
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(15,2) NOT NULL,
    `total_price` DECIMAL(18,2) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_import_detail_receipt` (`receipt_id`),
    CONSTRAINT `fk_import_detail_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `import_receipt` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `export_receipt` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `export_date` DATETIME(6) NOT NULL,
    `customer_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `creator_name` VARCHAR(150) NOT NULL,
    `total_amount` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `notes` TEXT,
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, APPROVED, COMPLETED, CANCELLED, REJECTED',
    `approved_by_id` BIGINT DEFAULT NULL,
    `approver_name` VARCHAR(150) DEFAULT NULL,
    `approved_at` DATETIME(6) DEFAULT NULL,
    `order_id` BIGINT DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_export_receipt_code` (`code`),
    KEY `fk_export_receipt_customer` (`customer_id`),
    CONSTRAINT `fk_export_receipt_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `export_receipt_detail` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `receipt_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    `product_code` VARCHAR(50) DEFAULT NULL,
    `product_name` VARCHAR(255) DEFAULT NULL,
    `unit` VARCHAR(50) DEFAULT NULL,
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(15,2) NOT NULL,
    `total_price` DECIMAL(18,2) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_export_detail_receipt` (`receipt_id`),
    CONSTRAINT `fk_export_detail_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `export_receipt` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Khách hàng đối tác / đại lý (Customers)
INSERT INTO `customer` (`id`, `code`, `name`, `address`, `phone`, `email`, `customer_type`) VALUES
(1, 'KH001', 'Công ty CP Bán lẻ Kỹ thuật số FPT Shop', '261 Khánh Hội, Q.4, TP.HCM',           '02873023456', 'fptshop@retails.vn', 'DOANH_NGHIEP'),
(2, 'KH002', 'Chuỗi Cửa hàng Tiện ích Circle K',       'Tầng 1, Tòa nhà Lotte, Ba Đình, Hà Nội', '02436889900', 'circlek@store.vn',   'DAI_LY'),
(3, 'KH003', 'Trần Đình Khang',                        '45 Cầu Giấy, Hà Nội',                  '0987654321',  'khangtd@gmail.com',  'CA_NHAN');

-- Seed Phiếu nhập kho mẫu
INSERT INTO `import_receipt` (`id`, `code`, `import_date`, `supplier_id`, `supplier_code`, `supplier_name`, `supplier_phone`, `supplier_address`, `user_id`, `creator_name`, `total_amount`, `notes`, `status`) VALUES
(1, 'PNK-20260901-0001', DATE_SUB(NOW(), INTERVAL 10 DAY), 1, 'NCC001', 'Công ty TNHH Công nghệ FPT', '02473007300', 'Hà Nội', 1, 'Quản trị viên Hệ thống', 169000000.00, 'Nhập hàng đợt đầu tháng từ FPT', 'COMPLETED');

INSERT INTO `import_receipt_detail` (`id`, `receipt_id`, `product_id`, `product_code`, `product_name`, `unit`, `quantity`, `unit_price`, `total_price`) VALUES
(1, 1, 1, 'SP001', 'Laptop Dell Inspiron 15',   'Chiếc', 10, 12500000.00, 125000000.00),
(2, 1, 2, 'SP002', 'Màn hình Asus 24 inch IPS', 'Chiếc', 20,  2200000.00,  44000000.00);

-- Seed Phiếu xuất kho mẫu
INSERT INTO `export_receipt` (`id`, `code`, `export_date`, `customer_id`, `user_id`, `creator_name`, `total_amount`, `notes`, `status`) VALUES
(1, 'PXK-20260905-0001', DATE_SUB(NOW(), INTERVAL 5 DAY), 1, 2, 'Quản lý kho Nguyễn Văn B', 44250000.00, 'Xuất hàng theo đơn đặt FPT Shop', 'COMPLETED');

INSERT INTO `export_receipt_detail` (`id`, `receipt_id`, `product_id`, `product_code`, `product_name`, `unit`, `quantity`, `unit_price`, `total_price`) VALUES
(1, 1, 1, 'SP001', 'Laptop Dell Inspiron 15',   'Chiếc', 2, 15000000.00, 30000000.00),
(2, 1, 2, 'SP002', 'Màn hình Asus 24 inch IPS', 'Chiếc', 5,  2850000.00, 14250000.00);


-- =============================================================================
-- 4. DATABASE: customer_db (Dành cho customer-service & Storefront B2C)
-- =============================================================================
CREATE DATABASE IF NOT EXISTS `customer_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `customer_db`;

DROP TABLE IF EXISTS `order_detail`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `cart_item`;
DROP TABLE IF EXISTS `cart`;
DROP TABLE IF EXISTS `customer_user`;

CREATE TABLE `customer_user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(20) DEFAULT NULL,
    `address` VARCHAR(255) DEFAULT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_customer_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cart` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `customer_id` BIGINT DEFAULT NULL,
    `session_id` VARCHAR(100) DEFAULT NULL,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cart_item` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `cart_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    `product_code` VARCHAR(50) NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `unit_price` DECIMAL(15,2) NOT NULL,
    `quantity` INT NOT NULL,
    `image_url` VARCHAR(500) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_cart_item_cart` (`cart_id`),
    CONSTRAINT `fk_cart_item_cart` FOREIGN KEY (`cart_id`) REFERENCES `cart` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `orders` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_code` VARCHAR(50) NOT NULL,
    `customer_id` BIGINT DEFAULT NULL,
    `customer_name` VARCHAR(150) NOT NULL,
    `customer_phone` VARCHAR(20) NOT NULL,
    `shipping_address` VARCHAR(255) NOT NULL,
    `total_amount` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    `payment_method` VARCHAR(50) NOT NULL DEFAULT 'COD',
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, EXPORT_REQUESTED, EXPORTED, CANCELLED',
    `export_receipt_id` BIGINT DEFAULT NULL,
    `notes` TEXT,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_orders_order_code` (`order_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_detail` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    `product_code` VARCHAR(50) NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `unit_price` DECIMAL(15,2) NOT NULL,
    `quantity` INT NOT NULL,
    `total_price` DECIMAL(18,2) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `fk_order_detail_order` (`order_id`),
    CONSTRAINT `fk_order_detail_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed tài khoản khách hàng Storefront mẫu:
-- Email: khachhang@gmail.com / Mật khẩu: 123456
INSERT INTO `customer_user` (`id`, `email`, `password`, `full_name`, `phone`, `address`, `status`, `created_at`) VALUES
(1, 'khachhang@gmail.com', '$2a$10$.rUZeestNGhbEu0dBufXZez8DdU5UqFFxV7G4mIA.3G6luYEFTWU.', 'Nguyễn Thảo Linh', '0968123456', '120 Xuân Thủy, Cầu Giấy, Hà Nội', 'ACTIVE', NOW());

-- Seed đơn đặt hàng mẫu từ Storefront
INSERT INTO `orders` (`id`, `order_code`, `customer_id`, `customer_name`, `customer_phone`, `shipping_address`, `total_amount`, `payment_method`, `status`, `notes`, `created_at`) VALUES
(1, 'ORD-20261006-0001', 1, 'Nguyễn Thảo Linh', '0968123456', '120 Xuân Thủy, Cầu Giấy, Hà Nội', 1140000.00, 'COD', 'PENDING', 'Giao giờ hành chính', NOW());

INSERT INTO `order_detail` (`id`, `order_id`, `product_id`, `product_code`, `product_name`, `unit_price`, `quantity`, `total_price`) VALUES
(1, 1, 8, 'VEL-001', 'CHICORI - Protective Essence 50ml', 490000.00, 1, 490000.00),
(2, 1, 9, 'VEL-002', 'BOTANIC - Regenerating Serum 30ml', 650000.00, 1, 650000.00);
