package hn.customerservice.service;

import hn.customerservice.dto.CustomerAuthResponseDTO;
import hn.customerservice.dto.CustomerLoginDTO;
import hn.customerservice.dto.CustomerRegisterDTO;
import hn.customerservice.dto.CustomerUserDTO;
import hn.customerservice.entity.CustomerUser;
import hn.customerservice.exception.BadRequestException;
import hn.customerservice.exception.ResourceNotFoundException;
import hn.customerservice.repository.CustomerUserRepository;
import hn.customerservice.security.CustomerJwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomerAuthService {

    private final CustomerUserRepository customerUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomerJwtUtil customerJwtUtil;

    @Transactional
    public CustomerAuthResponseDTO register(CustomerRegisterDTO dto) {
        String email = dto.getEmail().trim().toLowerCase();
        if (customerUserRepository.existsByEmail(email)) {
            throw new BadRequestException("Email '" + email + "' đã được sử dụng. Vui lòng chọn email khác.");
        }

        CustomerUser user = CustomerUser.builder()
                .email(email)
                .password(passwordEncoder.encode(dto.getPassword()))
                .fullName(dto.getFullName().trim())
                .phone(dto.getPhone() != null ? dto.getPhone().trim() : null)
                .address(dto.getAddress() != null ? dto.getAddress().trim() : null)
                .status("ACTIVE")
                .build();

        user = customerUserRepository.save(user);

        String token = customerJwtUtil.generateToken(user.getId(), user.getEmail(), user.getFullName());
        return CustomerAuthResponseDTO.builder()
                .token(token)
                .user(toDTO(user))
                .build();
    }

    public CustomerAuthResponseDTO login(CustomerLoginDTO dto) {
        String email = dto.getEmail().trim().toLowerCase();
        CustomerUser user = customerUserRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Email hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BadRequestException("Email hoặc mật khẩu không chính xác");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new BadRequestException("Tài khoản của bạn đã bị khóa");
        }

        String token = customerJwtUtil.generateToken(user.getId(), user.getEmail(), user.getFullName());
        return CustomerAuthResponseDTO.builder()
                .token(token)
                .user(toDTO(user))
                .build();
    }

    public CustomerUserDTO getProfile(Long userId) {
        CustomerUser user = customerUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin khách hàng"));
        return toDTO(user);
    }

    @Transactional
    public CustomerUserDTO updateProfile(Long userId, CustomerUserDTO dto) {
        CustomerUser user = customerUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin khách hàng"));

        if (dto.getFullName() != null && !dto.getFullName().isBlank()) {
            user.setFullName(dto.getFullName().trim());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone().trim());
        }
        if (dto.getAddress() != null) {
            user.setAddress(dto.getAddress().trim());
        }

        return toDTO(customerUserRepository.save(user));
    }

    public CustomerUserDTO toDTO(CustomerUser user) {
        return CustomerUserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
