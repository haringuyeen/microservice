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
@Table(name = "export_receipt")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExportReceipt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "export_date", nullable = false)
    private LocalDateTime exportDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

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

    @Column(name = "order_id")
    private Long orderId;

    @OneToMany(mappedBy = "receipt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExportReceiptDetail> details = new ArrayList<>();
}