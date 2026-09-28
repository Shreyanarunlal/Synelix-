package synelix_backend.dto;

public class ResumeAnalyzeRequest {

    private String resumeText;
    private String fileName;
    private String targetRole;

    public ResumeAnalyzeRequest() {
    }

    public ResumeAnalyzeRequest(String resumeText, String fileName) {
        this.resumeText = resumeText;
        this.fileName = fileName;
    }

    public String getResumeText() {
        return resumeText;
    }

    public void setResumeText(String resumeText) {
        this.resumeText = resumeText;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }
}
