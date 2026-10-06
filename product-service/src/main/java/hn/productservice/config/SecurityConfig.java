package hn.productservice.config;

import hn.productservice.security.JwtAuthFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authEx) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                            String json = String.format(
                                    "{\"timestamp\":\"%s\",\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Yêu cầu đăng nhập để truy cập tài nguyên này.\",\"path\":\"%s\"}",
                                    Instant.now(), request.getRequestURI()
                            );
                            response.getWriter().write(json);
                        })
                        .accessDeniedHandler((request, response, accessEx) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                            String json = String.format(
                                    "{\"timestamp\":\"%s\",\"status\":403,\"error\":\"Forbidden\",\"message\":\"Bạn không có quyền thực hiện thao tác này.\",\"path\":\"%s\"}",
                                    Instant.now(), request.getRequestURI()
                            );
                            response.getWriter().write(json);
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        // Cho phép gọi điều chỉnh tồn kho và thống kê nội bộ từ các microservices khác
                        .requestMatchers(HttpMethod.POST, "/products/*/adjust-stock").permitAll()
                        .requestMatchers(HttpMethod.GET, "/products/stats").permitAll()
                        .requestMatchers(HttpMethod.GET, "/products/low-stock").permitAll()
                        .requestMatchers(HttpMethod.GET, "/products/all").permitAll()
                        .requestMatchers(HttpMethod.GET, "/products/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/suppliers/*").permitAll()
                        .requestMatchers("/error", "/error/**").permitAll()

                        // Xoá sản phẩm, danh mục, NCC: chỉ ADMIN và MANAGER
                        .requestMatchers(HttpMethod.DELETE, "/**").hasAnyRole("ADMIN", "MANAGER")

                        // Thêm / sửa: ADMIN và MANAGER
                        .requestMatchers(HttpMethod.POST, "/products/**", "/categories/**", "/suppliers/**")
                            .hasAnyRole("ADMIN", "MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/products/**", "/categories/**", "/suppliers/**")
                            .hasAnyRole("ADMIN", "MANAGER")

                        // Xem danh sách và chi tiết: ADMIN, MANAGER, STAFF
                        .requestMatchers(HttpMethod.GET, "/products/**", "/categories/**", "/suppliers/**")
                            .hasAnyRole("ADMIN", "MANAGER", "STAFF")

                        // Mọi request còn lại yêu cầu đăng nhập
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
