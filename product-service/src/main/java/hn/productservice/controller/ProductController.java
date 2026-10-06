package hn.productservice.controller;

import hn.productservice.dto.ProductDTO;
import hn.productservice.dto.ProductStatsDTO;
import hn.productservice.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping
    public Page<ProductDTO> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            Pageable pageable) {
        return productService.searchProducts(keyword, categoryId, supplierId, status, inStock, minPrice, maxPrice, pageable);
    }

    @GetMapping("/by-supplier/{supplierId}")
    public List<ProductDTO> getBySupplier(@PathVariable Long supplierId) {
        return productService.getBySupplier(supplierId);
    }

    @GetMapping("/all")
    public List<ProductDTO> getAll() {
        return productService.getAll();
    }

    @GetMapping("/low-stock")
    public List<ProductDTO> getLowStock() {
        return productService.getLowStockProducts();
    }

    @GetMapping("/stats")
    public ProductStatsDTO getStats() {
        return productService.getStats();
    }

    @GetMapping("/{id}")
    public ProductDTO getById(@PathVariable Long id) {
        return productService.getById(id);
    }

    @PostMapping("/{id}/adjust-stock")
    public ProductDTO adjustStock(@PathVariable Long id, @RequestParam int delta) {
        return productService.adjustStock(id, delta);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductDTO create(@Valid @RequestBody ProductDTO dto) {
        return productService.create(dto);
    }

    @PutMapping("/{id}")
    public ProductDTO update(@PathVariable Long id, @Valid @RequestBody ProductDTO dto) {
        return productService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        productService.delete(id);
    }
}
