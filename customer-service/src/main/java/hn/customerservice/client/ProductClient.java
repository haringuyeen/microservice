package hn.customerservice.client;

import hn.customerservice.config.FeignClientConfig;
import hn.customerservice.dto.CategoryDTO;
import hn.customerservice.dto.ProductDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "product-service", url = "${product-service.url:http://localhost:8082}", configuration = FeignClientConfig.class)
public interface ProductClient {

    @GetMapping("/products/{id}")
    ProductDTO getById(@PathVariable("id") Long id);

    @GetMapping("/products/all")
    List<ProductDTO> getAll();

    @GetMapping("/categories/all")
    List<CategoryDTO> getAllCategories();

    @GetMapping("/products")
    Object searchProducts(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "categoryId", required = false) Long categoryId,
            @RequestParam(name = "status", required = false) String status
    );
}
