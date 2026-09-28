package synelix_backend.security;

import org.junit.jupiter.api.Test;
import synelix_backend.entity.Role;
import synelix_backend.entity.User;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET =
            "test-only-secret-key-at-least-32-bytes-long!!";

    private final JwtService jwtService = new JwtService(SECRET, 60_000);

    private static User user() {
        User user = new User("Arjun Karthik", "arjun@college.edu", "hashed", Role.STUDENT);
        user.setId(7L);
        return user;
    }

    @Test
    void roundTripsSubjectAndRole() {
        String token = jwtService.generateToken(user());

        assertThat(jwtService.extractEmail(token)).isEqualTo("arjun@college.edu");
        assertThat(jwtService.extractRole(token)).isEqualTo(Role.STUDENT);
        assertThat(jwtService.isValid(token)).isTrue();
    }

    @Test
    void rejectsATokenSignedWithADifferentKey() {
        JwtService other = new JwtService(
                "a-completely-different-secret-key-32-bytes+", 60_000);
        String foreignToken = other.generateToken(user());

        assertThat(jwtService.isValid(foreignToken)).isFalse();
    }

    @Test
    void rejectsATamperedToken() {
        String token = jwtService.generateToken(user());
        // Flip a character in the payload segment; the signature no longer matches.
        String[] parts = token.split("\\.");
        String tampered = parts[0] + "." + parts[1].substring(0, parts[1].length() - 2)
                + "XY." + parts[2];

        assertThat(jwtService.isValid(tampered)).isFalse();
    }

    @Test
    void rejectsGarbage() {
        assertThat(jwtService.isValid("not-a-token")).isFalse();
        assertThat(jwtService.isValid("")).isFalse();
    }

    @Test
    void treatsAnExpiredTokenAsInvalid() throws InterruptedException {
        JwtService shortLived = new JwtService(SECRET, 1);
        String token = shortLived.generateToken(user());
        Thread.sleep(50);

        assertThat(shortLived.isValid(token)).isFalse();
    }

    @Test
    void refusesASecretTooShortToSignSafely() {
        assertThatThrownBy(() -> new JwtService("short", 60_000))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 bytes");
    }
}
