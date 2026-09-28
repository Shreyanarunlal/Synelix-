package synelix_backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import synelix_backend.dto.AuthResponse;
import synelix_backend.dto.LoginRequest;
import synelix_backend.dto.RegisterRequest;
import synelix_backend.entity.Role;
import synelix_backend.entity.StudentProfile;
import synelix_backend.entity.User;
import synelix_backend.exception.BadRequestException;
import synelix_backend.repository.StudentProfileRepository;
import synelix_backend.repository.UserRepository;
import synelix_backend.security.JwtService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       StudentProfileRepository studentProfileRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalise(request.getEmail());

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("That email is already registered");
        }
        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new BadRequestException("Password must be at least 8 characters");
        }

        User user = new User(
                request.getName(),
                email,
                passwordEncoder.encode(request.getPassword()),
                request.getRole()
        );
        User saved = userRepository.save(user);

        // A student needs a profile row before any dashboard call can work, so
        // create the shell here rather than failing on first load.
        if (saved.getRole() == Role.STUDENT && !studentProfileRepository.existsByEmail(email)) {
            StudentProfile profile = new StudentProfile();
            profile.setName(saved.getName());
            profile.setEmail(email);
            profile.setTargetRole("Full Stack Developer");
            studentProfileRepository.save(profile);
        }

        return AuthResponse.of(saved, jwtService.generateToken(saved),
                jwtService.getExpirationMs(),
                "Registered successfully as " + saved.getRole().name().toLowerCase());
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalise(request.getEmail());

        // The same message for an unknown email and a wrong password, so the
        // endpoint cannot be used to enumerate registered accounts.
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Invalid email or password");
        }

        return AuthResponse.of(user, jwtService.generateToken(user),
                jwtService.getExpirationMs(),
                "Welcome back, " + user.getName());
    }

    public User requireUser(String email) {
        return userRepository.findByEmail(normalise(email))
                .orElseThrow(() -> new BadRequestException("Unknown user: " + email));
    }

    private static String normalise(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
