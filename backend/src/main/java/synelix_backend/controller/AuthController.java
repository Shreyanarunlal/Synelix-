package synelix_backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import synelix_backend.dto.AuthResponse;
import synelix_backend.dto.LoginRequest;
import synelix_backend.dto.RegisterRequest;
import synelix_backend.service.AuthService;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** Lets the SPA confirm a stored token is still valid on page load. */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "authenticated", false,
                    "message", "No valid session"));
        }
        return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "email", authentication.getName(),
                "authorities", authentication.getAuthorities().toString()));
    }
}
