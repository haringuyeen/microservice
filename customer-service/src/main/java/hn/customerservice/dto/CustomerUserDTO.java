package hn.customerservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerUserDTO {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private String status;
    private LocalDateTime createdAt;
}
