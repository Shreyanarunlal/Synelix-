package synelix_backend.dto;

public class CopilotChatResponse {
    private String reply;
    private String source;

    public CopilotChatResponse() {
    }

    public CopilotChatResponse(String reply, String source) {
        this.reply = reply;
        this.source = source;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
