package hn.customerservice.config;

import hn.customerservice.security.CustomerJwtAuthFilter;
import hn.customerservice.security.InternalSecretFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomerJwtAuthFilter customerJwtAuthFilter;
    private final InternalSecretFilter internalSecretFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

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
                                    "{\"timestamp\":\"%s\",\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Vui lòng đăng nhập để thực hiện thao tác này.\",\"path\":\"%s\"}",
                                    Instant.now(), request.getRequestURI()
                            );
                            response.getWriter().write(json);
                        })
                        .accessDeniedHandler((request, response, accessEx) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                            String json = String.format(
                                    "{\"timestamp\":\"%s\",\"status\":403,\"error\":\"Forbidden\",\"message\":\"Bạn không có quyền truy cập tài nguyên này.\",\"path\":\"%s\"}",
                                    Instant.now(), request.getRequestURI()
                            );
                            response.getWriter().write(json);
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/customer-auth/**").permitAll()
                        .requestMatchers("/storefront/**").permitAll()
                        .requestMatchers("/internal/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/orders").permitAll()
                        .requestMatchers("/orders/my-orders").authenticated()
                        .requestMatchers("/orders/**").permitAll()
                        .requestMatchers("/error", "/error/**").permitAll()
                        .anyRequest().permitAll()
                )
                .addFilterBefore(internalSecretFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(customerJwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
