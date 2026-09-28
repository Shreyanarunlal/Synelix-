package synelix_backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "roadmap_tasks")
public class RoadmapTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;
    private String weekPhase;
    private String taskId;
    private String title;
    private Boolean done;

    public RoadmapTask() {
    }

    public RoadmapTask(String userEmail, String weekPhase, String taskId, String title, Boolean done) {
        this.userEmail = userEmail;
        this.weekPhase = weekPhase;
        this.taskId = taskId;
        this.title = title;
        this.done = done;
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

    public String getWeekPhase() {
        return weekPhase;
    }

    public void setWeekPhase(String weekPhase) {
        this.weekPhase = weekPhase;
    }

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Boolean getDone() {
        return done;
    }

    public void setDone(Boolean done) {
        this.done = done;
    }
}
