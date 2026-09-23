package hn.authservice.service;

import hn.authservice.dto.CreateUserDTO;
import hn.authservice.dto.UpdateUserDTO;
import hn.authservice.dto.UserDTO;
import hn.authservice.entity.User;
import hn.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Page<UserDTO> searchUsers(String keyword, String role, Boolean active, Pageable pageable) {
        return userRepository.searchUsers(keyword, role, active, pageable)
                .map(this::toDTO);
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay nguoi dung id = " + id));
        return toDTO(user);
    }

    @Transactional
    public UserDTO createUser(CreateUserDTO dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("Ten dang nhap da ton tai");
        }
        if (dto.getEmail() != null && !dto.getEmail().isBlank() && userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email da ton tai");
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setFullName(dto.getFullName());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setRole(dto.getRole().toUpperCase());
        user.setActive(dto.getActive() == null || dto.getActive());

        return toDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO updateUser(Long id, UpdateUserDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay nguoi dung id = " + id));

        if (dto.getEmail() != null && !dto.getEmail().isBlank() && !dto.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(dto.getEmail())) {
                throw new IllegalArgumentException("Email da ton tai");
            }
        }

        user.setFullName(dto.getFullName());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setRole(dto.getRole().toUpperCase());
        if (dto.getActive() != null) {
            user.setActive(dto.getActive());
        }
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        return toDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO toggleStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay nguoi dung id = " + id));
        user.setActive(!Boolean.TRUE.equals(user.getActive()));
        return toDTO(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay nguoi dung id = " + id));
        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new IllegalArgumentException("Khong the xoa tai khoan quan tri mac dinh");
        }
        userRepository.delete(user);
    }

    public UserDTO toDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
