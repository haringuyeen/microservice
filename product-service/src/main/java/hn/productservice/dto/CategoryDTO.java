package hn.productservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDTO {
    private Long id;

    @NotBlank(message = "Ma danh muc khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten danh muc khong duoc de trong")
    private String name;

    private String description;
}
