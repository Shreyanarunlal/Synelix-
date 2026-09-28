package synelix_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import synelix_backend.entity.RoadmapTask;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoadmapTaskRepository extends JpaRepository<RoadmapTask, Long> {
    List<RoadmapTask> findByUserEmail(String userEmail);
    Optional<RoadmapTask> findByUserEmailAndTaskId(String userEmail, String taskId);
}
