package hn.customerservice.repository;

import hn.customerservice.entity.Order;
import hn.customerservice.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    Optional<Order> findByOrderCode(String orderCode);

    boolean existsByOrderCode(String orderCode);

    @Query("SELECT o FROM Order o WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           " OR LOWER(o.customerName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           " OR LOWER(o.customerPhone) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:status IS NULL OR o.status = :status) " +
           "AND (:fromDate IS NULL OR o.createdAt >= :fromDate) " +
           "AND (:toDate IS NULL OR o.createdAt <= :toDate)")
    Page<Order> searchOrders(@Param("keyword") String keyword,
                             @Param("status") OrderStatus status,
                             @Param("fromDate") LocalDateTime fromDate,
                             @Param("toDate") LocalDateTime toDate,
                             Pageable pageable);
}
