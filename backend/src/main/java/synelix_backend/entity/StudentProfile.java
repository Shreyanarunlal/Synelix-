package synelix_backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "student_profiles")
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;
    private String rollNumber;
    private String college;
    private String department;
    private Integer graduationYear;

    // Signals fed to the ML placement model.
    private Double cgpa;
    private Integer dsaSolved;
    private Integer aptitudeScore;
    private Integer projectsCount;
    private Integer internshipsMonths;
    private Integer certificationsCount;
    private Integer hackathonsWon;
    private Integer communicationScore;
    private Integer backlogs;

    private String targetRole;

    // Cached output of the most recent prediction, so recruiter search and
    // institution analytics can filter without re-scoring every student.
    private Integer placementProbability;
    private String predictedTier;
    private Double expectedCtc;
    private String cohort;
    private LocalDateTime lastPredictedAt;

    private Boolean placed;
    private String placedCompany;
    private Double placedCtc;

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<StudentSkill> skills = new ArrayList<>();

    public StudentProfile() {
    }

    public StudentProfile(String name, String email, String college, String department, Integer graduationYear,
                          Double cgpa, Integer dsaSolved, Integer aptitudeScore, Integer projectsCount,
                          Integer internshipsMonths, Integer certificationsCount, String targetRole) {
        this.name = name;
        this.email = email;
        this.college = college;
        this.department = department;
        this.graduationYear = graduationYear;
        this.cgpa = cgpa;
        this.dsaSolved = dsaSolved;
        this.aptitudeScore = aptitudeScore;
        this.projectsCount = projectsCount;
        this.internshipsMonths = internshipsMonths;
        this.certificationsCount = certificationsCount;
        this.targetRole = targetRole;
    }

    /** Initials used as the avatar label in the dashboards. */
    public String getAvatar() {
        if (name == null || name.isBlank()) {
            return "?";
        }
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, 1).toUpperCase();
        }
        return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
    }

    public void addSkill(StudentSkill skill) {
        skill.setStudent(this);
        this.skills.add(skill);
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

    public Integer getPlacementProbability() {
        return placementProbability;
    }

    public void setPlacementProbability(Integer placementProbability) {
        this.placementProbability = placementProbability;
    }

    public String getPredictedTier() {
        return predictedTier;
    }

    public void setPredictedTier(String predictedTier) {
        this.predictedTier = predictedTier;
    }

    public Double getExpectedCtc() {
        return expectedCtc;
    }

    public void setExpectedCtc(Double expectedCtc) {
        this.expectedCtc = expectedCtc;
    }

    public String getCohort() {
        return cohort;
    }

    public void setCohort(String cohort) {
        this.cohort = cohort;
    }

    public LocalDateTime getLastPredictedAt() {
        return lastPredictedAt;
    }

    public void setLastPredictedAt(LocalDateTime lastPredictedAt) {
        this.lastPredictedAt = lastPredictedAt;
    }

    public Boolean getPlaced() {
        return placed;
    }

    public void setPlaced(Boolean placed) {
        this.placed = placed;
    }

    public String getPlacedCompany() {
        return placedCompany;
    }

    public void setPlacedCompany(String placedCompany) {
        this.placedCompany = placedCompany;
    }

    public Double getPlacedCtc() {
        return placedCtc;
    }

    public void setPlacedCtc(Double placedCtc) {
        this.placedCtc = placedCtc;
    }

    public List<StudentSkill> getSkills() {
        return skills;
    }

    public void setSkills(List<StudentSkill> skills) {
        this.skills = skills;
    }
}
