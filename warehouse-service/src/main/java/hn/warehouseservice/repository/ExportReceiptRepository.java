package hn.warehouseservice.repository;

import hn.warehouseservice.entity.ExportReceipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ExportReceiptRepository extends JpaRepository<ExportReceipt, Long> {
    Optional<ExportReceipt> findByCode(String code);
    boolean existsByCodeIgnoreCase(String code);

    List<ExportReceipt> findByCustomerIdOrderByExportDateDesc(Long customerId);

    @Query("SELECT r FROM ExportReceipt r WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           " LOWER(r.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(r.creatorName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(r.customer.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:customerId IS NULL OR r.customer.id = :customerId) AND " +
           "(:status IS NULL OR :status = '' OR r.status = :status) AND " +
           "(:fromDate IS NULL OR r.exportDate >= :fromDate) AND " +
           "(:toDate IS NULL OR r.exportDate <= :toDate)")
    Page<ExportReceipt> searchReceipts(@Param("keyword") String keyword,
                                       @Param("customerId") Long customerId,
                                       @Param("status") String status,
                                       @Param("fromDate") LocalDateTime fromDate,
                                       @Param("toDate") LocalDateTime toDate,
                                       Pageable pageable);

    @Query("SELECT COUNT(r) FROM ExportReceipt r WHERE r.exportDate >= :from AND r.exportDate <= :to AND (r.status = 'COMPLETED' OR r.status = 'APPROVED')")
    long countCompletedBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(r.totalAmount), 0) FROM ExportReceipt r WHERE r.exportDate >= :from AND r.exportDate <= :to AND (r.status = 'COMPLETED' OR r.status = 'APPROVED')")
    BigDecimal sumTotalAmountBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}