package hn.productservice.controller;

import hn.productservice.dto.SupplierDTO;
import hn.productservice.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/suppliers")
@RequiredArgsConstructor
public class SupplierController {
    private final SupplierService supplierService;

    @GetMapping
    public Page<SupplierDTO> search(@RequestParam(required = false) String keyword, Pageable pageable) {
        return supplierService.search(keyword, pageable);
    }

    @GetMapping("/all")
    public List<SupplierDTO> getAll() {
        return supplierService.getAll();
    }

    @GetMapping("/{id}")
    public SupplierDTO getById(@PathVariable Long id) {
        return supplierService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SupplierDTO create(@Valid @RequestBody SupplierDTO dto) {
        return supplierService.create(dto);
    }

    @PutMapping("/{id}")
    public SupplierDTO update(@PathVariable Long id, @Valid @RequestBody SupplierDTO dto) {
        return supplierService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        supplierService.delete(id);
    }
}
