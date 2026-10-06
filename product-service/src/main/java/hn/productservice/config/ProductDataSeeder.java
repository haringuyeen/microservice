package hn.productservice.config;

import hn.productservice.entity.Category;
import hn.productservice.entity.Product;
import hn.productservice.entity.Supplier;
import hn.productservice.repository.CategoryRepository;
import hn.productservice.repository.ProductRepository;
import hn.productservice.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class ProductDataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (categoryRepository.count() == 0) {
            // 1. Seed Categories
            Category cat1 = categoryRepository.save(new Category(null, "DIENTU", "Thiết bị điện tử", "Các loại linh kiện, máy tính, thiết bị điện tử"));
            Category cat2 = categoryRepository.save(new Category(null, "GIA-DUNG", "Đồ gia dụng", "Thiết bị gia dụng và đồ dùng nhà bếp"));
            Category cat3 = categoryRepository.save(new Category(null, "VAN-PHONG", "Văn phòng phẩm", "Giấy in, bút, dụng cụ văn phòng"));
            Category cat4 = categoryRepository.save(new Category(null, "NOI-THAT", "Nội thất kho", "Kệ kho, bàn ghế làm việc, pallet"));

            // 2. Seed Suppliers
            Supplier sup1 = supplierRepository.save(new Supplier(null, "NCC001", "Công ty TNHH Công nghệ FPT", "Hà Nội", "02473007300", "contact@fpt.com.vn", "Nguyễn Văn Tuấn"));
            Supplier sup2 = supplierRepository.save(new Supplier(null, "NCC002", "Tập đoàn Điện máy Sunhouse", "KCN Ngọc Hồi, Hà Nội", "02437366677", "info@sunhouse.com.vn", "Lê Hồng Sơn"));
            Supplier sup3 = supplierRepository.save(new Supplier(null, "NCC003", "Công ty CP Văn phòng phẩm Hồng Hà", "25 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội", "02438562111", "vpp@hongha.vn", "Trần Thị Mai"));

            // 3. Seed Products
            productRepository.save(new Product(null, "SP001", "Laptop Dell Inspiron 15", cat1, sup1, "Chiếc",
                    new BigDecimal("12500000"), new BigDecimal("15000000"), 45, 10,
                    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500", "Laptop văn phòng core i5, RAM 16GB, SSD 512GB", "ACTIVE"));

            productRepository.save(new Product(null, "SP002", "Màn hình Asus 24 inch IPS", cat1, sup1, "Chiếc",
                    new BigDecimal("2200000"), new BigDecimal("2850000"), 80, 15,
                    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500", "Màn hình 75Hz, độ phân giải Full HD", "ACTIVE"));

            productRepository.save(new Product(null, "SP003", "Bàn phím cơ Logitech G213", cat1, sup1, "Cái",
                    new BigDecimal("750000"), new BigDecimal("1100000"), 120, 20,
                    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500", "Bàn phím giả cơ RGB chống nước", "ACTIVE"));

            productRepository.save(new Product(null, "SP004", "Nồi chiên không dầu Sunhouse 6L", cat2, sup2, "Cái",
                    new BigDecimal("950000"), new BigDecimal("1450000"), 6, 10,
                    "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500", "Công nghệ Rapid Air, dung tích lớn 6 lít", "ACTIVE"));

            productRepository.save(new Product(null, "SP005", "Máy xay sinh tố đa năng 1.5L", cat2, sup2, "Bộ",
                    new BigDecimal("420000"), new BigDecimal("650000"), 35, 10,
                    "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=500", "Cối thủy tinh chịu lực, lưỡi dao inox 304", "ACTIVE"));

            productRepository.save(new Product(null, "SP006", "Giấy in Double A A4 70gsm", cat3, sup3, "Thùng",
                    new BigDecimal("310000"), new BigDecimal("380000"), 4, 15,
                    "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500", "Quy cách 5 ram/thùng, độ trắng 148 CIE", "ACTIVE"));

            productRepository.save(new Product(null, "SP007", "Kệ kho để hàng 4 tầng sắt v lỗ", cat4, sup3, "Bộ",
                    new BigDecimal("850000"), new BigDecimal("1200000"), 25, 5,
                    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500", "Kích thước D1m x R0.4m x C2m, tải trọng 100kg/tầng", "ACTIVE"));
        }

        // Tự động liên kết nhà cung cấp cho các sản phẩm hiện có nếu chưa có NCC
        Supplier ncc1 = supplierRepository.findByCode("NCC001").orElse(null);
        Supplier ncc2 = supplierRepository.findByCode("NCC002").orElse(null);
        Supplier ncc3 = supplierRepository.findByCode("NCC003").orElse(null);

        if (ncc1 != null || ncc2 != null || ncc3 != null) {
            productRepository.findAll().forEach(p -> {
                if (p.getSupplier() == null) {
                    if ("SP001".equalsIgnoreCase(p.getCode()) || "SP002".equalsIgnoreCase(p.getCode()) || "SP003".equalsIgnoreCase(p.getCode())) {
                        p.setSupplier(ncc1 != null ? ncc1 : ncc2);
                    } else if ("SP004".equalsIgnoreCase(p.getCode()) || "SP005".equalsIgnoreCase(p.getCode())) {
                        p.setSupplier(ncc2 != null ? ncc2 : ncc1);
                    } else {
                        p.setSupplier(ncc3 != null ? ncc3 : ncc1);
                    }
                    productRepository.save(p);
                }
            });
        }

        // Seed Velvety Skincare category and organic cosmetic products
        Category skinCat = categoryRepository.findByCode("CHAM-SOC-DA").orElse(null);
        if (skinCat == null) {
            skinCat = categoryRepository.save(new Category(null, "CHAM-SOC-DA", "Mỹ phẩm & Chăm sóc da VELVETY", "Các sản phẩm chăm sóc da thảo mộc, tự nhiên"));
        }

        Supplier skinSupplier = supplierRepository.findByCode("NCC001").orElse(null);

        if (productRepository.findByCode("VEL-001").isEmpty()) {
            productRepository.save(new Product(null, "VEL-001", "CHICORI - Protective Essence 50ml", skinCat, skinSupplier, "Chai",
                    new BigDecimal("280000"), new BigDecimal("490000"), 27, 5,
                    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600",
                    "Tinh chất bảo vệ da tự nhiên, bổ sung độ ẩm chuyên sâu và chống oxy hóa từ chiết xuất thực vật hữu cơ.", "ACTIVE"));
        }
        if (productRepository.findByCode("VEL-002").isEmpty()) {
            productRepository.save(new Product(null, "VEL-002", "BOTANIC - Regenerating Serum 30ml", skinCat, skinSupplier, "Chai",
                    new BigDecimal("380000"), new BigDecimal("650000"), 35, 5,
                    "https://images.unsplash.com/photo-1608248597359-3a3359d997cf?w=600",
                    "Serum tái tạo phục hồi tế bào da, làm mờ thâm nám và tăng sinh collagen tự nhiên.", "ACTIVE"));
        }
        if (productRepository.findByCode("VEL-003").isEmpty()) {
            productRepository.save(new Product(null, "VEL-003", "REVITALIZE - Eye Elixir 15ml", skinCat, skinSupplier, "Lọ",
                    new BigDecimal("310000"), new BigDecimal("520000"), 18, 5,
                    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600",
                    "Kem dưỡng đánh thức vùng mắt, giảm quầng thâm và bọng mắt với chiết xuất trà xanh và hoa cúc.", "ACTIVE"));
        }
        if (productRepository.findByCode("VEL-004").isEmpty()) {
            productRepository.save(new Product(null, "VEL-004", "FEEDS - Nourishing Balm 50ml", skinCat, skinSupplier, "Hũ",
                    new BigDecimal("250000"), new BigDecimal("420000"), 42, 8,
                    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600",
                    "Sáp dưỡng ẩm sâu giàu bơ hạt mỡ và dầu jojoba giúp nuôi dưỡng làn da khô ráp mịn màng.", "ACTIVE"));
        }
        if (productRepository.findByCode("VEL-005").isEmpty()) {
            productRepository.save(new Product(null, "VEL-005", "REGULATE - Balancing Toner 150ml", skinCat, skinSupplier, "Chai",
                    new BigDecimal("210000"), new BigDecimal("380000"), 50, 10,
                    "https://images.unsplash.com/photo-1617897903246-719242758050?w=600",
                    "Nước hoa hồng cân bằng độ pH, se khít lỗ chân lông và kiểm soát dầu thừa hiệu quả.", "ACTIVE"));
        }
        if (productRepository.findByCode("VEL-006").isEmpty()) {
            productRepository.save(new Product(null, "VEL-006", "PURIFYING - Clay Cleanser 100ml", skinCat, skinSupplier, "Tuýp",
                    new BigDecimal("190000"), new BigDecimal("350000"), 60, 10,
                    "https://images.unsplash.com/photo-1556228722-d0b5de70b774?w=600",
                    "Sữa rửa mặt đất sét làm sạch sâu bụi bẩn, bã nhờn mà không làm khô căng làn da.", "ACTIVE"));
        }
        if (productRepository.findByCode("VEL-007").isEmpty()) {
            productRepository.save(new Product(null, "VEL-007", "HYDRA MIST - Rose Water Spray 120ml", skinCat, skinSupplier, "Chai",
                    new BigDecimal("160000"), new BigDecimal("290000"), 45, 10,
                    "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=600",
                    "Xịt khoáng tinh chất hoa hồng hữu cơ cấp ẩm tức thì và làm dịu da nhạy cảm.", "ACTIVE"));
        }
        if (productRepository.findByCode("VEL-008").isEmpty()) {
            productRepository.save(new Product(null, "VEL-008", "RENEWAL - Night Repair Cream 50ml", skinCat, skinSupplier, "Hũ",
                    new BigDecimal("450000"), new BigDecimal("750000"), 22, 5,
                    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600",
                    "Kem dưỡng đêm phục hồi chuyên sâu, bổ sung dưỡng chất chống lão hóa vượt trội.", "ACTIVE"));
        }
    }
}
