package hn.warehouseservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExportReceiptDTO {
    private Long id;
    private String code;
    private LocalDateTime exportDate;

    @NotNull(message = "Khach hang khong duoc de trong")
    private Long customerId;
    private String customerCode;
    private String customerName;
    private String customerPhone;
    private String customerAddress;

    private Long userId;
    private String creatorName;

    private BigDecimal totalAmount;
    private String notes;
    private String status;

    private Long approvedById;
    private String approverName;
    private LocalDateTime approvedAt;

    private Long orderId;

    @NotEmpty(message = "Danh sach san pham xuat khong duoc de trong")
    @Valid
    private List<ExportReceiptDetailDTO> details;
}