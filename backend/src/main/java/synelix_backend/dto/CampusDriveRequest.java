package synelix_backend.dto;

import jakarta.validation.constraints.NotBlank;

public class CampusDriveRequest {
    @NotBlank(message = "Company is required")
    private String company;

    @NotBlank(message = "Role is required")
    private String role;

    private String date;
    private String salaryPackage;
    private Integer eligibleCount;

    /** Optional published cut-offs; when set, eligibility is computed from the cohort. */
    private Double minCgpa;
    private Integer minReadiness;

    public CampusDriveRequest() {
    }

    public CampusDriveRequest(String company, String role, String date, String salaryPackage, Integer eligibleCount) {
        this.company = company;
        this.role = role;
        this.date = date;
        this.salaryPackage = salaryPackage;
        this.eligibleCount = eligibleCount;
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
