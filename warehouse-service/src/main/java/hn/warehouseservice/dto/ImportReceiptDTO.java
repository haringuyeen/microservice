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
public class ImportReceiptDTO {
    private Long id;
    private String code;
    private LocalDateTime importDate;

    @NotNull(message = "Nha cung cap khong duoc de trong")
    private Long supplierId;
    private String supplierCode;
    private String supplierName;
    private String supplierPhone;
    private String supplierAddress;

    private Long userId;
    private String creatorName;

    private BigDecimal totalAmount;
    private String notes;
    private String status;

    private Long approvedById;
    private String approverName;
    private LocalDateTime approvedAt;

    @NotEmpty(message = "Danh sach san pham nhap khong duoc de trong")
    @Valid
    private List<ImportReceiptDetailDTO> details;
}