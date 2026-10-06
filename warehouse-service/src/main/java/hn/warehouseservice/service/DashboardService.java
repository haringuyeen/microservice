package hn.warehouseservice.service;

import hn.warehouseservice.client.ProductClient;
import hn.warehouseservice.dto.DashboardDTO;
import hn.warehouseservice.dto.ExportReceiptDTO;
import hn.warehouseservice.dto.ImportReceiptDTO;
import hn.warehouseservice.dto.ProductDTO;
import hn.warehouseservice.dto.ProductStatsDTO;
import hn.warehouseservice.entity.ExportReceiptDetail;
import hn.warehouseservice.repository.ExportReceiptDetailRepository;
import hn.warehouseservice.repository.ExportReceiptRepository;
import hn.warehouseservice.repository.ImportReceiptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductClient productClient;
    private final ImportReceiptRepository importReceiptRepository;
    private final ExportReceiptRepository exportReceiptRepository;
    private final ExportReceiptDetailRepository exportReceiptDetailRepository;
    private final ImportReceiptService importReceiptService;
    private final ExportReceiptService exportReceiptService;

    public DashboardDTO getDashboardStats() {
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = LocalDate.now().atTime(LocalTime.MAX);

        // Giao tiếp liên dịch vụ: Lấy chỉ số tổng quan từ product-service
        long totalProducts = 0;
        BigDecimal totalStockValue = BigDecimal.ZERO;
        long lowStockCount = 0;
        List<ProductDTO> lowStockProducts = new ArrayList<>();

        try {
            ProductStatsDTO stats = productClient.getStats();
            if (stats != null) {
                totalProducts = stats.getTotalProducts();
                totalStockValue = stats.getTotalStockValue() != null ? stats.getTotalStockValue() : BigDecimal.ZERO;
                lowStockCount = stats.getLowStockCount();
            }
            lowStockProducts = productClient.getLowStock();
        } catch (Exception e) {
            // Fallback an toan neu product-service chua san sang
        }

        long totalImportsThisMonth = importReceiptRepository.countCompletedBetween(startOfMonth, endOfMonth);
        long totalExportsThisMonth = exportReceiptRepository.countCompletedBetween(startOfMonth, endOfMonth);

        BigDecimal totalImportValue = importReceiptRepository.sumTotalAmountBetween(startOfMonth, endOfMonth);
        if (totalImportValue == null) totalImportValue = BigDecimal.ZERO;

        BigDecimal totalExportValue = exportReceiptRepository.sumTotalAmountBetween(startOfMonth, endOfMonth);
        if (totalExportValue == null) totalExportValue = BigDecimal.ZERO;

        List<ImportReceiptDTO> recentImports = importReceiptRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "importDate"))
        ).map(importReceiptService::toDTO).getContent();

        List<ExportReceiptDTO> recentExports = exportReceiptRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "exportDate"))
        ).map(exportReceiptService::toDTO).getContent();

        // 6-month trend chart and details
        LocalDate now = LocalDate.now();
        LocalDateTime sixMonthsAgo = now.minusMonths(6).atStartOfDay();
        List<ExportReceiptDetail> details = exportReceiptDetailRepository.findCompletedWithReceiptBetween(sixMonthsAgo, LocalDateTime.now());

        Map<Long, BigDecimal> importPriceMap = new HashMap<>();
        Map<Long, String> productCatalogNames = new HashMap<>();
        try {
            List<ProductDTO> allProducts = productClient.getAll();
            if (allProducts != null) {
                for (ProductDTO p : allProducts) {
                    if (p.getId() != null) {
                        importPriceMap.put(p.getId(), p.getImportPrice() != null ? p.getImportPrice() : BigDecimal.ZERO);
                        if (p.getName() != null && !p.getName().isBlank()) {
                            productCatalogNames.put(p.getId(), p.getName());
                        }
                    }
                }
            }
        } catch (Exception e) {}

        // Calculate this month profit and today revenue
        BigDecimal totalProfitThisMonth = BigDecimal.ZERO;
        for (ExportReceiptDetail d : details) {
            if (d.getReceipt() != null && d.getReceipt().getExportDate() != null) {
                LocalDateTime dDate = d.getReceipt().getExportDate();
                if (!dDate.isBefore(startOfMonth) && !dDate.isAfter(endOfMonth)) {
                    int qty = d.getQuantity() != null ? d.getQuantity() : 0;
                    BigDecimal unitPrice = d.getUnitPrice() != null ? d.getUnitPrice() : BigDecimal.ZERO;
                    BigDecimal lineRev = d.getTotalPrice() != null ? d.getTotalPrice() : unitPrice.multiply(BigDecimal.valueOf(qty));
                    BigDecimal cost = importPriceMap.getOrDefault(d.getProductId(), BigDecimal.ZERO).multiply(BigDecimal.valueOf(qty));
                    totalProfitThisMonth = totalProfitThisMonth.add(lineRev.subtract(cost));
                }
            }
        }

        Double profitMarginThisMonth = 0.0;
        if (totalExportValue.compareTo(BigDecimal.ZERO) > 0) {
            profitMarginThisMonth = totalProfitThisMonth.multiply(BigDecimal.valueOf(100))
                    .divide(totalExportValue, 2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime endOfToday = LocalDate.now().atTime(LocalTime.MAX);
        BigDecimal totalRevenueToday = exportReceiptRepository.sumTotalAmountBetween(startOfToday, endOfToday);
        if (totalRevenueToday == null) totalRevenueToday = BigDecimal.ZERO;

        // 6-month trend chart
        List<Map<String, Object>> monthlyChart = new ArrayList<>();
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MM/yyyy");
        for (int i = 5; i >= 0; i--) {
            LocalDate m = now.minusMonths(i);
            LocalDateTime from = m.withDayOfMonth(1).atStartOfDay();
            LocalDateTime to = m.withDayOfMonth(m.lengthOfMonth()).atTime(LocalTime.MAX);

            BigDecimal impVal = importReceiptRepository.sumTotalAmountBetween(from, to);
            BigDecimal expVal = exportReceiptRepository.sumTotalAmountBetween(from, to);
            if (impVal == null) impVal = BigDecimal.ZERO;
            if (expVal == null) expVal = BigDecimal.ZERO;

            // Compute month profit
            BigDecimal monthCost = BigDecimal.ZERO;
            for (ExportReceiptDetail d : details) {
                if (d.getReceipt() != null && d.getReceipt().getExportDate() != null) {
                    LocalDateTime dDate = d.getReceipt().getExportDate();
                    if (!dDate.isBefore(from) && !dDate.isAfter(to)) {
                        int qty = d.getQuantity() != null ? d.getQuantity() : 0;
                        BigDecimal cost = importPriceMap.getOrDefault(d.getProductId(), BigDecimal.ZERO).multiply(BigDecimal.valueOf(qty));
                        monthCost = monthCost.add(cost);
                    }
                }
            }
            BigDecimal monthProfit = expVal.subtract(monthCost);

            Map<String, Object> point = new HashMap<>();
            point.put("month", m.format(monthFmt));
            point.put("importValue", impVal);
            point.put("exportValue", expVal);
            point.put("revenue", expVal);
            point.put("profit", monthProfit);
            monthlyChart.add(point);
        }

        // Top selling products (with soldQuantity and revenue)
        Map<Long, Integer> productQtyMap = new HashMap<>();
        Map<Long, BigDecimal> productRevenueMap = new HashMap<>();
        Map<Long, String> productNameMap = new HashMap<>();

        for (ExportReceiptDetail d : details) {
            if (d.getProductId() != null) {
                Long pId = d.getProductId();
                int qty = d.getQuantity() != null ? d.getQuantity() : 0;
                BigDecimal unitPrice = d.getUnitPrice() != null ? d.getUnitPrice() : BigDecimal.ZERO;
                BigDecimal lineRev = d.getTotalPrice() != null ? d.getTotalPrice() : unitPrice.multiply(BigDecimal.valueOf(qty));

                productQtyMap.put(pId, productQtyMap.getOrDefault(pId, 0) + qty);
                productRevenueMap.put(pId, productRevenueMap.getOrDefault(pId, BigDecimal.ZERO).add(lineRev));
                
                String realName = productCatalogNames.get(pId);
                if (realName == null || realName.isBlank()) {
                    if (d.getProductName() != null && !d.getProductName().isBlank() && !d.getProductName().toLowerCase().startsWith("san pham #")) {
                        realName = d.getProductName();
                    } else {
                        realName = "Sản phẩm #" + pId;
                    }
                }
                productNameMap.put(pId, realName);
            }
        }

        List<Map<String, Object>> topSelling = productQtyMap.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("productId", e.getKey());
                    map.put("productName", productNameMap.get(e.getKey()));
                    map.put("soldQuantity", e.getValue());
                    map.put("revenue", productRevenueMap.getOrDefault(e.getKey(), BigDecimal.ZERO));
                    return map;
                })
                .collect(Collectors.toList());

        return DashboardDTO.builder()
                .totalProducts(totalProducts)
                .totalStockValue(totalStockValue)
                .totalImportsThisMonth(totalImportsThisMonth)
                .totalExportsThisMonth(totalExportsThisMonth)
                .totalImportValueThisMonth(totalImportValue)
                .totalExportValueThisMonth(totalExportValue)
                .totalProfitThisMonth(totalProfitThisMonth)
                .profitMarginThisMonth(profitMarginThisMonth)
                .totalRevenueToday(totalRevenueToday)
                .lowStockCount(lowStockCount)
                .lowStockProducts(lowStockProducts)
                .recentImports(recentImports)
                .recentExports(recentExports)
                .monthlyChart(monthlyChart)
                .topSellingProducts(topSelling)
                .build();
    }
}