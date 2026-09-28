package synelix_backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * A recruiter's shortlist entry for one candidate.
 *
 * <p>Scoped by recruiter email so two companies looking at the same student
 * keep independent shortlists.</p>
 */
@Entity
@Table(
        name = "shortlists",
        uniqueConstraints = @UniqueConstraint(columnNames = {"recruiter_email", "student_id"})
)
public class Shortlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recruiter_email", nullable = false)
    private String recruiterEmail;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    private String status;

    private LocalDateTime createdAt;

    public Shortlist() {
        this.createdAt = LocalDateTime.now();
    }

    public Shortlist(String recruiterEmail, Long studentId, String status) {
        this.recruiterEmail = recruiterEmail;
        this.studentId = studentId;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRecruiterEmail() {
        return recruiterEmail;
    }

    public void setRecruiterEmail(String recruiterEmail) {
        this.recruiterEmail = recruiterEmail;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
