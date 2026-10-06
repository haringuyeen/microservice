package hn.warehouseservice.config;

import hn.warehouseservice.client.ProductClient;
import hn.warehouseservice.dto.ProductDTO;
import hn.warehouseservice.entity.Customer;
import hn.warehouseservice.entity.ExportReceipt;
import hn.warehouseservice.entity.ExportReceiptDetail;
import hn.warehouseservice.entity.ImportReceipt;
import hn.warehouseservice.entity.ImportReceiptDetail;
import hn.warehouseservice.repository.CustomerRepository;
import hn.warehouseservice.repository.ExportReceiptDetailRepository;
import hn.warehouseservice.repository.ExportReceiptRepository;
import hn.warehouseservice.repository.ImportReceiptDetailRepository;
import hn.warehouseservice.repository.ImportReceiptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class WarehouseDataSeeder implements CommandLineRunner {

    private final CustomerRepository customerRepository;
    private final ImportReceiptRepository importReceiptRepository;
    private final ExportReceiptRepository exportReceiptRepository;
    private final ExportReceiptDetailRepository exportReceiptDetailRepository;
    private final ImportReceiptDetailRepository importReceiptDetailRepository;
    private final ProductClient productClient;

    @Override
    @Transactional
    public void run(String... args) {
        syncProductNamesIfMissing();

        if (customerRepository.count() > 0) {
            return;
        }

        // 1. Seed Customers
        Customer cus1 = customerRepository.save(new Customer(null, "KH001", "Công ty CP Bán lẻ Kỹ thuật số FPT Shop", "261 Khánh Hội, Q.4, TP.HCM", "02873023456", "fptshop@retails.vn", "DOANH_NGHIEP"));
        customerRepository.save(new Customer(null, "KH002", "Chuỗi Cửa hàng Tiện ích Circle K", "Tầng 1, Tòa nhà Lotte, Ba Đình, Hà Nội", "02436889900", "circlek@store.vn", "DAI_LY"));
        customerRepository.save(new Customer(null, "KH003", "Trần Đình Khang", "45 Cầu Giấy, Hà Nội", "0987654321", "khangtd@gmail.com", "CA_NHAN"));

        // 2. Seed Sample Import Receipt
        ImportReceipt imp = new ImportReceipt();
        imp.setCode("PNK-20260901-0001");
        imp.setImportDate(LocalDateTime.now().minusDays(10));
        imp.setSupplierId(1L);
        imp.setSupplierCode("NCC001");
        imp.setSupplierName("Công ty TNHH Công nghệ FPT");
        imp.setSupplierPhone("02473007300");
        imp.setSupplierAddress("Hà Nội");
        imp.setUserId(1L);
        imp.setCreatorName("Quản trị viên Hệ thống");
        imp.setNotes("Nhập hàng đợt đầu tháng từ FPT");
        imp.setStatus("COMPLETED");

        List<ImportReceiptDetail> impDetails = new ArrayList<>();
        ImportReceiptDetail d1 = new ImportReceiptDetail(null, imp, 1L, "SP001", "Laptop Dell Inspiron 15", "Chiếc", 10, new BigDecimal("12500000"), new BigDecimal("125000000"));
        ImportReceiptDetail d2 = new ImportReceiptDetail(null, imp, 2L, "SP002", "Màn hình Asus 24 inch IPS", "Chiếc", 20, new BigDecimal("2200000"), new BigDecimal("44000000"));
        impDetails.add(d1);
        impDetails.add(d2);

        imp.setTotalAmount(new BigDecimal("169000000"));
        imp.setDetails(impDetails);
        importReceiptRepository.save(imp);

        // 3. Seed Sample Export Receipt
        ExportReceipt exp = new ExportReceipt();
        exp.setCode("PXK-20260905-0001");
        exp.setExportDate(LocalDateTime.now().minusDays(5));
        exp.setCustomer(cus1);
        exp.setUserId(2L);
        exp.setCreatorName("Quản lý kho Nguyễn Văn B");
        exp.setNotes("Xuất hàng theo đơn đặt FPT Shop");
        exp.setStatus("COMPLETED");

        List<ExportReceiptDetail> expDetails = new ArrayList<>();
        ExportReceiptDetail ed1 = new ExportReceiptDetail(null, exp, 1L, "SP001", "Laptop Dell Inspiron 15", "Chiếc", 2, new BigDecimal("15000000"), new BigDecimal("30000000"));
        ExportReceiptDetail ed2 = new ExportReceiptDetail(null, exp, 2L, "SP002", "Màn hình Asus 24 inch IPS", "Chiếc", 5, new BigDecimal("2850000"), new BigDecimal("14250000"));
        expDetails.add(ed1);
        expDetails.add(ed2);

        exp.setTotalAmount(new BigDecimal("44250000"));
        exp.setDetails(expDetails);
        exportReceiptRepository.save(exp);
    }

    private void syncProductNamesIfMissing() {
        try {
            List<ProductDTO> allProducts = productClient.getAll();
            if (allProducts == null || allProducts.isEmpty()) {
                return;
            }

            Map<Long, ProductDTO> productMap = allProducts.stream()
                    .filter(p -> p.getId() != null)
                    .collect(Collectors.toMap(ProductDTO::getId, p -> p, (a, b) -> a));

            List<ExportReceiptDetail> expDetails = exportReceiptDetailRepository.findAll();
            for (ExportReceiptDetail ed : expDetails) {
                if (ed.getProductId() != null) {
                    boolean needUpdate = ed.getProductName() == null
                            || ed.getProductName().isBlank()
                            || ed.getProductName().toLowerCase().startsWith("san pham #")
                            || ed.getProductCode() == null;
                    if (needUpdate) {
                        ProductDTO prod = productMap.get(ed.getProductId());
                        if (prod != null) {
                            ed.setProductName(prod.getName());
                            if (ed.getProductCode() == null || ed.getProductCode().isBlank()) {
                                ed.setProductCode(prod.getCode());
                            }
                            if (ed.getUnit() == null || ed.getUnit().isBlank()) {
                                ed.setUnit(prod.getUnit());
                            }
                            exportReceiptDetailRepository.save(ed);
                        }
                    }
                }
            }

            List<ImportReceiptDetail> impDetails = importReceiptDetailRepository.findAll();
            for (ImportReceiptDetail id : impDetails) {
                if (id.getProductId() != null) {
                    boolean needUpdate = id.getProductName() == null
                            || id.getProductName().isBlank()
                            || id.getProductName().toLowerCase().startsWith("san pham #")
                            || id.getProductCode() == null;
                    if (needUpdate) {
                        ProductDTO prod = productMap.get(id.getProductId());
                        if (prod != null) {
                            id.setProductName(prod.getName());
                            if (id.getProductCode() == null || id.getProductCode().isBlank()) {
                                id.setProductCode(prod.getCode());
                            }
                            if (id.getUnit() == null || id.getUnit().isBlank()) {
                                id.setUnit(prod.getUnit());
                            }
                            importReceiptDetailRepository.save(id);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not sync product names in receipt details: {}", e.getMessage());
        }
    }
}