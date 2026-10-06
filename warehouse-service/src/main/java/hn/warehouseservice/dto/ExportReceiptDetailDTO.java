package hn.warehouseservice.dto;

import jakarta.validation.constraints.Min;
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
public class ExportReceiptDetailDTO {
    private Long id;

    @NotNull(message = "San pham khong duoc de trong")
    private Long productId;
    private String productCode;
    private String productName;
    private String unit;

    @NotNull(message = "So luong khong duoc de trong")
    @Min(value = 1, message = "So luong phai lon hon 0")
    private Integer quantity;

    @NotNull(message = "Don gia khong duoc de trong")
    @Min(value = 0, message = "Don gia khong hop le")
    private BigDecimal unitPrice;

    private BigDecimal totalPrice;
}