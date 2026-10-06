package hn.warehouseservice.client;

import hn.warehouseservice.config.FeignClientConfig;
import hn.warehouseservice.dto.SupplierDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "supplier-client", url = "${product-service.url:http://localhost:8082}", configuration = FeignClientConfig.class)
public interface SupplierClient {

    @GetMapping("/suppliers/{id}")
    SupplierDTO getById(@PathVariable("id") Long id);

    @GetMapping("/suppliers/all")
    List<SupplierDTO> getAll();
}
