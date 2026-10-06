package hn.warehouseservice.repository;

import hn.warehouseservice.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByCode(String code);
    Optional<Customer> findByPhone(String phone);
    boolean existsByCodeIgnoreCase(String code);

    @Query("SELECT c FROM Customer c WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           " LOWER(c.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(c.phone) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(c.address) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:customerType IS NULL OR :customerType = '' OR c.customerType = :customerType)")
    Page<Customer> search(@Param("keyword") String keyword,
                          @Param("customerType") String customerType,
                          Pageable pageable);
}