package synelix_backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "campus_drives")
public class CampusDrive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String company;

    @Column(nullable = false)
    private String role;

    private String date;
    private String salaryPackage;
    private Integer eligibleCount;
    private String status;

    /** Published cut-offs, used to compute the eligible cohort. */
    private Double minCgpa;
    private Integer minReadiness;

    public CampusDrive() {
    }

    public CampusDrive(String company, String role, String date, String salaryPackage, Integer eligibleCount, String status) {
        this.company = company;
        this.role = role;
        this.date = date;
        this.salaryPackage = salaryPackage;
        this.eligibleCount = eligibleCount;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getSalaryPackage() {
        return salaryPackage;
    }

    public void setSalaryPackage(String salaryPackage) {
        this.salaryPackage = salaryPackage;
    }

    public Integer getEligibleCount() {
        return eligibleCount;
    }

    public void setEligibleCount(Integer eligibleCount) {
        this.eligibleCount = eligibleCount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getMinCgpa() {
        return minCgpa;
    }

    public void setMinCgpa(Double minCgpa) {
        this.minCgpa = minCgpa;
    }

    public Integer getMinReadiness() {
        return minReadiness;
    }

    public void setMinReadiness(Integer minReadiness) {
        this.minReadiness = minReadiness;
    }
}
