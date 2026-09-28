package synelix_backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

/** Create/update payload for a student profile. */
public class StudentProfileRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String name;
    private String phone;
    private String rollNumber;
    private String college;
    private String department;
    private Integer graduationYear;

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

    private String targetRole;
    private List<SkillInput> skills;

    public static class SkillInput {
        private String name;
        private Integer level;
        private String category;

        public SkillInput() {
        }

        public SkillInput(String name, Integer level, String category) {
            this.name = name;
            this.level = level;
            this.category = category;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Integer getLevel() {
            return level;
        }

        public void setLevel(Integer level) {
            this.level = level;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getRollNumber() {
        return rollNumber;
    }

    public void setRollNumber(String rollNumber) {
        this.rollNumber = rollNumber;
    }

    public String getCollege() {
        return college;
    }

    public void setCollege(String college) {
        this.college = college;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Integer getGraduationYear() {
        return graduationYear;
    }

    public void setGraduationYear(Integer graduationYear) {
        this.graduationYear = graduationYear;
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

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    public List<SkillInput> getSkills() {
        return skills;
    }

    public void setSkills(List<SkillInput> skills) {
        this.skills = skills;
    }
}
