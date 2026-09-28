package synelix_backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "student_skills")
public class StudentSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Owning profile.
     *
     * <p>Deliberately has no getter: that keeps the back-reference out of JSON
     * (which would otherwise recurse profile -> skills -> profile) without
     * depending on a Jackson annotation. JPA reads the field directly.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private StudentProfile student;

    @Column(nullable = false)
    private String name;

    /** Self-reported proficiency, 0-100. The ML layer damps this against evidence. */
    private Integer level;

    private String category;

    public StudentSkill() {
    }

    public StudentSkill(String name, Integer level, String category) {
        this.name = name;
        this.level = level;
        this.category = category;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setStudent(StudentProfile student) {
        this.student = student;
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
