package hn.customerservice.service;

import hn.customerservice.client.ProductClient;
import hn.customerservice.dto.AddToCartRequestDTO;
import hn.customerservice.dto.CartDTO;
import hn.customerservice.dto.CartItemDTO;
import hn.customerservice.dto.ProductDTO;
import hn.customerservice.entity.Cart;
import hn.customerservice.entity.CartItem;
import hn.customerservice.exception.BadRequestException;
import hn.customerservice.exception.InsufficientStockException;
import hn.customerservice.exception.ResourceNotFoundException;
import hn.customerservice.repository.CartItemRepository;
import hn.customerservice.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductClient productClient;

    @Transactional
    public Cart getOrCreateCart(Long customerId, String sessionId) {
        if (customerId != null) {
            Optional<Cart> existing = cartRepository.findByCustomerId(customerId);
            if (existing.isPresent()) {
                return existing.get();
            }
        }
        if (sessionId != null && !sessionId.isBlank()) {
            Optional<Cart> existing = cartRepository.findBySessionId(sessionId);
            if (existing.isPresent()) {
                // If user logged in, associate with customerId
                Cart cart = existing.get();
                if (customerId != null && cart.getCustomerId() == null) {
                    cart.setCustomerId(customerId);
                    cartRepository.save(cart);
                }
                return cart;
            }
        }

        Cart newCart = Cart.builder()
                .customerId(customerId)
                .sessionId(sessionId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return cartRepository.save(newCart);
    }

    public CartDTO getCartDTO(Long customerId, String sessionId) {
        Cart cart = getOrCreateCart(customerId, sessionId);
        return toDTO(cart);
    }

    @Transactional
    public CartDTO addItem(AddToCartRequestDTO dto, Long customerId) {
        ProductDTO product;
        try {
            product = productClient.getById(dto.getProductId());
        } catch (Exception ex) {
            throw new BadRequestException("Không thể kết nối đến máy chủ sản phẩm để kiểm tra thông tin: " + ex.getMessage());
        }

        if (product == null) {
            throw new ResourceNotFoundException("Sản phẩm id=" + dto.getProductId() + " không tồn tại");
        }

        int availableStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        if (availableStock <= 0) {
            throw new InsufficientStockException("Sản phẩm '" + product.getName() + "' hiện đã hết hàng.");
        }

        Cart cart = getOrCreateCart(customerId, dto.getSessionId());

        Optional<CartItem> existingItemOpt = cart.getItems().stream()
                .filter(i -> i.getProductId().equals(dto.getProductId()))
                .findFirst();

        int targetQuantity = dto.getQuantity();
        if (existingItemOpt.isPresent()) {
            targetQuantity += existingItemOpt.get().getQuantity();
        }

        if (targetQuantity > availableStock) {
            throw new InsufficientStockException(
                    String.format("Sản phẩm '%s' chỉ còn %d trong kho, không đủ số lượng %d yêu cầu.",
                            product.getName(), availableStock, targetQuantity)
            );
        }

        BigDecimal price = product.getExportPrice() != null ? product.getExportPrice() : BigDecimal.ZERO;
        String imageUrl = product.getImageUrl();

        if (existingItemOpt.isPresent()) {
            CartItem item = existingItemOpt.get();
            item.setQuantity(targetQuantity);
            item.setUnitPrice(price);
            cartItemRepository.save(item);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .productId(product.getId())
                    .productCode(product.getCode())
                    .productName(product.getName())
                    .unitPrice(price)
                    .quantity(dto.getQuantity())
                    .imageUrl(imageUrl)
                    .build();
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);
        return toDTO(cart);
    }

    @Transactional
    public CartDTO updateItemQuantity(Long itemId, Integer quantity, Long customerId, String sessionId) {
        Cart cart = getOrCreateCart(customerId, sessionId);

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm trong giỏ"));

        ProductDTO product;
        try {
            product = productClient.getById(item.getProductId());
        } catch (Exception ex) {
            throw new BadRequestException("Không thể kiểm tra tồn kho sản phẩm: " + ex.getMessage());
        }

        int availableStock = (product != null && product.getStockQuantity() != null) ? product.getStockQuantity() : 0;
        if (quantity > availableStock) {
            throw new InsufficientStockException(
                    String.format("Sản phẩm '%s' chỉ còn %d trong kho.",
                            item.getProductName(), availableStock)
            );
        }

        item.setQuantity(quantity);
        cartItemRepository.save(item);

        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);
        return toDTO(cart);
    }

    @Transactional
    public CartDTO removeItem(Long itemId, Long customerId, String sessionId) {
        Cart cart = getOrCreateCart(customerId, sessionId);
        cart.getItems().removeIf(i -> i.getId().equals(itemId));
        cartItemRepository.deleteById(itemId);
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);
        return toDTO(cart);
    }

    @Transactional
    public void clearCart(Long customerId, String sessionId) {
        Cart cart = getOrCreateCart(customerId, sessionId);
        cart.getItems().clear();
        cartItemRepository.deleteByCartId(cart.getId());
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);
    }

    public CartDTO toDTO(Cart cart) {
        List<CartItemDTO> itemDTOs = cart.getItems() != null
                ? cart.getItems().stream().map(i -> {
                    BigDecimal unitPrice = i.getUnitPrice() != null ? i.getUnitPrice() : BigDecimal.ZERO;
                    BigDecimal total = unitPrice.multiply(BigDecimal.valueOf(i.getQuantity()));
                    return CartItemDTO.builder()
                            .id(i.getId())
                            .productId(i.getProductId())
                            .productCode(i.getProductCode())
                            .productName(i.getProductName())
                            .unitPrice(unitPrice)
                            .quantity(i.getQuantity())
                            .totalPrice(total)
                            .imageUrl(i.getImageUrl())
                            .build();
                }).collect(Collectors.toList())
                : new ArrayList<>();

        BigDecimal totalAmount = itemDTOs.stream()
                .map(CartItemDTO::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = itemDTOs.stream()
                .mapToInt(CartItemDTO::getQuantity)
                .sum();

        return CartDTO.builder()
                .id(cart.getId())
                .customerId(cart.getCustomerId())
                .sessionId(cart.getSessionId())
                .items(itemDTOs)
                .totalAmount(totalAmount)
                .totalItems(totalItems)
                .build();
    }
}
