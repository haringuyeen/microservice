package hn.authservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateUserDTO {
    @NotBlank(message = "Ho ten khong duoc de trong")
    private String fullName;

    private String email;
    private String phone;

    @NotBlank(message = "Vai tro khong duoc de trong")
    @Pattern(regexp = "ADMIN|MANAGER|STAFF", message = "Vai tro phai la ADMIN, MANAGER hoac STAFF")
    private String role;

    private Boolean active;

    private String password; // optional: only update if provided and not blank
}
