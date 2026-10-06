package hn.customerservice.controller;

import hn.customerservice.dto.CustomerAuthResponseDTO;
import hn.customerservice.dto.CustomerLoginDTO;
import hn.customerservice.dto.CustomerRegisterDTO;
import hn.customerservice.dto.CustomerUserDTO;
import hn.customerservice.service.CustomerAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/customer-auth")
@RequiredArgsConstructor
public class CustomerAuthController {

    private final CustomerAuthService customerAuthService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerAuthResponseDTO register(@Valid @RequestBody CustomerRegisterDTO dto) {
        return customerAuthService.register(dto);
    }

    @PostMapping("/login")
    public CustomerAuthResponseDTO login(@Valid @RequestBody CustomerLoginDTO dto) {
        return customerAuthService.login(dto);
    }

    @GetMapping("/profile")
    public CustomerUserDTO getProfile(Authentication authentication) {
        if (authentication == null || !(authentication.getCredentials() instanceof Long userId)) {
            throw new IllegalArgumentException("Yêu cầu đăng nhập");
        }
        return customerAuthService.getProfile(userId);
    }

    @PutMapping("/profile")
    public CustomerUserDTO updateProfile(Authentication authentication, @RequestBody CustomerUserDTO dto) {
        if (authentication == null || !(authentication.getCredentials() instanceof Long userId)) {
            throw new IllegalArgumentException("Yêu cầu đăng nhập");
        }
        return customerAuthService.updateProfile(userId, dto);
    }
}
