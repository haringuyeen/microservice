package hn.warehouseservice.config;

import hn.warehouseservice.security.JwtAuthFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
                        // Internal & public endpoints
                        .requestMatchers("/internal/**", "/error", "/error/**").permitAll()

                        // Reports: Only ADMIN and MANAGER
                        .requestMatchers("/reports/**").hasAnyRole("ADMIN", "MANAGER")

                        // Approve, Reject & Cancel receipts: Only ADMIN and MANAGER
                        .requestMatchers(HttpMethod.PATCH, "/import-receipts/*/approve", "/import-receipts/*/reject", "/import-receipts/*/cancel",
                                                           "/export-receipts/*/approve", "/export-receipts/*/reject", "/export-receipts/*/cancel")
                            .hasAnyRole("ADMIN", "MANAGER")

                        // Delete operations: Only ADMIN and MANAGER (chặn STAFF)
                        .requestMatchers(HttpMethod.DELETE, "/**").hasAnyRole("ADMIN", "MANAGER")

                        // Product & Catalog Management (Create/Edit): ADMIN and MANAGER
                        .requestMatchers(HttpMethod.POST, "/products/**", "/categories/**", "/suppliers/**", "/customers/**")
                            .hasAnyRole("ADMIN", "MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/products/**", "/categories/**", "/suppliers/**", "/customers/**")
                            .hasAnyRole("ADMIN", "MANAGER")

                        // Import & Export Receipts: ADMIN, MANAGER, and STAFF
                        .requestMatchers("/import-receipts", "/import-receipts/**", "/export-receipts", "/export-receipts/**")
                            .hasAnyRole("ADMIN", "MANAGER", "STAFF")

                        // Read catalog: ADMIN, MANAGER, and STAFF
                        .requestMatchers(HttpMethod.GET, "/products", "/products/**", "/categories", "/categories/**", "/suppliers", "/suppliers/**", "/customers", "/customers/**")
                            .hasAnyRole("ADMIN", "MANAGER", "STAFF")

                        // Dashboard
                        .requestMatchers("/dashboard/**").hasAnyRole("ADMIN", "MANAGER", "STAFF")

                        // Any remaining requests must be authenticated
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}