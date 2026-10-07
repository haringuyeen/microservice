package hn.warehouseservice.client;

import hn.warehouseservice.config.FeignClientConfig;
import hn.warehouseservice.dto.ProductDTO;
import hn.warehouseservice.dto.ProductStatsDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "product-service", url = "${product-service.url:http://localhost:8082}", configuration = FeignClientConfig.class)
public interface ProductClient {

    @GetMapping("/products/{id}")
    ProductDTO getById(@PathVariable("id") Long id);

    @GetMapping("/products/all")
    List<ProductDTO> getAll();

    @GetMapping("/products/low-stock")
    List<ProductDTO> getLowStock();

    @GetMapping("/products/stats")
    ProductStatsDTO getStats();

    @PostMapping("/products/{id}/adjust-stock")
    ProductDTO adjustStock(@PathVariable("id") Long id, @RequestParam("delta") int delta);
}
