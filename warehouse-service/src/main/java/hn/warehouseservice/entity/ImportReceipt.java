package hn.warehouseservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "import_receipt")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportReceipt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "import_date", nullable = false)
    private LocalDateTime importDate;

    @Column(name = "supplier_id", nullable = false)
    private Long supplierId;

    @Column(name = "supplier_code", length = 50)
    private String supplierCode;

    @Column(name = "supplier_name", length = 200)
    private String supplierName;

    @Column(name = "supplier_phone", length = 20)
    private String supplierPhone;

    @Column(name = "supplier_address", length = 255)
    private String supplierAddress;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "creator_name", nullable = false, length = 150)
    private String creatorName;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, length = 30)
    private String status = "PENDING"; // PENDING, APPROVED, COMPLETED, CANCELLED, REJECTED

    @Column(name = "approved_by_id")
    private Long approvedById;

    @Column(name = "approver_name", length = 150)
    private String approverName;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @OneToMany(mappedBy = "receipt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ImportReceiptDetail> details = new ArrayList<>();
}