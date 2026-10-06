package hn.warehouseservice.repository;

import hn.warehouseservice.entity.ImportReceiptDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ImportReceiptDetailRepository extends JpaRepository<ImportReceiptDetail, Long> {
    List<ImportReceiptDetail> findByReceiptId(Long receiptId);
    List<ImportReceiptDetail> findByProductId(Long productId);

    @Query("SELECT d FROM ImportReceiptDetail d WHERE (d.receipt.status = 'COMPLETED' OR d.receipt.status = 'APPROVED') " +
           "AND (:fromDate IS NULL OR d.receipt.importDate >= :fromDate) " +
           "AND (:toDate IS NULL OR d.receipt.importDate <= :toDate)")
    List<ImportReceiptDetail> findCompletedBetween(@Param("fromDate") LocalDateTime fromDate,
                                                   @Param("toDate") LocalDateTime toDate);
}