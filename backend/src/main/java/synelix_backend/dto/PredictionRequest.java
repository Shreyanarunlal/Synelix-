package synelix_backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Ad-hoc prediction input.
 *
 * <p>Every field is optional: anything left null falls back to the stored
 * profile, which is what lets the dashboard's what-if sliders send only the
 * one value the student is changing.</p>
 */
public class PredictionRequest {

    private String email;

    @DecimalMin(value = "0.0", message = "CGPA cannot be negative")
    @DecimalMax(value = "10.0", message = "CGPA cannot exceed 10")
    private Double cgpa;

    @Min(value = 0, message = "DSA solved cannot be negative")
    private Integer dsaSolved;

    @Min(value = 0, message = "Aptitude score cannot be negative")
    @Max(value = 100, message = "Aptitude score cannot exceed 100")
    private Integer aptitudeScore;

    @Min(value = 0, message = "Projects count cannot be negative")
    private Integer projectsCount;

    @Min(value = 0, message = "Internship months cannot be negative")
    private Integer internshipsMonths;

    @Min(value = 0, message = "Certifications count cannot be negative")
    private Integer certificationsCount;

    @Min(value = 0, message = "Hackathons won cannot be negative")
    private Integer hackathonsWon;

    @Min(value = 0, message = "Communication score cannot be negative")
    @Max(value = 100, message = "Communication score cannot exceed 100")
    private Integer communicationScore;

    @Min(value = 0, message = "Backlogs cannot be negative")
    private Integer backlogs;

    private String department;
    private String targetRole;

    public PredictionRequest() {
    }

    public PredictionRequest(Double cgpa, Integer dsaSolved, Integer aptitudeScore, Integer projectsCount,
                             Integer internshipsMonths, Integer certificationsCount) {
        this.cgpa = cgpa;
        this.dsaSolved = dsaSolved;
        this.aptitudeScore = aptitudeScore;
        this.projectsCount = projectsCount;
        this.internshipsMonths = internshipsMonths;
        this.certificationsCount = certificationsCount;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Double getCgpa() {
        return cgpa;
    }

    public void setCgpa(Double cgpa) {
        this.cgpa = cgpa;
    }

    public Integer getDsaSolved() {
        return dsaSolved;
    }

    public void setDsaSolved(Integer dsaSolved) {
        this.dsaSolved = dsaSolved;
    }

    public Integer getAptitudeScore() {
        return aptitudeScore;
    }

    public void setAptitudeScore(Integer aptitudeScore) {
        this.aptitudeScore = aptitudeScore;
    }

    public Integer getProjectsCount() {
        return projectsCount;
    }

    public void setProjectsCount(Integer projectsCount) {
        this.projectsCount = projectsCount;
    }

    public Integer getInternshipsMonths() {
        return internshipsMonths;
    }

    public void setInternshipsMonths(Integer internshipsMonths) {
        this.internshipsMonths = internshipsMonths;
    }

    public Integer getCertificationsCount() {
        return certificationsCount;
    }

    public void setCertificationsCount(Integer certificationsCount) {
        this.certificationsCount = certificationsCount;
    }

    public Integer getHackathonsWon() {
        return hackathonsWon;
    }

    public void setHackathonsWon(Integer hackathonsWon) {
        this.hackathonsWon = hackathonsWon;
    }

    public Integer getCommunicationScore() {
        return communicationScore;
    }

    public void setCommunicationScore(Integer communicationScore) {
        this.communicationScore = communicationScore;
    }

    public Integer getBacklogs() {
        return backlogs;
    }

    public void setBacklogs(Integer backlogs) {
        this.backlogs = backlogs;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }
}
