package hn.customerservice.controller;

import hn.customerservice.dto.*;
import hn.customerservice.service.CartService;
import hn.customerservice.service.StorefrontProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/storefront")
@RequiredArgsConstructor
public class StorefrontController {

    private final StorefrontProductService storefrontProductService;
    private final CartService cartService;

    // --- PRODUCTS & CATEGORIES ---

    @GetMapping("/products")
    public List<ProductDTO> getProducts(
            @RequestParam(required = false) String needTag,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String sortBy
    ) {
        return storefrontProductService.getProducts(needTag, categoryId, minPrice, maxPrice, sortBy);
    }

    @GetMapping("/products/{id}")
    public ProductDTO getProductById(@PathVariable Long id) {
        return storefrontProductService.getProductById(id);
    }

    @GetMapping("/categories")
    public List<CategoryDTO> getCategories() {
        return storefrontProductService.getCategories();
    }

    // --- CART ---

    @GetMapping("/cart")
    public CartDTO getCart(
            Authentication authentication,
            @RequestParam(required = false) String sessionId
    ) {
        Long customerId = extractCustomerId(authentication);
        return cartService.getCartDTO(customerId, sessionId);
    }

    @PostMapping("/cart/items")
    @ResponseStatus(HttpStatus.CREATED)
    public CartDTO addToCart(
            Authentication authentication,
            @Valid @RequestBody AddToCartRequestDTO dto
    ) {
        Long customerId = extractCustomerId(authentication);
        return cartService.addItem(dto, customerId);
    }

    @PutMapping("/cart/items/{itemId}")
    public CartDTO updateCartItem(
            Authentication authentication,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemDTO dto,
            @RequestParam(required = false) String sessionId
    ) {
        Long customerId = extractCustomerId(authentication);
        return cartService.updateItemQuantity(itemId, dto.getQuantity(), customerId, sessionId);
    }

    @DeleteMapping("/cart/items/{itemId}")
    public CartDTO removeCartItem(
            Authentication authentication,
            @PathVariable Long itemId,
            @RequestParam(required = false) String sessionId
    ) {
        Long customerId = extractCustomerId(authentication);
        return cartService.removeItem(itemId, customerId, sessionId);
    }

    @DeleteMapping("/cart")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearCart(
            Authentication authentication,
            @RequestParam(required = false) String sessionId
    ) {
        Long customerId = extractCustomerId(authentication);
        cartService.clearCart(customerId, sessionId);
    }

    private Long extractCustomerId(Authentication authentication) {
        if (authentication != null && authentication.getCredentials() instanceof Long userId) {
            return userId;
        }
        return null;
    }
}
