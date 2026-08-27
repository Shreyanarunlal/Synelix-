package synelix_backend.controller;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import synelix_backend.dto.LoginRequest;
import synelix_backend.dto.RegisterRequest;
import synelix_backend.entity.User;
import synelix_backend.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request) {

        try {
            User user = authService.register(request);

            return ResponseEntity.ok(
                    "User registered successfully with ID: "
                            + user.getId()
            );

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request) {

        try {
            User user = authService.login(request);

            return ResponseEntity.ok(
                    "Login successful for "
                            + user.getName()
            );

        } catch (RuntimeException e) {
            return ResponseEntity.status(401)
                    .body(e.getMessage());
        }
    }
}