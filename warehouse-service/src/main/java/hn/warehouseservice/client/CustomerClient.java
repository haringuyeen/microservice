package hn.warehouseservice.client;

import hn.warehouseservice.config.FeignClientConfig;
import hn.warehouseservice.dto.OrderDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "customer-service", url = "${customer-service.url:http://localhost:8084}", configuration = FeignClientConfig.class)
public interface CustomerClient {

    @GetMapping("/internal/orders/{id}")
    OrderDTO getOrderById(@PathVariable("id") Long id);

    @PutMapping("/internal/orders/{id}/link-export-receipt")
    OrderDTO linkExportReceipt(
            @PathVariable("id") Long id,
            @RequestParam("exportReceiptId") Long exportReceiptId
    );

    @PutMapping("/internal/orders/{id}/status")
    OrderDTO updateOrderStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") String status
    );
}
