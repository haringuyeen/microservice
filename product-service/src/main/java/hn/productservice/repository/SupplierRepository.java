package hn.productservice.repository;

import hn.productservice.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    Optional<Supplier> findByCode(String code);
    boolean existsByCodeIgnoreCase(String code);

    @Query("SELECT s FROM Supplier s WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           " LOWER(s.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(s.phone) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(s.address) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(s.contactPerson) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Supplier> search(@Param("keyword") String keyword, Pageable pageable);
}
