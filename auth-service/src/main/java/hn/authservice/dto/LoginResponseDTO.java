package hn.authservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponseDTO {
    private Long userId;
    private String token;
    private String username;
    private String role;
    private String fullName;
    private String email;
}