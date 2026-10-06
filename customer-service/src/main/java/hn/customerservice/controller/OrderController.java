package hn.customerservice.controller;

import hn.customerservice.dto.OrderCreateDTO;
import hn.customerservice.dto.OrderDTO;
import hn.customerservice.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDTO createOrder(
            Authentication authentication,
            @Valid @RequestBody OrderCreateDTO dto
    ) {
        Long customerId = extractCustomerId(authentication);
        return orderService.createOrder(dto, customerId);
    }

    @GetMapping("/my-orders")
    public List<OrderDTO> getMyOrders(Authentication authentication) {
        Long customerId = extractCustomerId(authentication);
        if (customerId == null) {
            throw new IllegalArgumentException("Yêu cầu đăng nhập để xem lịch sử đơn hàng");
        }
        return orderService.getMyOrders(customerId);
    }

    @GetMapping("/{id}")
    public OrderDTO getOrderById(@PathVariable Long id) {
        return orderService.getOrderById(id);
    }

    @GetMapping("/by-code/{code}")
    public OrderDTO getOrderByCode(@PathVariable String code) {
        return orderService.getOrderByCode(code);
    }

    // Cho WMS Admin (crs-frontend) xem toàn bộ đơn hàng
    @GetMapping
    public Page<OrderDTO> listOrders(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            Pageable pageable
    ) {
        return orderService.searchOrders(keyword, status, fromDate, toDate, pageable);
    }

    private Long extractCustomerId(Authentication authentication) {
        if (authentication != null && authentication.getCredentials() instanceof Long userId) {
            return userId;
        }
        return null;
    }
}
