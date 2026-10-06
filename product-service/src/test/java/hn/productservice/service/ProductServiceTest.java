package hn.productservice.service;

import hn.productservice.dto.ProductDTO;
import hn.productservice.repository.CategoryRepository;
import hn.productservice.repository.ProductRepository;
import hn.productservice.repository.SupplierRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @InjectMocks
    private ProductService productService;

    private ProductDTO validDto;

    @BeforeEach
    void setUp() {
        validDto = ProductDTO.builder()
                .code("SP999")
                .name("Sản phẩm thử nghiệm")
                .categoryId(1L)
                .unit("Cái")
                .importPrice(new BigDecimal("100000"))
                .exportPrice(new BigDecimal("150000"))
                .build();
    }

    @Test
    @DisplayName("Create should throw IllegalArgumentException when exportPrice < importPrice")
    void testCreate_ExportPriceLessThanImportPrice_ThrowsException() {
        validDto.setExportPrice(new BigDecimal("80000"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            productService.create(validDto);
        });

        assertEquals("Giá bán phải lớn hơn giá nhập", ex.getMessage());
    }

    @Test
    @DisplayName("Create should throw IllegalArgumentException when exportPrice == importPrice")
    void testCreate_ExportPriceEqualsImportPrice_ThrowsException() {
        validDto.setExportPrice(new BigDecimal("100000"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            productService.create(validDto);
        });

        assertEquals("Giá bán phải lớn hơn giá nhập", ex.getMessage());
    }

    @Test
    @DisplayName("Update should throw IllegalArgumentException when exportPrice <= importPrice")
    void testUpdate_ExportPriceLessThanOrEqualToImportPrice_ThrowsException() {
        hn.productservice.entity.Product existing = new hn.productservice.entity.Product();
        existing.setId(1L);
        existing.setCode("SP999");
        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));

        validDto.setExportPrice(new BigDecimal("100000"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            productService.update(1L, validDto);
        });

        assertEquals("Giá bán phải lớn hơn giá nhập", ex.getMessage());
    }
}
