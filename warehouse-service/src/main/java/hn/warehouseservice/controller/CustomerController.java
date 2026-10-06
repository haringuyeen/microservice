package hn.warehouseservice.controller;

import hn.warehouseservice.dto.CustomerDTO;
import hn.warehouseservice.dto.ExportReceiptDTO;
import hn.warehouseservice.service.CustomerService;
import hn.warehouseservice.service.ExportReceiptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
public class CustomerController {
    private final CustomerService customerService;
    private final ExportReceiptService exportReceiptService;

    @GetMapping
    public Page<CustomerDTO> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String customerType,
            Pageable pageable) {
        return customerService.search(keyword, customerType, pageable);
    }

    @GetMapping("/all")
    public List<CustomerDTO> getAll() {
        return customerService.getAll();
    }

    @GetMapping("/{id}")
    public CustomerDTO getById(@PathVariable Long id) {
        return customerService.getById(id);
    }

    @GetMapping("/{id}/receipts")
    public List<ExportReceiptDTO> getReceipts(@PathVariable Long id) {
        return exportReceiptService.getByCustomer(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerDTO create(@Valid @RequestBody CustomerDTO dto) {
        return customerService.create(dto);
    }

    @PutMapping("/{id}")
    public CustomerDTO update(@PathVariable Long id, @Valid @RequestBody CustomerDTO dto) {
        return customerService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        customerService.delete(id);
    }
}