package synelix_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prediction_records")
public class PredictionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;
    private Double cgpa;
    private Integer dsaSolved;
    private Integer aptitudeScore;
    private Integer projectsCount;
    private Integer internshipsMonths;
    private Integer certificationsCount;

    private Integer probability;
    private String tier;
    private Double minCtc;
    private Double maxCtc;

    /** Which scorer produced this row: "synelix-ml" or "heuristic-fallback". */
    private String modelSource;

    private LocalDateTime createdAt;

    public PredictionRecord() {
        this.createdAt = LocalDateTime.now();
    }

    public PredictionRecord(String userEmail, Double cgpa, Integer dsaSolved, Integer aptitudeScore,
                            Integer projectsCount, Integer internshipsMonths, Integer certificationsCount,
                            Integer probability, String tier, Double minCtc, Double maxCtc) {
        this.userEmail = userEmail;
        this.cgpa = cgpa;
        this.dsaSolved = dsaSolved;
        this.aptitudeScore = aptitudeScore;
        this.projectsCount = projectsCount;
        this.internshipsMonths = internshipsMonths;
        this.certificationsCount = certificationsCount;
        this.probability = probability;
        this.tier = tier;
        this.minCtc = minCtc;
        this.maxCtc = maxCtc;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
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

    public Integer getProbability() {
        return probability;
    }

    public void setProbability(Integer probability) {
        this.probability = probability;
    }

    public String getTier() {
        return tier;
    }

    public void setTier(String tier) {
        this.tier = tier;
    }

    public Double getMinCtc() {
        return minCtc;
    }

    public void setMinCtc(Double minCtc) {
        this.minCtc = minCtc;
    }

    public Double getMaxCtc() {
        return maxCtc;
    }

    public void setMaxCtc(Double maxCtc) {
        this.maxCtc = maxCtc;
    }

    public String getModelSource() {
        return modelSource;
    }

    public void setModelSource(String modelSource) {
        this.modelSource = modelSource;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
