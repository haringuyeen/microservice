package hn.warehouseservice.repository;

import hn.warehouseservice.entity.ImportReceipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ImportReceiptRepository extends JpaRepository<ImportReceipt, Long> {
    Optional<ImportReceipt> findByCode(String code);
    boolean existsByCodeIgnoreCase(String code);

    List<ImportReceipt> findBySupplierIdOrderByImportDateDesc(Long supplierId);

    @Query("SELECT r FROM ImportReceipt r WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           " LOWER(r.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(r.creatorName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " (r.supplierName IS NOT NULL AND LOWER(r.supplierName) LIKE LOWER(CONCAT('%', :keyword, '%')))) AND " +
           "(:supplierId IS NULL OR r.supplierId = :supplierId) AND " +
           "(:status IS NULL OR :status = '' OR r.status = :status) AND " +
           "(:fromDate IS NULL OR r.importDate >= :fromDate) AND " +
           "(:toDate IS NULL OR r.importDate <= :toDate)")
    Page<ImportReceipt> searchReceipts(@Param("keyword") String keyword,
                                       @Param("supplierId") Long supplierId,
                                       @Param("status") String status,
                                       @Param("fromDate") LocalDateTime fromDate,
                                       @Param("toDate") LocalDateTime toDate,
                                       Pageable pageable);

    @Query("SELECT COUNT(r) FROM ImportReceipt r WHERE r.importDate >= :from AND r.importDate <= :to AND (r.status = 'COMPLETED' OR r.status = 'APPROVED')")
    long countCompletedBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(r.totalAmount), 0) FROM ImportReceipt r WHERE r.importDate >= :from AND r.importDate <= :to AND (r.status = 'COMPLETED' OR r.status = 'APPROVED')")
    BigDecimal sumTotalAmountBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}