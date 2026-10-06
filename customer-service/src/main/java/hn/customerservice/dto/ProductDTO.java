package hn.customerservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDTO {
    private Long id;
    private String code;
    private String name;
    private Long categoryId;
    private String categoryName;
    private String categoryCode;
    private Long supplierId;
    private String supplierName;
    private String supplierCode;
    private String unit;
    private BigDecimal importPrice;
    private BigDecimal exportPrice;
    private Integer stockQuantity;
    private Integer minStockLevel;
    private String imageUrl;
    private String description;
    private String status;

    // Velvety Storefront attributes
    private String needTag; // Protect, Regenerate, Revitalize, Feeds, Regulate, Purifies
    private Double rating;
    private Integer reviewCount;
    private String size; // e.g. "50 ml", "100 ml"
    private Boolean isBestSeller;
    private BigDecimal originalPrice;
}
