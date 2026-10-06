package hn.warehouseservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ReportDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InventoryItem {
        private Long productId;
        private String productCode;
        private String productName;
        private String categoryName;
        private String unit;
        private Integer stockQuantity;
        private Integer minStockLevel;
        private BigDecimal importPrice;
        private BigDecimal totalValue;
        private String status; // HET_HANG, SAP_HET, CON_HANG
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImportExportInventoryItem {
        private Long productId;
        private String productCode;
        private String productName;
        private String unit;
        private Integer initialStock;     // Ton dau ky
        private Integer importedQuantity; // Nhap trong ky
        private Integer exportedQuantity; // Xuat trong ky
        private Integer endingStock;      // Ton cuoi ky
        private BigDecimal endingValue;   // Gia tri ton cuoi
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RevenueReport {
        private BigDecimal totalRevenue;       // Tong doanh thu
        private BigDecimal totalCost;          // Tong gia von hang xuat (COGS)
        private BigDecimal grossProfit;        // Loi nhuan gop
        private Double profitMargin;           // Ty suat loi nhuan (%)
        private long totalReceipts;            // Tong so don xuat
        private long totalItemsSold;           // Tong so luong san pham da ban

        private List<RevenueByProductItem> byProduct;
        private List<RevenueByReceiptItem> byReceipt;
        private List<RevenueByCustomerItem> byCustomer;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RevenueByProductItem {
        private Long productId;
        private String productCode;
        private String productName;
        private String categoryName;
        private String unit;
        private Integer soldQuantity;
        private BigDecimal avgExportPrice;
        private BigDecimal importPrice;
        private BigDecimal revenue;
        private BigDecimal cost;
        private BigDecimal profit;
        private Double profitMargin;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RevenueByReceiptItem {
        private Long receiptId;
        private String code;
        private LocalDateTime exportDate;
        private Long customerId;
        private String customerName;
        private String creatorName;
        private Integer totalQuantity;
        private BigDecimal revenue;
        private BigDecimal cost;
        private BigDecimal profit;
        private Double profitMargin;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RevenueByCustomerItem {
        private Long customerId;
        private String customerCode;
        private String customerName;
        private String customerPhone;
        private long receiptCount;
        private Integer totalQuantity;
        private BigDecimal revenue;
        private BigDecimal cost;
        private BigDecimal profit;
        private Double profitMargin;
    }
}