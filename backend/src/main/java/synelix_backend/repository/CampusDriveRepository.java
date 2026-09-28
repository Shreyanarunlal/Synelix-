package synelix_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import synelix_backend.entity.CampusDrive;

import java.util.List;

@Repository
public interface CampusDriveRepository extends JpaRepository<CampusDrive, Long> {
    List<CampusDrive> findByStatus(String status);
}
