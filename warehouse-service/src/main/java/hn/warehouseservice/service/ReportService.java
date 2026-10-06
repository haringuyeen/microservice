package hn.warehouseservice.service;

import hn.warehouseservice.client.ProductClient;
import hn.warehouseservice.dto.ProductDTO;
import hn.warehouseservice.dto.ReportDTO;
import hn.warehouseservice.entity.ExportReceiptDetail;
import hn.warehouseservice.entity.ImportReceiptDetail;
import hn.warehouseservice.repository.ExportReceiptDetailRepository;
import hn.warehouseservice.repository.ImportReceiptDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ProductClient productClient;
    private final ImportReceiptDetailRepository importReceiptDetailRepository;
    private final ExportReceiptDetailRepository exportReceiptDetailRepository;

    public List<ReportDTO.InventoryItem> getInventoryReport() {
        // Giao tiếp liên dịch vụ: Lấy danh sách sản phẩm từ product-service
        List<ProductDTO> products = productClient.getAll();
        List<ReportDTO.InventoryItem> result = new ArrayList<>();

        if (products == null) return result;

        for (ProductDTO p : products) {
            BigDecimal importPrice = p.getImportPrice() != null ? p.getImportPrice() : BigDecimal.ZERO;
            int stock = p.getStockQuantity() != null ? p.getStockQuantity() : 0;
            int minStock = p.getMinStockLevel() != null ? p.getMinStockLevel() : 10;
            BigDecimal totalVal = importPrice.multiply(BigDecimal.valueOf(stock));

            String status;
            if (stock == 0) {
                status = "HET_HANG";
            } else if (stock <= minStock) {
                status = "SAP_HET";
            } else {
                status = "CON_HANG";
            }

            result.add(ReportDTO.InventoryItem.builder()
                    .productId(p.getId())
                    .productCode(p.getCode())
                    .productName(p.getName())
                    .categoryName(p.getCategoryName() != null ? p.getCategoryName() : "")
                    .unit(p.getUnit())
                    .stockQuantity(stock)
                    .minStockLevel(minStock)
                    .importPrice(importPrice)
                    .totalValue(totalVal)
                    .status(status)
                    .build());
        }
        return result;
    }

    public List<ReportDTO.ImportExportInventoryItem> getImportExportInventoryReport(LocalDateTime fromDate, LocalDateTime toDate) {
        List<ProductDTO> products = productClient.getAll();
        List<ImportReceiptDetail> importDetails = importReceiptDetailRepository.findCompletedBetween(fromDate, toDate);
        List<ExportReceiptDetail> exportDetails = exportReceiptDetailRepository.findCompletedBetween(fromDate, toDate);

        Map<Long, Integer> importedMap = new HashMap<>();
        for (ImportReceiptDetail d : importDetails) {
            if (d.getProductId() != null) {
                Long pid = d.getProductId();
                importedMap.put(pid, importedMap.getOrDefault(pid, 0) + d.getQuantity());
            }
        }

        Map<Long, Integer> exportedMap = new HashMap<>();
        for (ExportReceiptDetail d : exportDetails) {
            if (d.getProductId() != null) {
                Long pid = d.getProductId();
                exportedMap.put(pid, exportedMap.getOrDefault(pid, 0) + d.getQuantity());
            }
        }

        List<ReportDTO.ImportExportInventoryItem> items = new ArrayList<>();
        if (products != null) {
            for (ProductDTO p : products) {
                int endingStock = p.getStockQuantity() != null ? p.getStockQuantity() : 0;
                int imported = importedMap.getOrDefault(p.getId(), 0);
                int exported = exportedMap.getOrDefault(p.getId(), 0);
                // Formula: Ton dau + Nhap - Xuat = Ton cuoi => Ton dau = Ton cuoi - Nhap + Xuat
                int initialStock = endingStock - imported + exported;
                BigDecimal importPrice = p.getImportPrice() != null ? p.getImportPrice() : BigDecimal.ZERO;
                BigDecimal endingValue = importPrice.multiply(BigDecimal.valueOf(endingStock));

                items.add(ReportDTO.ImportExportInventoryItem.builder()
                        .productId(p.getId())
                        .productCode(p.getCode())
                        .productName(p.getName())
                        .unit(p.getUnit())
                        .initialStock(Math.max(0, initialStock))
                        .importedQuantity(imported)
                        .exportedQuantity(exported)
                        .endingStock(endingStock)
                        .endingValue(endingValue)
                        .build());
            }
        }
        return items;
    }

    public ReportDTO.RevenueReport getRevenueReport(LocalDateTime fromDate, LocalDateTime toDate) {
        List<ProductDTO> products;
        try {
            products = productClient.getAll();
        } catch (Exception e) {
            products = new ArrayList<>();
        }
        if (products == null) products = new ArrayList<>();

        Map<Long, ProductDTO> productMap = products.stream()
                .filter(p -> p.getId() != null)
                .collect(Collectors.toMap(ProductDTO::getId, p -> p, (a, b) -> a));

        List<ExportReceiptDetail> details = exportReceiptDetailRepository.findCompletedWithReceiptBetween(fromDate, toDate);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        long totalItemsSold = 0;
        Set<Long> receiptIds = new HashSet<>();

        // Group structures
        class ProductAgg {
            Long productId;
            String productCode;
            String productName;
            String categoryName;
            String unit;
            BigDecimal importPrice = BigDecimal.ZERO;
            int quantity = 0;
            BigDecimal revenue = BigDecimal.ZERO;
            BigDecimal cost = BigDecimal.ZERO;
        }

        class ReceiptAgg {
            Long receiptId;
            String code;
            LocalDateTime exportDate;
            Long customerId;
            String customerName;
            String creatorName;
            String status;
            int quantity = 0;
            BigDecimal revenue = BigDecimal.ZERO;
            BigDecimal cost = BigDecimal.ZERO;
        }

        class CustomerAgg {
            Long customerId;
            String customerCode;
            String customerName;
            String customerPhone;
            Set<Long> customerReceiptIds = new HashSet<>();
            int quantity = 0;
            BigDecimal revenue = BigDecimal.ZERO;
            BigDecimal cost = BigDecimal.ZERO;
        }

        Map<Long, ProductAgg> prodAggMap = new HashMap<>();
        Map<Long, ReceiptAgg> recAggMap = new HashMap<>();
        Map<Long, CustomerAgg> cusAggMap = new HashMap<>();

        for (ExportReceiptDetail d : details) {
            int qty = d.getQuantity() != null ? d.getQuantity() : 0;
            BigDecimal unitPrice = d.getUnitPrice() != null ? d.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal lineRevenue = d.getTotalPrice() != null ? d.getTotalPrice() : unitPrice.multiply(BigDecimal.valueOf(qty));

            Long pId = d.getProductId();
            ProductDTO prod = pId != null ? productMap.get(pId) : null;
            BigDecimal importPrice = prod != null && prod.getImportPrice() != null ? prod.getImportPrice() : BigDecimal.ZERO;
            BigDecimal lineCost = importPrice.multiply(BigDecimal.valueOf(qty));

            totalRevenue = totalRevenue.add(lineRevenue);
            totalCost = totalCost.add(lineCost);
            totalItemsSold += qty;

            if (d.getReceipt() != null && d.getReceipt().getId() != null) {
                receiptIds.add(d.getReceipt().getId());
            }

            // Product Aggregation
            if (pId != null) {
                ProductAgg pa = prodAggMap.computeIfAbsent(pId, id -> {
                    ProductAgg a = new ProductAgg();
                    a.productId = id;
                    a.productCode = d.getProductCode() != null ? d.getProductCode() : (prod != null ? prod.getCode() : "SP" + id);
                    a.productName = d.getProductName() != null ? d.getProductName() : (prod != null ? prod.getName() : "Sản phẩm #" + id);
                    a.categoryName = prod != null && prod.getCategoryName() != null ? prod.getCategoryName() : "";
                    a.unit = d.getUnit() != null ? d.getUnit() : (prod != null ? prod.getUnit() : "");
                    a.importPrice = importPrice;
                    return a;
                });
                pa.quantity += qty;
                pa.revenue = pa.revenue.add(lineRevenue);
                pa.cost = pa.cost.add(lineCost);
            }

            // Receipt Aggregation
            if (d.getReceipt() != null && d.getReceipt().getId() != null) {
                Long rId = d.getReceipt().getId();
                ReceiptAgg ra = recAggMap.computeIfAbsent(rId, id -> {
                    ReceiptAgg a = new ReceiptAgg();
                    a.receiptId = id;
                    a.code = d.getReceipt().getCode();
                    a.exportDate = d.getReceipt().getExportDate();
                    a.creatorName = d.getReceipt().getCreatorName();
                    a.status = d.getReceipt().getStatus();
                    if (d.getReceipt().getCustomer() != null) {
                        a.customerId = d.getReceipt().getCustomer().getId();
                        a.customerName = d.getReceipt().getCustomer().getName();
                    } else {
                        a.customerName = "Khách lẻ";
                    }
                    return a;
                });
                ra.quantity += qty;
                ra.revenue = ra.revenue.add(lineRevenue);
                ra.cost = ra.cost.add(lineCost);

                // Customer Aggregation
                Long cId = ra.customerId != null ? ra.customerId : 0L;
                CustomerAgg ca = cusAggMap.computeIfAbsent(cId, id -> {
                    CustomerAgg a = new CustomerAgg();
                    a.customerId = id;
                    if (d.getReceipt().getCustomer() != null) {
                        a.customerCode = d.getReceipt().getCustomer().getCode();
                        a.customerName = d.getReceipt().getCustomer().getName();
                        a.customerPhone = d.getReceipt().getCustomer().getPhone();
                    } else {
                        a.customerCode = "LE";
                        a.customerName = "Khách lẻ";
                        a.customerPhone = "";
                    }
                    return a;
                });
                ca.customerReceiptIds.add(rId);
                ca.quantity += qty;
                ca.revenue = ca.revenue.add(lineRevenue);
                ca.cost = ca.cost.add(lineCost);
            }
        }

        BigDecimal grossProfit = totalRevenue.subtract(totalCost);
        Double profitMargin = 0.0;
        if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
            profitMargin = grossProfit.multiply(BigDecimal.valueOf(100))
                    .divide(totalRevenue, 2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        // Convert Product Aggs
        List<ReportDTO.RevenueByProductItem> byProduct = prodAggMap.values().stream()
                .map(pa -> {
                    BigDecimal profit = pa.revenue.subtract(pa.cost);
                    Double margin = 0.0;
                    if (pa.revenue.compareTo(BigDecimal.ZERO) > 0) {
                        margin = profit.multiply(BigDecimal.valueOf(100))
                                .divide(pa.revenue, 2, RoundingMode.HALF_UP)
                                .doubleValue();
                    }
                    BigDecimal avgPrice = pa.quantity > 0
                            ? pa.revenue.divide(BigDecimal.valueOf(pa.quantity), 0, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    return ReportDTO.RevenueByProductItem.builder()
                            .productId(pa.productId)
                            .productCode(pa.productCode)
                            .productName(pa.productName)
                            .categoryName(pa.categoryName)
                            .unit(pa.unit)
                            .soldQuantity(pa.quantity)
                            .avgExportPrice(avgPrice)
                            .importPrice(pa.importPrice)
                            .revenue(pa.revenue)
                            .cost(pa.cost)
                            .profit(profit)
                            .profitMargin(margin)
                            .build();
                })
                .sorted((a, b) -> b.getRevenue().compareTo(a.getRevenue()))
                .collect(Collectors.toList());

        // Convert Receipt Aggs
        List<ReportDTO.RevenueByReceiptItem> byReceipt = recAggMap.values().stream()
                .map(ra -> {
                    BigDecimal profit = ra.revenue.subtract(ra.cost);
                    Double margin = 0.0;
                    if (ra.revenue.compareTo(BigDecimal.ZERO) > 0) {
                        margin = profit.multiply(BigDecimal.valueOf(100))
                                .divide(ra.revenue, 2, RoundingMode.HALF_UP)
                                .doubleValue();
                    }
                    return ReportDTO.RevenueByReceiptItem.builder()
                            .receiptId(ra.receiptId)
                            .code(ra.code)
                            .exportDate(ra.exportDate)
                            .customerId(ra.customerId)
                            .customerName(ra.customerName)
                            .creatorName(ra.creatorName)
                            .totalQuantity(ra.quantity)
                            .revenue(ra.revenue)
                            .cost(ra.cost)
                            .profit(profit)
                            .profitMargin(margin)
                            .status(ra.status)
                            .build();
                })
                .sorted((a, b) -> {
                    if (b.getExportDate() == null || a.getExportDate() == null) return 0;
                    return b.getExportDate().compareTo(a.getExportDate());
                })
                .collect(Collectors.toList());

        // Convert Customer Aggs
        List<ReportDTO.RevenueByCustomerItem> byCustomer = cusAggMap.values().stream()
                .map(ca -> {
                    BigDecimal profit = ca.revenue.subtract(ca.cost);
                    Double margin = 0.0;
                    if (ca.revenue.compareTo(BigDecimal.ZERO) > 0) {
                        margin = profit.multiply(BigDecimal.valueOf(100))
                                .divide(ca.revenue, 2, RoundingMode.HALF_UP)
                                .doubleValue();
                    }
                    return ReportDTO.RevenueByCustomerItem.builder()
                            .customerId(ca.customerId)
                            .customerCode(ca.customerCode)
                            .customerName(ca.customerName)
                            .customerPhone(ca.customerPhone)
                            .receiptCount(ca.customerReceiptIds.size())
                            .totalQuantity(ca.quantity)
                            .revenue(ca.revenue)
                            .cost(ca.cost)
                            .profit(profit)
                            .profitMargin(margin)
                            .build();
                })
                .sorted((a, b) -> b.getRevenue().compareTo(a.getRevenue()))
                .collect(Collectors.toList());

        return ReportDTO.RevenueReport.builder()
                .totalRevenue(totalRevenue)
                .totalCost(totalCost)
                .grossProfit(grossProfit)
                .profitMargin(profitMargin)
                .totalReceipts(receiptIds.size())
                .totalItemsSold(totalItemsSold)
                .byProduct(byProduct)
                .byReceipt(byReceipt)
                .byCustomer(byCustomer)
                .build();
    }
}