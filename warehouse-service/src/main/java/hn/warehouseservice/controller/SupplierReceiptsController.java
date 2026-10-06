package hn.warehouseservice.controller;

import hn.warehouseservice.dto.ImportReceiptDTO;
import hn.warehouseservice.service.ImportReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/suppliers")
@RequiredArgsConstructor
public class SupplierReceiptsController {

    private final ImportReceiptService importReceiptService;

    @GetMapping("/{id}/receipts")
    public List<ImportReceiptDTO> getReceipts(@PathVariable Long id) {
        return importReceiptService.getBySupplier(id);
    }
}
