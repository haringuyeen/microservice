package hn.warehouseservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierDTO {
    private Long id;

    @NotBlank(message = "Ma nha cung cap khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten nha cung cap khong duoc de trong")
    private String name;

    private String address;

    @NotBlank(message = "So dien thoai khong duoc de trong")
    private String phone;

    private String email;
    private String contactPerson;
}