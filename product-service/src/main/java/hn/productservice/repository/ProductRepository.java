package hn.productservice.repository;

import hn.productservice.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByCode(String code);
    boolean existsByCodeIgnoreCase(String code);
    List<Product> findBySupplierId(Long supplierId);

    @Query("SELECT p FROM Product p WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           " LOWER(p.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:supplierId IS NULL OR (p.supplier IS NOT NULL AND p.supplier.id = :supplierId)) AND " +
           "(:status IS NULL OR :status = '' OR p.status = :status) AND " +
           "(:inStock IS NULL OR (:inStock = true AND p.stockQuantity > 0) OR (:inStock = false AND p.stockQuantity = 0)) AND " +
           "(:minPrice IS NULL OR p.exportPrice >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.exportPrice <= :maxPrice)")
    Page<Product> searchProducts(@Param("keyword") String keyword,
                                 @Param("categoryId") Long categoryId,
                                 @Param("supplierId") Long supplierId,
                                 @Param("status") String status,
                                 @Param("inStock") Boolean inStock,
                                 @Param("minPrice") BigDecimal minPrice,
                                 @Param("maxPrice") BigDecimal maxPrice,
                                 Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.stockQuantity <= p.minStockLevel ORDER BY p.stockQuantity ASC")
    List<Product> findLowStockProducts();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.stockQuantity <= p.minStockLevel")
    long countLowStockProducts();

    @Query("SELECT COALESCE(SUM(p.stockQuantity * p.importPrice), 0) FROM Product p")
    BigDecimal calculateTotalStockValue();
}
