package hn.warehouseservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDTO {
    private long totalProducts;
    private BigDecimal totalStockValue;
    private long totalImportsThisMonth;
    private long totalExportsThisMonth;
    private BigDecimal totalImportValueThisMonth;
    private BigDecimal totalExportValueThisMonth;
    private BigDecimal totalProfitThisMonth;
    private Double profitMarginThisMonth;
    private BigDecimal totalRevenueToday;
    private long lowStockCount;

    private List<ProductDTO> lowStockProducts;
    private List<ImportReceiptDTO> recentImports;
    private List<ExportReceiptDTO> recentExports;
    private List<Map<String, Object>> monthlyChart;
    private List<Map<String, Object>> topSellingProducts;
}