package hn.warehouseservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDTO {
    private Long id;
    private String orderCode;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String shippingAddress;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private String status;
    private Long exportReceiptId;
    private String notes;
    private LocalDateTime createdAt;
    @Builder.Default
    private List<OrderDetailDTO> details = new ArrayList<>();
}
