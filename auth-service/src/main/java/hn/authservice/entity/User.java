package hn.authservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "app_user")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false)
    private String password; // luon luu dang da ma hoa BCrypt, khong bao gio luu plain text

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(length = 150, unique = true)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(nullable = false, length = 20)
    private String role; // "ADMIN", "MANAGER", "STAFF"

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = java.time.LocalDateTime.now();
        }
        if (active == null) {
            active = true;
        }
    }
}