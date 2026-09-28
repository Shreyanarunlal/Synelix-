package synelix_backend.dto;

public class CopilotChatRequest {
    private String query;
    private String role;

    public CopilotChatRequest() {
    }

    public CopilotChatRequest(String query, String role) {
        this.query = query;
        this.role = role;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
