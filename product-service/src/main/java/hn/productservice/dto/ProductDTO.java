package hn.productservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    @NotBlank(message = "Ma san pham khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten san pham khong duoc de trong")
    private String name;

    @NotNull(message = "Danh muc khong duoc de trong")
    private Long categoryId;
    private String categoryName;
    private String categoryCode;

    @NotNull(message = "Nha cung cap khong duoc de trong")
    private Long supplierId;
    private String supplierName;
    private String supplierCode;

    @NotBlank(message = "Don vi tinh khong duoc de trong")
    private String unit;

    @NotNull(message = "Gia nhap khong duoc de trong")
    @Min(value = 0, message = "Gia nhap khong hop le")
    private BigDecimal importPrice;

    @NotNull(message = "Gia ban khong duoc de trong")
    @Min(value = 0, message = "Gia ban khong hop le")
    private BigDecimal exportPrice;

    private Integer stockQuantity;
    private Integer minStockLevel;
    private String imageUrl;
    private String description;
    private String status;
}
