package hn.authservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateUserDTO {
    @NotBlank(message = "Ten dang nhap khong duoc de trong")
    @Size(min = 3, max = 50, message = "Ten dang nhap tu 3 den 50 ky tu")
    private String username;

    @NotBlank(message = "Mat khau khong duoc de trong")
    @Size(min = 6, message = "Mat khau toi thieu 6 ky tu")
    private String password;

    @NotBlank(message = "Ho ten khong duoc de trong")
    private String fullName;

    private String email;
    private String phone;

    @NotBlank(message = "Vai tro khong duoc de trong")
    @Pattern(regexp = "ADMIN|MANAGER|STAFF", message = "Vai tro phai la ADMIN, MANAGER hoac STAFF")
    private String role;

    private Boolean active = true;
}
