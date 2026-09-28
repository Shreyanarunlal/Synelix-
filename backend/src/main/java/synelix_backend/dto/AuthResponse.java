package synelix_backend.dto;

import synelix_backend.entity.Role;
import synelix_backend.entity.User;

/**
 * Auth result.
 *
 * <p>The frontend routes on {@code role} and stores {@code token}, so both are
 * returned as structured fields rather than embedded in a message string.</p>
 */
public class AuthResponse {

    private boolean success;
    private String message;
    private String token;
    private Long expiresInMs;
    private UserSummary user;

    public AuthResponse() {
    }

    public static AuthResponse of(User user, String token, long expiresInMs, String message) {
        AuthResponse response = new AuthResponse();
        response.success = true;
        response.message = message;
        response.token = token;
        response.expiresInMs = expiresInMs;
        response.user = new UserSummary(user.getId(), user.getName(), user.getEmail(), user.getRole());
        return response;
    }

    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
        private Role role;

        public UserSummary() {
        }

        public UserSummary(Long id, String name, String email, Role role) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.role = role;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public Role getRole() {
            return role;
        }

        public void setRole(Role role) {
            this.role = role;
        }
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getExpiresInMs() {
        return expiresInMs;
    }

    public void setExpiresInMs(Long expiresInMs) {
        this.expiresInMs = expiresInMs;
    }

    public UserSummary getUser() {
        return user;
    }

    public void setUser(UserSummary user) {
        this.user = user;
    }
}
