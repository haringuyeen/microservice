package hn.customerservice.service;

import hn.customerservice.client.ProductClient;
import hn.customerservice.dto.CategoryDTO;
import hn.customerservice.dto.ProductDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StorefrontProductService {

    private final ProductClient productClient;

    public List<ProductDTO> getProducts(String needTag, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice, String sortBy) {
        List<ProductDTO> products;
        try {
            products = productClient.getAll();
        } catch (Exception ex) {
            products = Collections.emptyList();
        }

        // Enrich with proper category attributes
        List<ProductDTO> enriched = products.stream()
                .filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus()))
                .map(this::enrichProduct)
                .collect(Collectors.toList());

        // Filter by Classification / Category
        if (needTag != null && !needTag.isBlank() 
                && !"all".equalsIgnoreCase(needTag) 
                && !"all needs".equalsIgnoreCase(needTag) 
                && !"tất cả".equalsIgnoreCase(needTag)) {
            String filter = needTag.trim().toLowerCase();
            enriched = enriched.stream()
                    .filter(p -> {
                        String pNeed = p.getNeedTag() != null ? p.getNeedTag().toLowerCase() : "";
                        String pCat = p.getCategoryName() != null ? p.getCategoryName().toLowerCase() : "";
                        String pCode = p.getCategoryCode() != null ? p.getCategoryCode().toLowerCase() : "";
                        return pNeed.contains(filter) || pCat.contains(filter) || pCode.contains(filter) || filter.contains(pNeed);
                    })
                    .collect(Collectors.toList());
        }

        // Filter by Category ID
        if (categoryId != null) {
            enriched = enriched.stream()
                    .filter(p -> categoryId.equals(p.getCategoryId()))
                    .collect(Collectors.toList());
        }

        // Filter by Price
        if (minPrice != null) {
            enriched = enriched.stream()
                    .filter(p -> p.getExportPrice() != null && p.getExportPrice().compareTo(minPrice) >= 0)
                    .collect(Collectors.toList());
        }
        if (maxPrice != null) {
            enriched = enriched.stream()
                    .filter(p -> p.getExportPrice() != null && p.getExportPrice().compareTo(maxPrice) <= 0)
                    .collect(Collectors.toList());
        }

        // Sort
        if ("price_asc".equalsIgnoreCase(sortBy)) {
            enriched.sort(Comparator.comparing(ProductDTO::getExportPrice, Comparator.nullsLast(BigDecimal::compareTo)));
        } else if ("price_desc".equalsIgnoreCase(sortBy)) {
            enriched.sort(Comparator.comparing(ProductDTO::getExportPrice, Comparator.nullsLast(BigDecimal::compareTo)).reversed());
        } else if ("best_selling".equalsIgnoreCase(sortBy)) {
            enriched.sort(Comparator.comparing(p -> p.getIsBestSeller() != null && p.getIsBestSeller() ? 0 : 1));
        }

        return enriched;
    }

    public ProductDTO getProductById(Long id) {
        ProductDTO p = productClient.getById(id);
        if (p == null) {
            return null;
        }
        return enrichProduct(p);
    }

    public List<CategoryDTO> getCategories() {
        try {
            return productClient.getAllCategories();
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }

    private ProductDTO enrichProduct(ProductDTO p) {
        // Set real product category as the classification badge
        String catName = p.getCategoryName();
        if (catName != null && !catName.isBlank()) {
            p.setNeedTag(catName);
        } else {
            p.setNeedTag("Sản phẩm");
        }

        // Set size to real unit (Chiếc, Bộ, Cái, Thùng, Chai, Hũ, v.v.) - NO MORE "ml"!
        if (p.getUnit() != null && !p.getUnit().isBlank()) {
            p.setSize(p.getUnit());
        } else {
            p.setSize(null);
        }

        // Clean up rating / reviewCount
        p.setRating(null);
        p.setReviewCount(null);

        // Popular products marked as Best Seller
        String code = p.getCode() != null ? p.getCode().toUpperCase().trim() : "";
        boolean isTop = "SP001".equals(code) || "SP002".equals(code) || "VEL-001".equals(code) || "VEL-002".equals(code) || "VEL-008".equals(code);
        p.setIsBestSeller(isTop);

        // Original price for discount reference
        if (p.getExportPrice() != null) {
            p.setOriginalPrice(p.getExportPrice().multiply(BigDecimal.valueOf(1.15)).setScale(0, RoundingMode.HALF_UP));
        }

        return p;
    }
}
