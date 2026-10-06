package hn.customerservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartDTO {
    private Long id;
    private Long customerId;
    private String sessionId;
    @Builder.Default
    private List<CartItemDTO> items = new ArrayList<>();
    private BigDecimal totalAmount;
    private Integer totalItems;
}
