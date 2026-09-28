package synelix_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import synelix_backend.entity.Role;
import synelix_backend.entity.User;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

/** Issues and validates the signed tokens the SPA sends on every request. */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(@Value("${synelix.jwt.secret}") String secret,
                      @Value("${synelix.jwt.expiration-ms}") long expirationMs) {
        this.key = buildKey(secret);
        this.expirationMs = expirationMs;
    }

    /**
     * Accepts either a base64-encoded secret or a raw string, so the property
     * can be set without callers having to know which form is expected.
     */
    private static SecretKey buildKey(String secret) {
        byte[] bytes;
        try {
            bytes = Decoders.BASE64.decode(secret);
        } catch (DecodingException | IllegalArgumentException notBase64) {
            // jjwt signals a bad encoding with its own DecodingException, which
            // is not an IllegalArgumentException - catching only the latter
            // would let a plain-text secret fail startup instead of being used
            // as raw bytes.
            bytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        if (bytes.length < 32) {
            throw new IllegalStateException(
                    "synelix.jwt.secret must decode to at least 32 bytes for HS256");
        }
        return Keys.hmacShaKeyFor(bytes);
    }

    public String generateToken(User user) {
        Date now = new Date();
        return Jwts.builder()
                .subject(user.getEmail())
                .claims(Map.of(
                        "role", user.getRole().name(),
                        "name", user.getName(),
                        "uid", user.getId()
                ))
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return parse(token).getSubject();
    }

    public Role extractRole(String token) {
        return Role.valueOf(parse(token).get("role", String.class));
    }

    public boolean isValid(String token) {
        try {
            return parse(token).getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public long getExpirationMs() {
        return expirationMs;
    }
}
