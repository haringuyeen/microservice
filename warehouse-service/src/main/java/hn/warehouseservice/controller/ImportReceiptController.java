package hn.warehouseservice.controller;

import hn.warehouseservice.dto.ImportReceiptDTO;
import hn.warehouseservice.service.ImportReceiptService;
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
@RequestMapping("/import-receipts")
@RequiredArgsConstructor
public class ImportReceiptController {

    private final ImportReceiptService importReceiptService;

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
    public Page<ImportReceiptDTO> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            Pageable pageable) {
        return importReceiptService.search(keyword, supplierId, status, fromDate, toDate, pageable);
    }

    @GetMapping("/{id}")
    public ImportReceiptDTO getById(@PathVariable Long id) {
        return importReceiptService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ImportReceiptDTO create(@Valid @RequestBody ImportReceiptDTO dto, Authentication auth) {
        return importReceiptService.create(dto, getUserId(auth), getUsername(auth), getRole(auth));
    }

    @PutMapping("/{id}")
    public ImportReceiptDTO update(@PathVariable Long id, @Valid @RequestBody ImportReceiptDTO dto, Authentication auth) {
        return importReceiptService.update(id, dto, getUserId(auth), getUsername(auth), getRole(auth));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication auth) {
        importReceiptService.delete(id, getRole(auth));
    }

    @PatchMapping("/{id}/approve")
    public ImportReceiptDTO approveReceipt(@PathVariable Long id, Authentication auth) {
        return importReceiptService.approveReceipt(id, getUserId(auth), getUsername(auth), getRole(auth));
    }

    @PatchMapping("/{id}/reject")
    public ImportReceiptDTO rejectReceipt(@PathVariable Long id, Authentication auth) {
        return importReceiptService.rejectReceipt(id, getUserId(auth), getUsername(auth), getRole(auth));
    }

    @PatchMapping("/{id}/cancel")
    public ImportReceiptDTO cancelReceipt(@PathVariable Long id) {
        return importReceiptService.cancelReceipt(id);
    }
}