package hn.productservice.repository;

import hn.productservice.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByCode(String code);
    boolean existsByCodeIgnoreCase(String code);
    boolean existsByNameIgnoreCase(String name);

    @Query("SELECT c FROM Category c WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           " LOWER(c.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Category> search(@Param("keyword") String keyword, Pageable pageable);
}
