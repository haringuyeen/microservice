package hn.authservice.config;

import hn.authservice.entity.User;
import hn.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        userRepository.findByUsername("admin").ifPresentOrElse(admin -> {
            admin.setFullName("Quản trị viên Hệ thống");
            admin.setEmail("admin@wms.com");
            admin.setPhone("0901234567");
            admin.setRole("ADMIN");
            admin.setActive(true);
            userRepository.save(admin);
        }, () -> {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFullName("Quản trị viên Hệ thống");
            admin.setEmail("admin@wms.com");
            admin.setPhone("0901234567");
            admin.setRole("ADMIN");
            admin.setActive(true);
            userRepository.save(admin);
        });

        userRepository.findByUsername("manager").ifPresentOrElse(manager -> {
            manager.setFullName("Quản lý kho Nguyễn Văn B");
            manager.setEmail("manager@wms.com");
            manager.setPhone("0912345678");
            manager.setRole("MANAGER");
            manager.setActive(true);
            userRepository.save(manager);
        }, () -> {
            User manager = new User();
            manager.setUsername("manager");
            manager.setPassword(passwordEncoder.encode("manager123"));
            manager.setFullName("Quản lý kho Nguyễn Văn B");
            manager.setEmail("manager@wms.com");
            manager.setPhone("0912345678");
            manager.setRole("MANAGER");
            manager.setActive(true);
            userRepository.save(manager);
        });

        userRepository.findByUsername("staff").ifPresentOrElse(staff -> {
            staff.setFullName("Nhân viên kho Lê Thị C");
            staff.setEmail("staff@wms.com");
            staff.setPhone("0923456789");
            staff.setRole("STAFF");
            staff.setActive(true);
            userRepository.save(staff);
        }, () -> {
            User staff = new User();
            staff.setUsername("staff");
            staff.setPassword(passwordEncoder.encode("staff123"));
            staff.setFullName("Nhân viên kho Lê Thị C");
            staff.setEmail("staff@wms.com");
            staff.setPhone("0923456789");
            staff.setRole("STAFF");
            staff.setActive(true);
            userRepository.save(staff);
        });
    }
} 

