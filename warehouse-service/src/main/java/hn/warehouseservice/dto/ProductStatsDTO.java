package hn.warehouseservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductStatsDTO {
    private long totalProducts;
    private BigDecimal totalStockValue;
    private long lowStockCount;
}
