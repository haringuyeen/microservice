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
public class CartItemDTO {
    private Long id;
    private Long productId;
    private String productCode;
    private String productName;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal totalPrice;
    private String imageUrl;
    private Integer currentStock;
}
