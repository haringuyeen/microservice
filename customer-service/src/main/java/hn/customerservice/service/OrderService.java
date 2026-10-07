package hn.customerservice.service;

import hn.customerservice.client.ProductClient;
import hn.customerservice.dto.*;
import hn.customerservice.entity.Order;
import hn.customerservice.entity.OrderDetail;
import hn.customerservice.entity.OrderStatus;
import hn.customerservice.exception.BadRequestException;
import hn.customerservice.exception.InsufficientStockException;
import hn.customerservice.exception.ResourceNotFoundException;
import hn.customerservice.repository.CartItemRepository;
import hn.customerservice.repository.CartRepository;
import hn.customerservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductClient productClient;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    @Transactional(rollbackFor = Exception.class)
    public OrderDTO createOrder(OrderCreateDTO dto, Long customerId) {
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new BadRequestException("Đơn hàng không có sản phẩm nào");
        }

        // 1. Kiểm tra tồn kho real-time đồng bộ với product-service
        List<OrderDetail> details = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemDTO itemDto : dto.getItems()) {
            ProductDTO product;
            try {
                product = productClient.getById(itemDto.getProductId());
            } catch (Exception ex) {
                throw new BadRequestException(
                        "Không thể kết nối đến máy chủ quản lý kho (product-service) để kiểm tra tồn kho: " + ex.getMessage()
                );
            }

            if (product == null) {
                throw new ResourceNotFoundException("Sản phẩm id = " + itemDto.getProductId() + " không tồn tại");
            }

            int availableStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
            if (itemDto.getQuantity() > availableStock) {
                throw new InsufficientStockException(
                        String.format("Sản phẩm '%s' chỉ còn %d trong kho, không đủ số lượng %d yêu cầu.",
                                product.getName(), availableStock, itemDto.getQuantity())
                );
            }

            BigDecimal unitPrice = product.getExportPrice() != null ? product.getExportPrice() : BigDecimal.ZERO;
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemDto.getQuantity()));
            totalAmount = totalAmount.add(lineTotal);

            OrderDetail detail = OrderDetail.builder()
                    .productId(product.getId())
                    .productCode(product.getCode())
                    .productName(product.getName())
                    .unitPrice(unitPrice)
                    .quantity(itemDto.getQuantity())
                    .totalPrice(lineTotal)
                    .build();
            details.add(detail);
        }

        // 2. Sinh mã đơn hàng chuẩn ORD-yyyyMMdd-XXXX
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = orderRepository.count() + 1;
        String orderCode = String.format("ORD-%s-%04d", datePrefix, count);
        while (orderRepository.existsByOrderCode(orderCode)) {
            count++;
            orderCode = String.format("ORD-%s-%04d", datePrefix, count);
        }

        // 3. Tạo và lưu Order
        Order order = Order.builder()
                .orderCode(orderCode)
                .customerId(customerId)
                .customerName(dto.getCustomerName().trim())
                .customerPhone(dto.getCustomerPhone().trim())
                .shippingAddress(dto.getShippingAddress().trim())
                .totalAmount(totalAmount)
                .paymentMethod("COD")
                .status(OrderStatus.PENDING)
                .notes(dto.getNotes() != null ? dto.getNotes().trim() : null)
                .createdAt(LocalDateTime.now())
                .build();

        for (OrderDetail d : details) {
            d.setOrder(order);
        }
        order.setDetails(details);

        Order saved = orderRepository.save(order);

        // 4. Xóa giỏ hàng sau khi đặt hàng thành công
        try {
            if (customerId != null) {
                cartRepository.findByCustomerId(customerId).ifPresent(c -> {
                    c.getItems().clear();
                    cartItemRepository.deleteByCartId(c.getId());
                    cartRepository.save(c);
                });
            } else if (dto.getSessionId() != null && !dto.getSessionId().isBlank()) {
                cartRepository.findBySessionId(dto.getSessionId()).ifPresent(c -> {
                    c.getItems().clear();
                    cartItemRepository.deleteByCartId(c.getId());
                    cartRepository.save(c);
                });
            }
        } catch (Exception ignored) {
            // Không chặn đặt hàng nếu việc dọn giỏ có trục trặc nhẹ
        }

        return toDTO(saved);
    }

    public List<OrderDTO> getMyOrders(Long customerId) {
        if (customerId == null) {
            return List.of();
        }
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public OrderDTO getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng id = " + id));
        return toDTO(order);
    }

    public OrderDTO getOrderByCode(String code) {
        Order order = orderRepository.findByOrderCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng mã = " + code));
        return toDTO(order);
    }

    public Page<OrderDTO> searchOrders(String keyword, String statusStr, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable) {
        OrderStatus status = null;
        if (statusStr != null && !statusStr.isBlank()) {
            try {
                status = OrderStatus.valueOf(statusStr.toUpperCase());
            } catch (Exception ignored) {
            }
        }
        return orderRepository.searchOrders(keyword, status, fromDate, toDate, pageable).map(this::toDTO);
    }

    @Transactional
    public OrderDTO linkExportReceipt(Long orderId, Long exportReceiptId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng id = " + orderId));

        order.setExportReceiptId(exportReceiptId);
        order.setStatus(OrderStatus.EXPORT_REQUESTED);
        return toDTO(orderRepository.save(order));
    }

    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, String statusStr) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng id = " + orderId));

        OrderStatus status = OrderStatus.valueOf(statusStr.toUpperCase().trim());
        order.setStatus(status);
        return toDTO(orderRepository.save(order));
    }

    public OrderDTO toDTO(Order order) {
        List<OrderDetailDTO> details = order.getDetails() != null
                ? order.getDetails().stream().map(d -> OrderDetailDTO.builder()
                        .id(d.getId())
                        .productId(d.getProductId())
                        .productCode(d.getProductCode())
                        .productName(d.getProductName())
                        .unitPrice(d.getUnitPrice())
                        .quantity(d.getQuantity())
                        .totalPrice(d.getTotalPrice())
                        .build()).collect(Collectors.toList())
                : new ArrayList<>();

        return OrderDTO.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .customerId(order.getCustomerId())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .shippingAddress(order.getShippingAddress())
                .totalAmount(order.getTotalAmount())
                .paymentMethod(order.getPaymentMethod())
                .status(order.getStatus())
                .exportReceiptId(order.getExportReceiptId())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .details(details)
                .build();
    }
}
