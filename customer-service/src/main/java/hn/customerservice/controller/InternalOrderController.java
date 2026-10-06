package hn.customerservice.controller;

import hn.customerservice.dto.OrderDTO;
import hn.customerservice.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/orders")
@RequiredArgsConstructor
public class InternalOrderController {

    private final OrderService orderService;

    @GetMapping("/{id}")
    public OrderDTO getOrderForWarehouse(@PathVariable Long id) {
        return orderService.getOrderById(id);
    }

    @PutMapping("/{id}/link-export-receipt")
    public OrderDTO linkExportReceipt(
            @PathVariable Long id,
            @RequestParam Long exportReceiptId
    ) {
        return orderService.linkExportReceipt(id, exportReceiptId);
    }

    @PutMapping("/{id}/status")
    public OrderDTO updateStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        return orderService.updateOrderStatus(id, status);
    }
}
