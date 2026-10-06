package hn.warehouseservice.repository;

import hn.warehouseservice.entity.ExportReceiptDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ExportReceiptDetailRepository extends JpaRepository<ExportReceiptDetail, Long> {
    List<ExportReceiptDetail> findByReceiptId(Long receiptId);
    List<ExportReceiptDetail> findByProductId(Long productId);

    @Query("SELECT d FROM ExportReceiptDetail d WHERE (d.receipt.status = 'COMPLETED' OR d.receipt.status = 'APPROVED') " +
           "AND (:fromDate IS NULL OR d.receipt.exportDate >= :fromDate) " +
           "AND (:toDate IS NULL OR d.receipt.exportDate <= :toDate)")
    List<ExportReceiptDetail> findCompletedBetween(@Param("fromDate") LocalDateTime fromDate,
                                                   @Param("toDate") LocalDateTime toDate);

    @Query("SELECT d FROM ExportReceiptDetail d JOIN FETCH d.receipt r LEFT JOIN FETCH r.customer c " +
           "WHERE (r.status = 'COMPLETED' OR r.status = 'APPROVED') " +
           "AND (:fromDate IS NULL OR r.exportDate >= :fromDate) " +
           "AND (:toDate IS NULL OR r.exportDate <= :toDate)")
    List<ExportReceiptDetail> findCompletedWithReceiptBetween(@Param("fromDate") LocalDateTime fromDate,
                                                             @Param("toDate") LocalDateTime toDate);
}