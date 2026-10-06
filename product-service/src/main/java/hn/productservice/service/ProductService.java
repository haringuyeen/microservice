package hn.productservice.service;

import hn.productservice.dto.ProductDTO;
import hn.productservice.dto.ProductStatsDTO;
import hn.productservice.entity.Category;
import hn.productservice.entity.Product;
import hn.productservice.entity.Supplier;
import hn.productservice.repository.CategoryRepository;
import hn.productservice.repository.ProductRepository;
import hn.productservice.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;

    public Page<ProductDTO> searchProducts(String keyword, Long categoryId, Long supplierId, String status, Boolean inStock,
                                          BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        return productRepository.searchProducts(keyword, categoryId, supplierId, status, inStock, minPrice, maxPrice, pageable)
                .map(this::toDTO);
    }

    public List<ProductDTO> getBySupplier(Long supplierId) {
        return productRepository.findBySupplierId(supplierId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<ProductDTO> getAll() {
        return productRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ProductDTO getById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay san pham id = " + id));
        return toDTO(p);
    }

    public List<ProductDTO> getLowStockProducts() {
        return productRepository.findLowStockProducts().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ProductStatsDTO getStats() {
        long totalProducts = productRepository.count();
        BigDecimal totalValue = productRepository.calculateTotalStockValue();
        long lowStockCount = productRepository.countLowStockProducts();
        return ProductStatsDTO.builder()
                .totalProducts(totalProducts)
                .totalStockValue(totalValue != null ? totalValue : BigDecimal.ZERO)
                .lowStockCount(lowStockCount)
                .build();
    }

    @Transactional
    public ProductDTO adjustStock(Long id, int quantityDelta) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay san pham id = " + id));

        int newStock = p.getStockQuantity() + quantityDelta;
        if (newStock < 0) {
            throw new IllegalArgumentException("San pham '" + p.getName() + "' (Ma: " + p.getCode()
                    + ") chi con " + p.getStockQuantity() + " " + p.getUnit()
                    + " trong kho, khong du de xuat " + (-quantityDelta) + " " + p.getUnit());
        }
        p.setStockQuantity(newStock);
        return toDTO(productRepository.save(p));
    }

    @Transactional
    public ProductDTO create(ProductDTO dto) {
        if (productRepository.existsByCodeIgnoreCase(dto.getCode())) {
            throw new IllegalArgumentException("Ma san pham '" + dto.getCode() + "' da ton tai");
        }
        if (dto.getExportPrice() != null && dto.getImportPrice() != null
                && dto.getExportPrice().compareTo(dto.getImportPrice()) <= 0) {
            throw new IllegalArgumentException("Giá bán phải lớn hơn giá nhập");
        }
        Category cat = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay danh muc id = " + dto.getCategoryId()));

        if (dto.getSupplierId() == null) {
            throw new IllegalArgumentException("Nhà cung cấp không được để trống");
        }
        Supplier sup = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay nha cung cap id = " + dto.getSupplierId()));

        Product p = new Product();
        p.setCode(dto.getCode().toUpperCase().trim());
        p.setName(dto.getName().trim());
        p.setCategory(cat);
        p.setSupplier(sup);
        p.setUnit(dto.getUnit().trim());
        p.setImportPrice(dto.getImportPrice());
        p.setExportPrice(dto.getExportPrice());
        p.setStockQuantity(dto.getStockQuantity() == null ? 0 : dto.getStockQuantity());
        p.setMinStockLevel(dto.getMinStockLevel() == null ? 10 : dto.getMinStockLevel());
        p.setImageUrl(dto.getImageUrl());
        p.setDescription(dto.getDescription());
        p.setStatus(dto.getStatus() == null ? "ACTIVE" : dto.getStatus());

        return toDTO(productRepository.save(p));
    }

    @Transactional
    public ProductDTO update(Long id, ProductDTO dto) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay san pham id = " + id));

        if (!p.getCode().equalsIgnoreCase(dto.getCode().trim()) && productRepository.existsByCodeIgnoreCase(dto.getCode().trim())) {
            throw new IllegalArgumentException("Ma san pham '" + dto.getCode() + "' da ton tai");
        }
        if (dto.getExportPrice() != null && dto.getImportPrice() != null
                && dto.getExportPrice().compareTo(dto.getImportPrice()) <= 0) {
            throw new IllegalArgumentException("Giá bán phải lớn hơn giá nhập");
        }

        Category cat = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay danh muc id = " + dto.getCategoryId()));

        if (dto.getSupplierId() == null) {
            throw new IllegalArgumentException("Nhà cung cấp không được để trống");
        }
        Supplier updateSup = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay nha cung cap id = " + dto.getSupplierId()));

        p.setCode(dto.getCode().toUpperCase().trim());
        p.setName(dto.getName().trim());
        p.setCategory(cat);
        p.setSupplier(updateSup);
        p.setUnit(dto.getUnit().trim());
        p.setImportPrice(dto.getImportPrice());
        p.setExportPrice(dto.getExportPrice());
        if (dto.getStockQuantity() != null) {
            p.setStockQuantity(dto.getStockQuantity());
        }
        if (dto.getMinStockLevel() != null) {
            p.setMinStockLevel(dto.getMinStockLevel());
        }
        p.setImageUrl(dto.getImageUrl());
        p.setDescription(dto.getDescription());
        if (dto.getStatus() != null) {
            p.setStatus(dto.getStatus());
        }

        return toDTO(productRepository.save(p));
    }

    @Transactional
    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new NoSuchElementException("Khong tim thay san pham id = " + id);
        }
        productRepository.deleteById(id);
    }

    public ProductDTO toDTO(Product p) {
        return ProductDTO.builder()
                .id(p.getId())
                .code(p.getCode())
                .name(p.getName())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryCode(p.getCategory() != null ? p.getCategory().getCode() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .supplierId(p.getSupplier() != null ? p.getSupplier().getId() : null)
                .supplierCode(p.getSupplier() != null ? p.getSupplier().getCode() : null)
                .supplierName(p.getSupplier() != null ? p.getSupplier().getName() : null)
                .unit(p.getUnit())
                .importPrice(p.getImportPrice())
                .exportPrice(p.getExportPrice())
                .stockQuantity(p.getStockQuantity())
                .minStockLevel(p.getMinStockLevel())
                .imageUrl(p.getImageUrl())
                .description(p.getDescription())
                .status(p.getStatus())
                .build();
    }
}
