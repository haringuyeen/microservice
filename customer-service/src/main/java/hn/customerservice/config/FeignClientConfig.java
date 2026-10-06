package hn.customerservice.config;

import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignClientConfig {

    @Value("${internal.secret:wms-partner-key-2026}")
    private String internalSecret;

    @Bean
    public RequestInterceptor internalSecretRequestInterceptor() {
        return requestTemplate -> {
            requestTemplate.header("X-Internal-Secret", internalSecret);
        };
    }
}
