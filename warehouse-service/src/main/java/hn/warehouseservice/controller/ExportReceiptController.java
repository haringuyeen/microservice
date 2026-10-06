package hn.warehouseservice.controller;

import hn.warehouseservice.dto.ExportReceiptDTO;
import hn.warehouseservice.service.ExportReceiptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/export-receipts")
@RequiredArgsConstructor
public class ExportReceiptController {

    private final ExportReceiptService exportReceiptService;

    private String getRole(Authentication auth) {
        if (auth == null) return "";
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .findFirst().orElse("");
    }

    private Long getUserId(Authentication auth) {
        if (auth != null && auth.getCredentials() instanceof Long l) {
            return l;
        }
        return null;
    }

    private String getUsername(Authentication auth) {
        return auth != null ? auth.getName() : null;
    }

    @GetMapping
    public Page<ExportReceiptDTO> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            Pageable pageable) {
        return exportReceiptService.search(keyword, customerId, status, fromDate, toDate, pageable);
    }

    @GetMapping("/{id}")
    public ExportReceiptDTO getById(@PathVariable Long id) {
        return exportReceiptService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExportReceiptDTO create(@Valid @RequestBody ExportReceiptDTO dto, Authentication auth) {
        return exportReceiptService.create(dto, getUserId(auth), getUsername(auth), getRole(auth));
    }

    @PostMapping("/from-order/{orderId}")
    @ResponseStatus(HttpStatus.CREATED)
    public ExportReceiptDTO createFromOrder(@PathVariable Long orderId, Authentication auth) {
        return exportReceiptService.createFromOrder(orderId, getUserId(auth), getUsername(auth), getRole(auth));
    }

    @PutMapping("/{id}")
    public ExportReceiptDTO update(@PathVariable Long id, @Valid @RequestBody ExportReceiptDTO dto, Authentication auth) {
        return exportReceiptService.update(id, dto, getUserId(auth), getUsername(auth), getRole(auth));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication auth) {
        exportReceiptService.delete(id, getRole(auth));
    }

    @PatchMapping("/{id}/approve")
    public ExportReceiptDTO approveReceipt(@PathVariable Long id, Authentication auth) {
        return exportReceiptService.approveReceipt(id, getUserId(auth), getUsername(auth), getRole(auth));
    }

    @PatchMapping("/{id}/reject")
    public ExportReceiptDTO rejectReceipt(@PathVariable Long id, Authentication auth) {
        return exportReceiptService.rejectReceipt(id, getUserId(auth), getUsername(auth), getRole(auth));
    }

    @PatchMapping("/{id}/cancel")
    public ExportReceiptDTO cancelReceipt(@PathVariable Long id) {
        return exportReceiptService.cancelReceipt(id);
    }
}