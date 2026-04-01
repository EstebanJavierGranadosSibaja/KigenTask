package com.kigentask.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final UserDetailsService userDetailsService;
        private final PasswordEncoder passwordEncoder;

        public SecurityConfig(
                        JwtAuthenticationFilter jwtAuthenticationFilter,
                        UserDetailsService userDetailsService,
                        PasswordEncoder passwordEncoder
        ) {
                this.jwtAuthenticationFilter = jwtAuthenticationFilter;
                this.userDetailsService = userDetailsService;
                this.passwordEncoder = passwordEncoder;
        }

    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/v1/auth/**",
            "/api/v1/health",
            "/actuator/health"
    };

        @Bean
        public AuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
                provider.setPasswordEncoder(passwordEncoder);
                return provider;
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
                return authConfig.getAuthenticationManager();
        }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authenticationProvider(authenticationProvider())
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .anyRequest().authenticated())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .build();
    }
}